import { cache } from '../src/core/cache.js';

cache.clear('users');
console.log('✅ Cache cleared for users');

cache.clear('files');
console.log('✅ Cache cleared for files');