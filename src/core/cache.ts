import Database from 'better-sqlite3';
import * as fs from 'fs';

const DB_PATH = 'gmaildb.sqlite';

class Cache {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER DEFAULT NULL
      );
    `);

    // Migration — add expires_at if it doesn't exist yet
    try {
      this.db.exec(`ALTER TABLE records ADD COLUMN expires_at INTEGER DEFAULT NULL`);
    } catch {
      // Column already exists — ignore
    }
  }

  set(id: string, collection: string, data: Record<string, any>, ttlDays?: number) {
    const expiresAt = ttlDays
      ? Math.floor(Date.now() / 1000) + ttlDays * 86400
      : null;

    this.db.prepare(`
      INSERT OR REPLACE INTO records (id, collection, data, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(id, collection, JSON.stringify(data), expiresAt);
  }

  get(id: string): Record<string, any> | null {
    const row = this.db.prepare(`SELECT * FROM records WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return { id: row.id, ...JSON.parse(row.data) };
  }


  //find //
  find(collection: string, filter?: Record<string, any>): any[] {
    const now = Math.floor(Date.now() / 1000);
    const rows = this.db.prepare(`
      SELECT * FROM records 
      WHERE collection = ? 
      AND (expires_at IS NULL OR expires_at > ?)
    `).all(collection, now) as any[];

    const docs = rows.map(row => ({ id: row.id, ...JSON.parse(row.data) }));
    if (!filter || Object.keys(filter).length === 0) return docs;
    return docs.filter(doc => this.matches(doc, filter));
  }

  private matches(doc: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return Object.entries(value).every(([op, operand]) => {
          switch (op) {
            case '$gt': return doc[key] > (operand as any);
            case '$gte': return doc[key] >= (operand as any);
            case '$lt': return doc[key] < (operand as any);
            case '$lte': return doc[key] <= (operand as any);
            case '$ne': return doc[key] !== (operand as any);
            case '$in': return (operand as any[]).includes(doc[key]);
            case '$nin': return !(operand as any[]).includes(doc[key]);
            case '$contains': return String(doc[key]).toLowerCase().includes(String(operand as any).toLowerCase());
            case '$exists': return (operand as any) ? key in doc : !(key in doc);
            default: return false;
          }
        });
      }
      return doc[key] === value;
    });
  }
  //---------------------
  delete(id: string) {
    this.db.prepare(`DELETE FROM records WHERE id = ?`).run(id);
  }

  clear(collection: string) {
    this.db.prepare(`DELETE FROM records WHERE collection = ?`).run(collection);
  }

  has(collection: string): boolean {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM records WHERE collection = ?
    `).get(collection) as any;
    return row.count > 0;
  }


  // TTL------------------

  purgeExpired(): number {
    const now = Math.floor(Date.now() / 1000);
    const result = this.db.prepare(`
      DELETE FROM records WHERE expires_at IS NOT NULL AND expires_at <= ?
    `).run(now);
    return result.changes;
  }

  //------------also inti and update some of teh insert adn some other codes 



}

export const cache = new Cache();