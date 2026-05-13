import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();

const files = db.collection('files');

// First find all files
const all = await files.find();
console.log('All files:', all);

// Delete first one
if (all.length > 0) {
  await files.deleteOne(all[0].id);
  console.log('✅ Deleted:', all[0].id);
}