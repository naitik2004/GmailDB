# GmailDB

> Use Gmail as a backend database engine.

GmailDB is an open-source SDK that turns your Gmail account into a lightweight backend database. No servers, no setup, no cost — just your Gmail account.

## Why GmailDB?

Developers today install multiple services for a single app:
- Supabase or MongoDB for database
- Cloudinary for image storage
- AWS S3 for file storage

**GmailDB replaces all of it with one SDK and one Gmail account.**

## How it works

| Gmail | GmailDB |
|-------|---------|
| Label | Collection / Table |
| Email | Record / Document |
| Email Body | Encrypted JSON Data |
| Attachment | File Storage |

## Installation

```bash
npm install gmaildb
```

## Quick Start

```typescript
import { GmailDB } from 'gmaildb';

const db = new GmailDB();
await db.connect();

const users = db.collection('users');

// Insert one
await users.insert({ name: 'Aryan', age: 19, role: 'admin' });

// Insert many
await users.insertMany([
  { name: 'Alice', age: 25, role: 'admin' },
  { name: 'Bob', age: 30, role: 'user' },
]);

// Find all
const all = await users.find();

// Find with filter
const admins = await users.find({ role: 'admin' });

// Find with query operators
const adults = await users.find({ age: { $gte: 18 } });
const notAdmin = await users.find({ role: { $ne: 'admin' } });
const search = await users.find({ name: { $contains: 'ary' } });
const roles = await users.find({ role: { $in: ['admin', 'superadmin'] } });

// Find with pagination
const page1 = await users.find({}, { limit: 10, skip: 0 });
const page2 = await users.find({}, { limit: 10, skip: 10 });

// Find with sorting
const sorted = await users.find({}, { sort: { field: 'age', order: 'asc' } });

// Find one
const user = await users.findOne({ name: 'Aryan' });

// Count
const total = await users.count();
const adminCount = await users.count({ role: 'admin' });

// Update
await users.update({ name: 'Aryan' }, { age: 20 });

// Delete one
await users.deleteOne({ name: 'Aryan' });

// Delete many
await users.deleteMany({ role: 'user' });

// Delete all
await users.deleteAll();
```

## File Storage

```typescript
import * as fs from 'fs';

const files = db.collection('files');

// Upload
const buffer = fs.readFileSync('photo.png');
const uploaded = await files.upload('photo.png', buffer, 'image/png');
console.log(uploaded.id);

// Download
const file = await files.getFile(uploaded.id);
fs.writeFileSync('downloaded.png', file.data);
```

## Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$gt` | Greater than | `{ age: { $gt: 18 } }` |
| `$gte` | Greater than or equal | `{ age: { $gte: 18 } }` |
| `$lt` | Less than | `{ age: { $lt: 30 } }` |
| `$lte` | Less than or equal | `{ age: { $lte: 30 } }` |
| `$ne` | Not equal | `{ role: { $ne: 'admin' } }` |
| `$in` | In array | `{ role: { $in: ['admin', 'user'] } }` |
| `$nin` | Not in array | `{ role: { $nin: ['guest'] } }` |
| `$contains` | String contains | `{ name: { $contains: 'ary' } }` |
| `$exists` | Field exists | `{ phone: { $exists: true } }` |

## Error Handling

```typescript
import {
  ValidationError,
  NotFoundError,
  FileSizeError,
  RateLimitError,
  NetworkError,
  TokenExpiredError,
  StorageFullError,
  InvalidCollectionError
} from 'gmaildb';

try {
  await users.insert({});
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('Bad data:', err.message);
  }
  if (err instanceof NotFoundError) {
    console.log('Not found:', err.message);
  }
  if (err instanceof RateLimitError) {
    console.log('Slow down:', err.message);
  }
  if (err instanceof TokenExpiredError) {
    console.log('Re-authenticate:', err.message);
  }
}
```

## Setup

### 1. Google Cloud Console
- Create a new project
- Enable Gmail API
- Create OAuth 2.0 credentials (Web application)
- Add redirect URI: `http://localhost:3000/oauth/callback`

### 2. Environment Variables
Create a `.env` file:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
GMAILDB_SECRET=your_long_secret_key_for_encryption
```

### 3. Authenticate
```bash
npm run auth
```

## Features
- ✅ Full CRUD — insert, insertMany, find, findOne, update, delete, deleteMany, deleteAll
- ✅ File upload and download (images, PDFs, any file under 25MB)
- ✅ AES-256 encryption — data encrypted before storing in Gmail
- ✅ SQLite local caching for fast reads
- ✅ Auto sync between Gmail and cache
- ✅ Rate limit handler with request queue
- ✅ Pagination and sorting
- ✅ Query operators ($gt, $gte, $lt, $lte, $ne, $in, $nin, $contains, $exists)
- ✅ Batch operations (insertMany, deleteMany, deleteAll)
- ✅ UUID-based record IDs
- ✅ TypeScript support
- ✅ Proper error classes

## Limitations
- 25MB max file size (Gmail limit)
- Not suitable for high-traffic production apps
- Rate limited by Gmail API quotas
- No real-time updates (polling only)

## Roadmap
- [x] Full CRUD operations
- [x] File upload and download
- [x] AES-256 encryption
- [x] SQLite caching
- [x] Auto sync
- [x] Rate limit handler
- [x] Pagination and sorting
- [x] Query operators
- [x] Batch operations
- [x] Error handling
- [ ] TTL (auto-delete after X days)
- [ ] Unit tests
- [ ] Setup CLI (npx gmaildb init)
- [ ] Binary file encryption
- [ ] Multi-user OAuth
- [ ] VS Code extension
- [ ] Demo website
- [ ] AI natural language queries

## License
MIT