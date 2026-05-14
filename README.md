# GmailDB

> Use Gmail as a backend database engine.

GmailDB is an open-source SDK that turns your Gmail account into a lightweight backend database. No servers, no setup, no cost — just your Gmail account.

---

## Why GmailDB?

Developers today install multiple services for a single app:

- Supabase or MongoDB for database
- Cloudinary for image storage
- AWS S3 for file storage

**GmailDB replaces all of it with one SDK and one Gmail account.**

---

## How it works

| Gmail | GmailDB |
|-------|---------|
| Label | Collection / Table |
| Email | Record / Document |
| Email Body | Encrypted JSON Data |
| Attachment | File Storage |

---

## Installation

```bash
npm install gmaildb
```

---

## Quick Start

```typescript
import { GmailDB } from 'gmaildb';

const db = new GmailDB();
await db.connect();

const users = db.collection('users');

// Insert
await users.insert({ name: 'Aryan', age: 19, role: 'admin' });

// Find all
const all = await users.find();

// Find with filter
const admins = await users.find({ role: 'admin' });

// Find one
const user = await users.findOne({ name: 'Aryan' });

// Update
await users.update({ name: 'Aryan' }, { age: 20 });

// Delete by field
await users.deleteOne({ name: 'Aryan' });

// Delete by ID
await users.deleteOne('your-uuid-here');
```

---

## File Storage

```typescript
import * as fs from 'fs';

const files = db.collection('files');

// Upload
const buffer = fs.readFileSync('photo.png');
const uploaded = await files.upload('photo.png', buffer, 'image/png');
console.log(uploaded.id); // use this ID to retrieve later

// Download
const file = await files.getFile(uploaded.id);
fs.writeFileSync('downloaded.png', file.data);
```

---

## Setup

### 1. Google Cloud Console

- Create a new project
- Enable Gmail API
- Create OAuth 2.0 credentials (Web application)
- Add redirect URI:

```txt
http://localhost:3000/oauth/callback
```

### 2. Environment Variables

Create a `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
GMAILDB_SECRET=your_long_secret_key_for_encryption
```

### 3. Authenticate

```bash
npm run auth
```

Open the URL in your browser, sign in with Google, done.

---

## Features

- ✅ Full CRUD — insert, find, findOne, update, delete
- ✅ File upload and download (images, PDFs, any file under 25MB)
- ✅ AES-256 encryption — data encrypted before storing in Gmail
- ✅ SQLite local caching for fast reads
- ✅ Auto sync between Gmail and cache
- ✅ Rate limit handler with request queue
- ✅ UUID-based record IDs
- ✅ TypeScript support
- ✅ Label-based collections

---

## Security

All JSON data and file metadata is encrypted using AES-256-CBC before being stored in Gmail. Even the owner of the Gmail account cannot read the raw data without the `GMAILDB_SECRET` key.

> Note: File binary content (images, PDFs) is stored as base64 — binary encryption is coming in a future release.

---

## Limitations

- 25MB max file size (Gmail limit)
- Not suitable for high-traffic production apps
- Rate limited by Gmail API quotas
- No real-time updates (polling only)

---

## Roadmap

- [x] Full CRUD operations
- [x] File upload and download
- [x] AES-256 encryption
- [x] SQLite caching
- [x] Auto sync
- [x] Rate limit handler
- [ ] Binary file encryption
- [ ] Multi-user OAuth support
- [ ] VS Code extension
- [ ] npm publish
- [ ] Natural language queries (AI)
- [ ] Demo website

---

## License

MIT