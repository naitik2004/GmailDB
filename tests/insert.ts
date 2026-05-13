import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();
const users = db.collection('users');

const result = await users.insert({ name: 'Aryan', age: 19, role: 'admin' });
console.log('✅ Inserted:', result);