import { google } from 'googleapis';
import { createOAuthClient, loadSavedToken } from '../auth/oauth.js';

export class GmailEngine {
  private gmail: any;

  constructor(auth: any) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly MIN_DELAY = 100; // 100ms between requests

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;

      if (timeSinceLast < this.MIN_DELAY) {
        await new Promise(r => setTimeout(r, this.MIN_DELAY - timeSinceLast));
      }

      await request();
      this.lastRequestTime = Date.now();
    }

    this.processing = false;
  }

  private throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }












  async getMyEmail(): Promise<string> {
    return this.throttle(async () => {
      const res = await this.gmail.users.getProfile({ userId: 'me' });
      return res.data.emailAddress;
    });
  }

  async ensureLabel(name: string): Promise<string> {
    return this.throttle(async () => {
      const res = await this.gmail.users.labels.list({ userId: 'me' });
      const existing = res.data.labels.find((l: any) => l.name === name);
      if (existing) return existing.id;
      const created = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
      });
      return created.data.id;
    });
  }

  async insertMessage(labelId: string, subject: string, body: string): Promise<string> {
    return this.throttle(async () => {
      const myEmail = await this.getMyEmail();
      const raw = this.buildRaw(myEmail, subject, body);
      const res = await this.gmail.users.messages.insert({
        userId: 'me',
        requestBody: { raw, labelIds: [labelId] },
      });
      return res.data.id;
    });
  }

  async listMessages(labelId: string): Promise<any[]> {
    return this.throttle(async () => {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: [labelId],
        maxResults: 100,
      });
      return res.data.messages || [];
    });
  }

  async getMessage(id: string): Promise<any> {
    return this.throttle(async () => {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      });
      return res.data;
    });
  }

  async trashMessage(id: string): Promise<void> {
    return this.throttle(async () => {
      await this.gmail.users.messages.trash({ userId: 'me', id });
    });
  }







  parseBody(message: any): string {
    const parts = message.payload?.parts;
    if (parts) {
      const part = parts.find((p: any) => p.mimeType === 'text/plain');
      if (part?.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
    const data = message.payload?.body?.data;
    if (data) return Buffer.from(data, 'base64').toString('utf-8');
    return '';
  }

  private buildRaw(email: string, subject: string, body: string): string {
    const msg = [
      `From: ${email}`,
      `To: ${email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    return Buffer.from(msg)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }






  //         UPLOAD FILE CODE        //






async uploadFile(labelId: string, filename: string, mimeType: string, fileBuffer: Buffer): Promise<string> {
  const myEmail = await this.getMyEmail();
  const boundary = 'gmaildb_boundary';

  const fileBase64 = fileBuffer.toString('base64');

  const raw = [
    `From: ${myEmail}`,
    `To: ${myEmail}`,
    `Subject: gmaildb:file:${filename}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    JSON.stringify({ filename, mimeType, uploadedAt: new Date().toISOString() }),
    '',
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    fileBase64,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await this.gmail.users.messages.insert({
    userId: 'me',
    requestBody: { raw: encoded, labelIds: [labelId] },
  });
  return res.data.id;
}

async getAttachment(messageId: string): Promise<{ data: Buffer; filename: string; mimeType: string }> {
  const msg = await this.gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const parts = msg.data.payload?.parts || [];
  const attachment = parts.find((p: any) => p.filename && p.body?.attachmentId);
  const metadata = parts.find((p: any) => p.mimeType === 'text/plain');

  if (!attachment) throw new Error('No attachment found');

  const attRes = await this.gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachment.body.attachmentId,
  });

  const data = Buffer.from(attRes.data.data, 'base64');
  const meta = JSON.parse(
    Buffer.from(metadata?.body?.data || '', 'base64').toString('utf-8')
  );

  return { data, filename: meta.filename, mimeType: meta.mimeType };
}






}

export async function createEngine(): Promise<GmailEngine> {
  const auth = createOAuthClient();
  if (!loadSavedToken(auth)) throw new Error('Not authenticated. Run: npm run auth');
  return new GmailEngine(auth);
}








