import { encrypt, decrypt } from '../src/core/encryption.js';

const secret = 'my_test_secret';
const original = JSON.stringify({ name: 'Aryan', age: 19 });

const encrypted = encrypt(original, secret);
console.log('🔒 Encrypted:', encrypted);

const decrypted = decrypt(encrypted, secret);
console.log('🔓 Decrypted:', decrypted);

console.log('✅ Match:', original === decrypted);