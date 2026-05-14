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