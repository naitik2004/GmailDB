import { createEngine } from '../core/engine.js';
import { Collection } from './collection.js';

export class GmailDB {
  private engine: any = null;

  async connect(): Promise<this> {
    this.engine = await createEngine();
    console.log('✅ GmailDB connected');
    return this;
  }

  collection(name: string): Collection {
    if (!this.engine) throw new Error('Call connect() first');
    return new Collection(name, this.engine);
  }
}