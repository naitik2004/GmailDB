import { GmailDB } from '../src/sdk/index.js';

async function main() {
  const db = new GmailDB();
  await db.connect();
  const sessions = db.collection('sessions');

  // Insert with TTL of 1 day
  console.log('\n📝 Inserting session with 1 day TTL...');
  const session = await sessions.insert(
    { token: 'abc123', userId: 'user_1' },
    { ttl: 1 }
  );
  console.log('✅ Inserted:', session);

  // Find — should show record
  const found = await sessions.find();
  console.log('\n✅ Found:', found);

  // Purge expired
  const purged = sessions.purgeExpired();
  console.log(`\n🧹 Purged ${purged} expired records`);
}

main().catch(console.error);