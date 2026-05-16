import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import * as fs from 'fs';

// Use a test database
const TEST_DB = 'test_cache.sqlite';

describe('Cache', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('should store and retrieve a record', () => {
    const db = new Database(TEST_DB);
    db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER DEFAULT NULL
      )
    `);

    db.prepare(`INSERT INTO records (id, collection, data) VALUES (?, ?, ?)`)
      .run('id1', 'users', JSON.stringify({ name: 'Aryan' }));

    const row = db.prepare(`SELECT * FROM records WHERE id = ?`).get('id1') as any;
    expect(row).not.toBeNull();
    expect(JSON.parse(row.data).name).toBe('Aryan');
    db.close();
  });

  it('should delete a record', () => {
    const db = new Database(TEST_DB);
    db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER DEFAULT NULL
      )
    `);

    db.prepare(`INSERT INTO records (id, collection, data) VALUES (?, ?, ?)`)
      .run('id1', 'users', JSON.stringify({ name: 'Aryan' }));

    db.prepare(`DELETE FROM records WHERE id = ?`).run('id1');
    const row = db.prepare(`SELECT * FROM records WHERE id = ?`).get('id1');
    expect(row).toBeUndefined();
    db.close();
  });
});