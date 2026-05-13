import { GmailDB } from '../src/sdk/index.js';

async function main() {
  const db = new GmailDB();
  await db.connect();

  const users = db.collection('users');

  console.log('\n📝 Inserting user...');
  const inserted = await users.insert({ name: 'Aryan', age: 19, role: 'admin' });
  console.log('✅ Inserted:', inserted);

  console.log('\n🔍 Finding all users...');
  const all = await users.find();
  console.log('✅ Found:', all);

  console.log('\n🔍 Finding admins...');
  const admins = await users.find({ role: 'admin' });
  console.log('✅ Admins:', admins);
}

main().catch(console.error);