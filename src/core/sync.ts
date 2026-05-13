import { GmailEngine } from './engine.js';
import { cache } from './cache.js';

export async function syncCollection(engine: GmailEngine, collection: string): Promise<void> {
  console.log(`🔄 Syncing ${collection}...`);

  const labelId = await engine.ensureLabel(`gmaildb/${collection}`);
  const messages = await engine.listMessages(labelId);

  if (!messages.length) {
    cache.clear(collection);
    return;
  }

  // Get all IDs currently in Gmail
  const gmailIds = new Set(messages.map((m: any) => m.id));

  // Get all IDs currently in cache
  const cached = cache.find(collection);
  const cachedIds = new Set(cached.map((d: any) => d.id));

  // Delete from cache anything that no longer exists in Gmail
  for (const doc of cached) {
    if (!gmailIds.has(doc.id)) {
      cache.delete(doc.id);
      console.log(`🗑️ Removed stale cache entry: ${doc.id}`);
    }
  }

  // Add to cache anything in Gmail not yet in cache
  for (const msg of messages) {
    if (!cachedIds.has(msg.id)) {
      const full = await engine.getMessage(msg.id);
      const body = engine.parseBody(full);
      try {
        const doc = JSON.parse(body);
        cache.set(msg.id, collection, doc);
        console.log(`➕ Added new entry to cache: ${msg.id}`);
      } catch {}
    }
  }

  console.log(`✅ Sync complete for ${collection}`);
}