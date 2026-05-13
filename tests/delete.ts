import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();
const users = db.collection('users');

// First find all, then delete the first one
const all = await users.find();
if (all.length === 0) {
  console.log('❌ No users to delete');
} else {
  await users.deleteOne(all[0].id);
  console.log('✅ Deleted:', all[0]);
}