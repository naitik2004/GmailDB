export { GmailDB } from './sdk/index.js';
export { Collection } from './sdk/collection.js';
export { GmailEngine, createEngine } from './core/engine.js';
export { authenticate, createOAuthClient, loadSavedToken } from './auth/oauth.js';
export { encrypt, decrypt } from './core/encryption.js';
export { GmailDBError, AuthError, NotFoundError, ValidationError, RateLimitError, FileSizeError } from './core/errors.js';