import { GmailEngine } from './engine.js';
import { cache } from './cache.js';
import { decrypt } from './encryption.js';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.GMAILDB_SECRET || 'default_secret';

export async function syncCollection(engine: GmailEngine, collection: string): Promise<void> {
  console.log(`🔄 Syncing ${collection}...`);

  const labelId = await engine.ensureLabel(`gmaildb/${collection}`);
  const messages = await engine.listMessages(labelId);

  if (!messages.length) {
    cache.clear(collection);
    return;
  }

  const gmailIds = new Set(messages.map((m: any) => m.id));
  const cached = cache.find(collection);
  const cachedIds = new Set(cached.map((d: any) => d.id));

  for (const doc of cached) {
    if (!gmailIds.has(doc.id)) {
      cache.delete(doc.id);
      console.log(`🗑️ Removed stale cache entry: ${doc.id}`);
    }
  }

  for (const msg of messages) {
    if (!cachedIds.has(msg.id)) {
      const full = await engine.getMessage(msg.id);
      const body = engine.parseBody(full);
      try {
        let doc: any;
        try {
          const decrypted = decrypt(body, SECRET);
          doc = JSON.parse(decrypted);
        } catch {
          // not encrypted — plain JSON (file metadata)
          doc = JSON.parse(body);
        }
        cache.set(msg.id, collection, doc);
        console.log(`➕ Added new entry to cache: ${msg.id}`);
      } catch {}
    }
  }

  console.log(`✅ Sync complete for ${collection}`);
}