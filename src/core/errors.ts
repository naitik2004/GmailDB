export class GmailDBError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GmailDBError';
  }
}

export class AuthError extends GmailDBError {
  constructor(message = 'Not authenticated. Run: npm run auth') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class NotFoundError extends GmailDBError {
  constructor(collection: string, filter: any) {
    super(`No record found in "${collection}" matching ${JSON.stringify(filter)}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends GmailDBError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends GmailDBError {
  constructor() {
    super('Gmail API rate limit hit. Please slow down requests.', 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class FileSizeError extends GmailDBError {
  constructor(filename: string, sizeMB: number) {
    super(`File "${filename}" is ${sizeMB.toFixed(1)}MB. Gmail limit is 25MB.`, 'FILE_TOO_LARGE');
    this.name = 'FileSizeError';
  }
}

export class NetworkError extends GmailDBError {
  constructor(message = 'Network request failed. Check your internet connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TokenExpiredError extends GmailDBError {
  constructor() {
    super('OAuth token expired. Run: npm run auth to re-authenticate.', 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}

export class StorageFullError extends GmailDBError {
  constructor() {
    super('Gmail storage is full. Please free up space in your Gmail account.', 'STORAGE_FULL');
    this.name = 'StorageFullError';
  }
}

export class InvalidCollectionError extends GmailDBError {
  constructor(name: string) {
    super(`Invalid collection name "${name}". Must be a non-empty string with no special characters.`, 'INVALID_COLLECTION');
    this.name = 'InvalidCollectionError';
  }
}

export class CacheError extends GmailDBError {
  constructor(message = 'Local cache error. Try clearing the cache.') {
    super(message, 'CACHE_ERROR');
    this.name = 'CacheError';
  }
}