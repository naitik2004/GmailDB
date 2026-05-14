import { GmailDB } from '../src/sdk/index.js';

async function main() {
  const db = new GmailDB();
  await db.connect();
  const users = db.collection('users');
  
  console.log('📝 Starting insert...');
  const result = await Promise.race([
    users.insert({ name: 'Aryan', age: 19, role: 'admin' }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), 10000))
  ]);
  console.log('✅ Inserted:', result);
}

main().catch(console.error);