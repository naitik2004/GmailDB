#!/usr/bin/env node

const command = process.argv[2];

if (command === 'init') {
  import('./init.js').catch(console.error);
} else {
  console.log('\nGmailDB CLI\n');
  console.log('Commands:');
  console.log('  npx gmaildb init    — Set up GmailDB in your project\n');
}