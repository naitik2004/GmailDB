import { GmailEngine } from '../core/engine.js';

export class Collection {
  constructor(
    private name: string,
    private engine: GmailEngine
  ) {}

  async insert(data: Record<string, any>): Promise<{ id: string; data: Record<string, any> }> {
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const subject = `gmaildb:${this.name}`;
    const body = JSON.stringify(data);
    const id = await this.engine.insertMessage(labelId, subject, body);
    return { id, data };
  }

  async find(filter?: Record<string, any>): Promise<any[]> {
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);
    if (!messages.length) return [];

    const results: any[] = [];
    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        const doc = JSON.parse(body);
        if (!filter || this.matches(doc, filter)) {
          results.push({ id: msg.id, ...doc });
        }
      } catch {}
    }
    return results;
  }

  async deleteOne(id: string): Promise<void> {
    await this.engine.trashMessage(id);
  }

  private matches(doc: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([k, v]) => doc[k] === v);
  }
}