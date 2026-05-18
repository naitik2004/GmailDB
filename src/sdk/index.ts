import { createEngine } from '../core/engine.js';
import { Collection } from './collection.js';
import { InvalidCollectionError } from '../core/errors.js';
import * as fs from 'fs';
import * as path from 'path';


interface GmailDBConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  secret?: string;
  tokenPath?: string;
}



function loadConfig(): GmailDBConfig {
  const configPath = path.join(process.cwd(), 'gmaildb.config.js');
  if (fs.existsSync(configPath)) {
    try {
      return require(configPath);
    } catch {}
  }
  return {};
}
/**
 * GmailDB — Use Gmail as a backend database engine.
 *
 * @example
 * const db = new GmailDB();
 * await db.connect();
 * const users = db.collection('users');
 * await users.insert({ name: 'Aryan' });
 */
export class GmailDB {
  private engine: any = null;

  /**
   * Connect to Gmail and initialize the database engine.
   * Reads from .env or gmaildb.config.js if present.
   * Must be called before any collection operations.
   */
  async connect(): Promise<this> {
    this.engine = await createEngine();
    console.log('✅ GmailDB connected');
    return this;
  }

  /**
   * Get a collection by name.
   * @param name - Collection name (alphanumeric, dashes, underscores only)
   */
  collection(name: string): Collection {
    if (!this.engine) throw new Error('Call connect() first');
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new InvalidCollectionError(name);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new InvalidCollectionError(name);
    }
    return new Collection(name.trim(), this.engine);
  }
}