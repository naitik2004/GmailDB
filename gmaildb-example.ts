import { GmailDB } from 'gmaildb';

const db = new GmailDB();
await db.connect();

const users = db.collection('users');

// Insert a record
const user = await users.insert({ name: 'Alice', age: 25 });
console.log('Inserted:', user);

// Find all records
const all = await users.find();
console.log('All users:', all);
