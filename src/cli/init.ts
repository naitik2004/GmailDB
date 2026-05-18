import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { google } from 'googleapis';

// Simple color helpers without chalk ESM issues
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

async function main() {
  console.log('\n' + bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(bold('  Welcome to GmailDB Setup'));
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━') + '\n');

  console.log(yellow('Before we start, you need Google OAuth credentials.'));
  console.log(yellow('Follow these steps:\n'));
  console.log('  1. Go to ' + blue('https://console.cloud.google.com'));
  console.log('  2. Create a new project');
  console.log('  3. Go to APIs & Services → Library → Enable Gmail API');
  console.log('  4. Go to APIs & Services → Credentials');
  console.log('  5. Create OAuth 2.0 Client ID (Web application)');
  console.log('  6. Add redirect URI: ' + blue('http://localhost:3000/oauth/callback'));
  console.log('  7. Copy your Client ID and Client Secret\n');

  const clientId = await prompt(bold('? Enter your Google Client ID: '));
  const clientSecret = await prompt(bold('? Enter your Google Client Secret: '));
  const secret = await prompt(bold('? Enter an encryption secret key (any long random string): '));

  if (!clientId || !clientSecret || !secret) {
    console.log(red('\n✖ All fields are required. Run npx gmaildb init again.\n'));
    process.exit(1);
  }

  // Write .env file
  const envContent = [
    `GOOGLE_CLIENT_ID=${clientId}`,
    `GOOGLE_CLIENT_SECRET=${clientSecret}`,
    `GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback`,
    `GMAILDB_SECRET=${secret}`,
  ].join('\n');

  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
  console.log(green('\n✅ .env file created'));

  // Write .gitignore entries
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const gitignoreEntries = '\n# GmailDB\n.env\ntoken.json\ngmaildb.sqlite\n';
  if (fs.existsSync(gitignorePath)) {
    const existing = fs.readFileSync(gitignorePath, 'utf-8');
    if (!existing.includes('token.json')) {
      fs.appendFileSync(gitignorePath, gitignoreEntries);
      console.log(green('✅ .gitignore updated'));
    }
  } else {
    fs.writeFileSync(gitignorePath, gitignoreEntries);
    console.log(green('✅ .gitignore created'));
  }

  // Start OAuth flow
  console.log(yellow('\n🔐 Starting authentication...\n'));

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/oauth/callback'
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
    ],
  });

  console.log('🔗 Open this URL in your browser:\n');
  console.log(blue(authUrl) + '\n');
  console.log(yellow('⏳ Waiting for authentication...\n'));

  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url || '', 'http://localhost:3000');
      const code = parsedUrl.searchParams.get('code') as string;
      if (code) {
        res.end('<h1>✅ GmailDB authenticated! You can close this tab.</h1>');
        server.close();
        try {
          const { tokens } = await oAuth2Client.getToken(code);
          fs.writeFileSync(
            path.join(process.cwd(), 'token.json'),
            JSON.stringify(tokens)
          );
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    });
    server.listen(3000);
  });

  console.log(green('✅ token.json saved'));

  // Write example usage file
  const exampleContent = `import { GmailDB } from 'gmaildb';

const db = new GmailDB();
await db.connect();

const users = db.collection('users');

// Insert a record
const user = await users.insert({ name: 'Alice', age: 25 });
console.log('Inserted:', user);

// Find all records
const all = await users.find();
console.log('All users:', all);
`;

  fs.writeFileSync(path.join(process.cwd(), 'gmaildb-example.ts'), exampleContent);
  console.log(green('✅ gmaildb-example.ts created'));

  console.log('\n' + bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(green(bold('  🎉 GmailDB is ready to use!')));
  console.log(bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  console.log('  Run your example:');
  console.log(blue('  npx tsx gmaildb-example.ts\n'));
}

main().catch((err) => {
  console.error(red('\n✖ Setup failed:'), err.message);
  process.exit(1);
});