import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/core/encryption.js';
import { ValidationError, NotFoundError, FileSizeError } from '../../src/core/errors.js';

describe('Integration — Encryption + Errors', () => {
  it('encrypted data should be decryptable', () => {
    const secret = 'integration_secret';
    const data = { name: 'Aryan', age: 19, role: 'admin' };
    const encrypted = encrypt(JSON.stringify(data), secret);
    const decrypted = JSON.parse(decrypt(encrypted, secret));
    expect(decrypted.name).toBe('Aryan');
    expect(decrypted.age).toBe(19);
    expect(decrypted.role).toBe('admin');
  });

  it('should throw ValidationError for empty object', () => {
    const err = new ValidationError('Cannot insert an empty object.');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should throw FileSizeError for large files', () => {
    const err = new FileSizeError('large.mp4', 30);
    expect(err.message).toContain('30.0MB');
    expect(err.code).toBe('FILE_TOO_LARGE');
  });

  it('should throw NotFoundError with correct details', () => {
    const err = new NotFoundError('users', { name: 'Unknown' });
    expect(err.message).toContain('users');
    expect(err.message).toContain('Unknown');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('full encrypt-decrypt cycle with nested data', () => {
    const secret = 'nested_secret';
    const data = {
      user: { name: 'Aryan', address: { city: 'Delhi' } },
      tags: ['admin', 'developer'],
      active: true,
    };
    const encrypted = encrypt(JSON.stringify(data), secret);
    const decrypted = JSON.parse(decrypt(encrypted, secret));
    expect(decrypted.user.address.city).toBe('Delhi');
    expect(decrypted.tags).toContain('admin');
    expect(decrypted.active).toBe(true);
  });
});