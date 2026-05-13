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
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
  }

  set(id: string, collection: string, data: Record<string, any>) {
    this.db.prepare(`
      INSERT OR REPLACE INTO records (id, collection, data)
      VALUES (?, ?, ?)
    `).run(id, collection, JSON.stringify(data));
  }

  get(id: string): Record<string, any> | null {
    const row = this.db.prepare(`SELECT * FROM records WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return { id: row.id, ...JSON.parse(row.data) };
  }

  find(collection: string, filter?: Record<string, any>): any[] {
    const rows = this.db.prepare(`
      SELECT * FROM records WHERE collection = ?
    `).all(collection) as any[];

    return rows
      .map(row => ({ id: row.id, ...JSON.parse(row.data) }))
      .filter(doc => {
        if (!filter) return true;
        return Object.entries(filter).every(([k, v]) => doc[k] === v);
      });
  }

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
}

export const cache = new Cache();