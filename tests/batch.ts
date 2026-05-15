import { GmailDB } from '../src/sdk/index.js';

async function main() {
  const db = new GmailDB();
  await db.connect();
  const users = db.collection('users');

  // Insert many
  console.log('\n📝 Inserting multiple users...');
  const result = await users.insertMany([
    { name: 'Alice', age: 25, role: 'admin' },
    { name: 'Bob', age: 30, role: 'user' },
    { name: 'Charlie', age: 22, role: 'user' },
  ]);
  console.log('✅ Inserted:', result);

  // Find all
  const all = await users.find();
  console.log('\n✅ All users:', all);

  // Delete many
  console.log('\n🗑️ Deleting all users with role: user...');
  const deleted = await users.deleteMany({ role: 'user' });
  console.log('✅ Deleted:', deleted);

  // Confirm
  const remaining = await users.find();
  console.log('\n✅ Remaining:', remaining);
}

main().catch(console.error);