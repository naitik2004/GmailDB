import { GmailEngine } from '../core/engine.js';
import { cache } from '../core/cache.js';
import { randomUUID } from 'crypto';
import { syncCollection } from '../core/sync.js';
import { encrypt, decrypt } from '../core/encryption.js';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.GMAILDB_SECRET || 'default_secret';

export class Collection {
  constructor(
    private name: string,
    private engine: GmailEngine
  ) {}

  async insert(data: Record<string, any>): Promise<{ id: string; msgId: string; data: Record<string, any> }> {
    const docId = randomUUID();
    const dataWithId = { ...data, _id: docId };
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const encrypted = encrypt(JSON.stringify(dataWithId), SECRET);
    const msgId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, encrypted);
    cache.set(msgId, this.name, dataWithId);
    return { id: docId, msgId, data: dataWithId };
  }

  async find(filter?: Record<string, any>): Promise<any[]> {
    await syncCollection(this.engine, this.name);
    return cache.find(this.name, filter);
  }

  async findOne(filter: Record<string, any>): Promise<any | null> {
    const results = await this.find(filter);
    return results[0] || null;
  }

  async update(filter: Record<string, any>, changes: Record<string, any>): Promise<number> {
    await syncCollection(this.engine, this.name);
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);
    let updated = 0;

    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        let doc: any;
        try {
          const decrypted = decrypt(body, SECRET);
          doc = JSON.parse(decrypted);
        } catch {
          doc = JSON.parse(body);
        }
        if (this.matches(doc, filter)) {
          const newDoc = { ...doc, ...changes };
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          const encrypted = encrypt(JSON.stringify(newDoc), SECRET);
          const newId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, encrypted);
          cache.set(newId, this.name, newDoc);
          updated++;
        }
      } catch {}
    }
    return updated;
  }

  async deleteOne(filter: string | Record<string, any>): Promise<void> {
    await syncCollection(this.engine, this.name);
    const query = typeof filter === 'string' ? { _id: filter } : filter;
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);

    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        let doc: any;
        try {
          const decrypted = decrypt(body, SECRET);
          doc = JSON.parse(decrypted);
        } catch {
          doc = JSON.parse(body);
        }
        if (this.matches(doc, query)) {
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          return;
        }
      } catch {}
    }
  }

  async upload(filename: string, fileBuffer: Buffer, mimeType: string): Promise<{ id: string; filename: string }> {
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const id = await this.engine.uploadFile(labelId, filename, mimeType, fileBuffer);
    const metadata = { filename, mimeType, uploadedAt: new Date().toISOString() };
    cache.set(id, this.name, metadata);
    return { id, filename };
  }

  async getFile(messageId: string): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    return this.engine.getAttachment(messageId);
  }

  private matches(doc: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([k, v]) => doc[k] === v);
  }
}