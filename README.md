# GmailDB

> Use Gmail as a backend database engine.

GmailDB is an open-source SDK that turns your Gmail account into a lightweight backend database. No servers, no setup, no cost — just your Gmail account.

## How it works

| Gmail | GmailDB |
|-------|---------|
| Label | Collection / Table |
| Email | Record / Document |
| Email Body | JSON Data |
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

// Insert
await users.insert({ name: 'Aryan', age: 19, role: 'admin' });

// Find all
const all = await users.find();

// Find with filter
const admins = await users.find({ role: 'admin' });

// Update
await users.update({ name: 'Aryan' }, { age: 20 });

// Delete
await users.deleteOne({ name: 'Aryan' });
```

## File Storage

```typescript
import * as fs from 'fs';

const files = db.collection('files');

// Upload
const buffer = fs.readFileSync('photo.png');
const uploaded = await files.upload('photo.png', buffer, 'image/png');

// Download
const file = await files.getFile(uploaded.id);
fs.writeFileSync('downloaded.png', file.data);
```

## Setup

### 1. Google Cloud Console
- Create a new project
- Enable Gmail API
- Create OAuth 2.0 credentials
- Add redirect URI: `http://localhost:3000/oauth/callback`

### 2. Environment Variables

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

### 3. Authenticate

```bash
npm run auth
```

## Features

- ✅ Full CRUD operations
- ✅ File upload and download
- ✅ Auto sync between Gmail and local cache
- ✅ SQLite local caching for fast reads
- ✅ TypeScript support
- ✅ Label-based collections
- ✅ UUID-based record IDs

## Limitations

- 25MB max file size (Gmail limit)
- Not suitable for high-traffic production apps
- Rate limited by Gmail API quotas

## Roadmap

- [ ] Encryption (AES-256)
- [ ] Multi-user OAuth support
- [ ] VS Code extension
- [ ] npm package publish
- [ ] Natural language queries

## License

MIT