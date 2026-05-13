import { google } from 'googleapis';
import { createOAuthClient, loadSavedToken } from '../auth/oauth.js';

export class GmailEngine {
  private gmail: any;

  constructor(auth: any) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async getMyEmail(): Promise<string> {
    const res = await this.gmail.users.getProfile({ userId: 'me' });
    return res.data.emailAddress;
  }

  async ensureLabel(name: string): Promise<string> {
    const res = await this.gmail.users.labels.list({ userId: 'me' });
    const existing = res.data.labels.find((l: any) => l.name === name);
    if (existing) return existing.id;

    const created = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
    });
    return created.data.id;
  }

  async insertMessage(labelId: string, subject: string, body: string): Promise<string> {
    const myEmail = await this.getMyEmail();
    const raw = this.buildRaw(myEmail, subject, body);

    const res = await this.gmail.users.messages.insert({
      userId: 'me',
      requestBody: { raw, labelIds: [labelId] },
    });
    return res.data.id;
  }

  async listMessages(labelId: string): Promise<any[]> {
    const res = await this.gmail.users.messages.list({
      userId: 'me',
      labelIds: [labelId],
      maxResults: 100,
    });
    return res.data.messages || [];
  }

  async getMessage(id: string): Promise<any> {
    const res = await this.gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });
    return res.data;
  }

  async trashMessage(id: string): Promise<void> {
    await this.gmail.users.messages.trash({ userId: 'me', id });
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
}

export async function createEngine(): Promise<GmailEngine> {
  const auth = createOAuthClient();
  if (!loadSavedToken(auth)) throw new Error('Not authenticated. Run: npm run auth');
  return new GmailEngine(auth);
}