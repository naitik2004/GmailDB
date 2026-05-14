import { GmailDB } from '../src/sdk/index.js';

async function main() {
  const db = new GmailDB();
  await db.connect();
  const users = db.collection('users');

  // Find all
  const all = await users.find();
  console.log('✅ All users:', all);

  // Page 1
  const page1 = await users.find({}, { limit: 1, skip: 0 });
  console.log('📄 Page 1:', page1);

  // Count
  const count = await users.count();
  console.log('🔢 Total users:', count);

  // Sorted by age
  const sorted = await users.find({}, { sort: { field: 'age', order: 'asc' } });
  console.log('📊 Sorted by age:', sorted);



  // Query operators
    const older = await users.find({ age: { $gte: 19 } });
    console.log('👴 Age >= 19:', older);

    const notAdmin = await users.find({ role: { $ne: 'admin' } });
    console.log('🚫 Not admin:', notAdmin);

    const nameContains = await users.find({ name: { $contains: 'ary' } });
    console.log('🔍 Name contains "ary":', nameContains);
    
}

main().catch(console.error);