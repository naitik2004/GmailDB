import { GmailDB } from '../src/sdk/index.js';

const db = new GmailDB();
await db.connect();

// sync users
const users = db.collection('users');
await users.find();

// sync files
const files = db.collection('files');
await files.find();