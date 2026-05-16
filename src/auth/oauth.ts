import { google } from 'googleapis';
import * as fs from 'fs';
import * as http from 'http';
import * as url from 'url';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN_PATH = 'token.json';

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback'
  );
}

export function loadSavedToken(client: any): boolean {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    client.setCredentials(token);
    console.log('✅ Token loaded from token.json');
    return true;
  }
  return false;
}

export async function authenticate(): Promise<any> {
  const client = createOAuthClient();
  if (loadSavedToken(client)) return client;

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
    ],
  });

  console.log('\n🔗 Open this URL:\n', authUrl);

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const code = url.parse(req.url || '', true).query.code as string;
      if (code) {
        res.end('✅ Done! Close this tab.');
        server.close();
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('✅ Token saved');
        resolve(client);
      }
    });
    server.listen(3000);
  });
}


export async function refreshTokenIfNeeded(client: any): Promise<void> {
  const credentials = client.credentials;
  if (!credentials.expiry_date) return;

  const expiresIn = credentials.expiry_date - Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresIn < fiveMinutes) {
    console.log('🔄 Token expiring soon, refreshing...');
    const { credentials: newCreds } = await client.refreshAccessToken();
    client.setCredentials(newCreds);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(newCreds));
    console.log('✅ Token refreshed');
  }
}