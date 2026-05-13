import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();

const files = db.collection('files');
const all = await files.find();
console.log('✅ All files:', all);