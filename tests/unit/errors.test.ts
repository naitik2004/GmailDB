import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  NotFoundError,
  FileSizeError,
  RateLimitError,
  NetworkError,
  TokenExpiredError,
  InvalidCollectionError,
} from '../../src/core/errors.js';

describe('Errors', () => {
  it('ValidationError has correct code', () => {
    const err = new ValidationError('bad input');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('bad input');
    expect(err.name).toBe('ValidationError');
  });

  it('NotFoundError includes collection and filter', () => {
    const err = new NotFoundError('users', { name: 'Aryan' });
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('users');
    expect(err.message).toContain('Aryan');
  });

  it('FileSizeError includes filename and size', () => {
    const err = new FileSizeError('video.mp4', 45.2);
    expect(err.code).toBe('FILE_TOO_LARGE');
    expect(err.message).toContain('video.mp4');
    expect(err.message).toContain('45.2');
  });

  it('RateLimitError has correct code', () => {
    const err = new RateLimitError();
    expect(err.code).toBe('RATE_LIMIT');
  });

  it('NetworkError has correct code', () => {
    const err = new NetworkError();
    expect(err.code).toBe('NETWORK_ERROR');
  });

  it('TokenExpiredError has correct code', () => {
    const err = new TokenExpiredError();
    expect(err.code).toBe('TOKEN_EXPIRED');
  });

  it('InvalidCollectionError includes name', () => {
    const err = new InvalidCollectionError('');
    expect(err.code).toBe('INVALID_COLLECTION');
    expect(err.message).toContain('""');
  });
});