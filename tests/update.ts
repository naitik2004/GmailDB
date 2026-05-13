
import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();
const users = db.collection('users');

const count = await users.update({ name: 'Aryan' }, { role: 'superadmin' });
console.log(`✅ Updated ${count} record(s)`);

const result = await users.find({ name: 'Aryan' });
console.log('✅ After update:', result);


