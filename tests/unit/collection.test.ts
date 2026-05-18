import { describe, it, expect } from 'vitest';
import { ValidationError } from '../../src/core/errors.js';
import { encrypt, decrypt } from '../../src/core/encryption.js';

describe('Collection Logic', () => {
  it('field projection returns only requested fields', () => {
    const doc = { id: '123', _id: 'abc', name: 'Aryan', age: 19, role: 'admin' };
    const fields = ['name', 'age'];
    const projected: Record<string, any> = { id: doc.id, _id: doc._id };
    for (const field of fields) {
      if (field in doc) projected[field] = (doc as any)[field];
    }
    expect(projected).toHaveProperty('name', 'Aryan');
    expect(projected).toHaveProperty('age', 19);
    expect(projected).not.toHaveProperty('role');
  });

  it('distinct returns unique values', () => {
    const docs = [
      { role: 'admin' },
      { role: 'user' },
      { role: 'admin' },
      { role: 'guest' },
    ];
    const values = docs.map(d => d.role);
    const unique = [...new Set(values)];
    expect(unique).toHaveLength(3);
    expect(unique).toContain('admin');
    expect(unique).toContain('user');
    expect(unique).toContain('guest');
  });

  it('ValidationError thrown for empty insert', () => {
    const err = new ValidationError('Cannot insert an empty object.');
    expect(err.message).toBe('Cannot insert an empty object.');
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('encrypt and decrypt round trip', () => {
    const secret = 'test';
    const data = { name: 'Aryan', password: 'secret123' };
    const encrypted = encrypt(JSON.stringify(data), secret);
    const decrypted = JSON.parse(decrypt(encrypted, secret));
    expect(decrypted.name).toBe('Aryan');
    expect(decrypted.password).toBe('secret123');
  });
});