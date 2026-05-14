// import { GmailDB } from '../src/sdk/index.js';
// import * as fs from 'fs';

// const db = new GmailDB();
// await db.connect();

// const files = db.collection('files');

// // Create a test file
// fs.writeFileSync('test.txt', 'Hello from GmailDB file storage!');
// const buffer = fs.readFileSync('test.txt');

// console.log('\n📤 Uploading file...');
// const uploaded = await files.upload('test.txt', buffer, 'text/plain');
// console.log('✅ Uploaded:', uploaded);

// console.log('\n📥 Downloading file...');
// const file = await files.getFile(uploaded.id);
// console.log('✅ Downloaded:', file.filename);
// console.log('✅ Content:', file.data.toString('utf-8'));




// for uploading teh image  ///


import { GmailDB } from '../src/sdk/index.js';
import * as fs from 'fs';

const db = new GmailDB();
await db.connect();

const files = db.collection('files');

const buffer = fs.readFileSync('test.png');

console.log('\n📤 Uploading image...');
const uploaded = await files.upload('test.png', buffer, 'image/png');
console.log('✅ Uploaded:', uploaded);

// console.log('\n📥 Downloading image...');
// const file = await files.getFile(uploaded.id);
// fs.writeFileSync('downloaded.png', file.data);
// console.log('✅ Downloaded and saved as downloaded.png');