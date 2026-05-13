import { GmailEngine } from '../core/engine.js';
import { cache } from '../core/cache.js';
import { randomUUID } from 'crypto';
import { syncCollection } from '../core/sync.js';


export class Collection {
  constructor(
    private name: string,
    private engine: GmailEngine
  ) {}

  async insert(data: Record<string, any>): Promise<{ id: string; msgId: string; data: Record<string, any> }>{
    const docId = randomUUID();  // clean UUID like "a1b2-c3d4-..."
    const dataWithId = { ...data, _id: docId };
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const msgId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, JSON.stringify(dataWithId));
    cache.set(msgId, this.name, dataWithId);
    return { id: docId, msgId, data: dataWithId };
  }


  async find(filter?: Record<string, any>): Promise<any[]> {
    await syncCollection(this.engine, this.name);
    return cache.find(this.name, filter);
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
        const doc = JSON.parse(body);
        if (this.matches(doc, filter)) {
          const newDoc = { ...doc, ...changes };
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          const newId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, JSON.stringify(newDoc));
          cache.set(newId, this.name, newDoc);
          updated++;
        }
      } catch {}
    }
    return updated;
  }



  // DELETE ONE ////


  async deleteOne(filter: string | Record<string, any>): Promise<void> {
    // if string passed, treat as _id
    await syncCollection(this.engine, this.name);
    const query = typeof filter === 'string' ? { _id: filter } : filter;
    
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);

    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        const doc = JSON.parse(body);
        if (this.matches(doc, query)) {
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          return;
        }
      } catch {}
    }
  }


  //.     FIND ONE ///

  async findOne(filter: Record<string, any>): Promise<any | null> {
    const results = await this.find(filter);
    return results[0] || null;
  }


  private matches(doc: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([k, v]) => doc[k] === v);
  }




  //   FILE STORAGE

  async upload(filename: string, fileBuffer: Buffer, mimeType: string): Promise<{ id: string; filename: string }> {
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const id = await this.engine.uploadFile(labelId, filename, mimeType, fileBuffer);
    return { id, filename };
  }

  async getFile(messageId: string): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    return this.engine.getAttachment(messageId);
  }



}