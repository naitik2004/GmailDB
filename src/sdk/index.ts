import { createEngine } from '../core/engine.js';
import { Collection } from './collection.js';
import { InvalidCollectionError } from '../core/errors.js';


export class GmailDB {
  private engine: any = null;

  async connect(): Promise<this> {
    this.engine = await createEngine();
    console.log('✅ GmailDB connected');
    return this;
  }

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