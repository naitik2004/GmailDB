import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();
const users = db.collection('users');

const all = await users.find();
console.log('✅ All users:', all);