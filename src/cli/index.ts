#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const command = process.argv[2];

if (command === 'init') {
  import('./init.js').catch(console.error);
} else if (command === '-v' || command === '--version') {
  console.log(`gmaildb v${pkg.version}`);
} else if (command === '-h' || command === '--help') {
  console.log(`
GmailDB CLI v${pkg.version}

Commands:
  npx gmaildb init        Set up GmailDB in your project
  npx gmaildb --version   Show version
  npx gmaildb --help      Show help
  `);
} else {
  console.log(`
GmailDB CLI v${pkg.version}

Commands:
  npx gmaildb init        Set up GmailDB in your project
  npx gmaildb --version   Show version
  npx gmaildb --help      Show help
  `);
}