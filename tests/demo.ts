import { GmailDB } from '../src/sdk/index.js';

async function main() {
  const db = new GmailDB();
  await db.connect();

  const users = db.collection('users');

  // INSERT
  console.log('\n📝 Inserting user...');
  const inserted = await users.insert({ name: 'Aryan', age: 19, role: 'admin' });
  console.log('✅ Inserted:', inserted);

  // FIND ALL
  console.log('\n🔍 Finding all users...');
  const all = await users.find();
  console.log('✅ Found:', all);

  // FIND WITH FILTER
  console.log('\n🔍 Finding admins only...');
  const admins = await users.find({ role: 'admin' });
  console.log('✅ Admins:', admins);

  // UPDATE
  console.log('\n✏️ Updating age...');
  const count = await users.update({ name: 'Aryan' }, { age: 20 });
  console.log(`✅ Updated ${count} record(s)`);
  const afterUpdate = await users.find({ name: 'Aryan' });
  console.log('✅ After update:', afterUpdate);

  // DELETE
  console.log('\n🗑️ Deleting user...');
  await users.deleteOne(inserted.id);
  console.log('✅ Deleted:', inserted.id);

  // CONFIRM GONE
  console.log('\n🔍 Finding after delete...');
  const afterDelete = await users.find();
  console.log('✅ Found after delete:', afterDelete);
}

main().catch(console.error);