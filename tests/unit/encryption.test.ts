import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/core/encryption.js';

describe('Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const secret = 'test_secret';
    const original = JSON.stringify({ name: 'Aryan', age: 19 });
    const encrypted = encrypt(original, secret);
    const decrypted = decrypt(encrypted, secret);
    expect(decrypted).toBe(original);
  });

  it('should produce different output each time', () => {
    const secret = 'test_secret';
    const data = 'same data';
    const enc1 = encrypt(data, secret);
    const enc2 = encrypt(data, secret);
    expect(enc1).not.toBe(enc2);
  });

  it('should fail with wrong secret', () => {
    const data = 'hello';
    const encrypted = encrypt(data, 'correct_secret');
    expect(() => decrypt(encrypted, 'wrong_secret')).toThrow();
  });
});