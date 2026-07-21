/**
 * One-time interactive OAuth flow to obtain a YOUTUBE_REFRESH_TOKEN.
 * Run with: npm run get-youtube-token
 * Requires YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET already set in .env
 * (create them first at https://console.cloud.google.com — OAuth client
 * ID of type "Desktop app" or "Web application" with the redirect URI
 * below registered).
 */
import http from 'node:http';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    '❌ Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env first (see PHASE_2_3_SETUP.md Step 2).'
  );
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

console.log('\n🔑 Open this URL in your browser and authorize the app:\n');
console.log(authUrl);
console.log(`\nWaiting for redirect on ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(`Authorization failed: ${error}`);
    console.error(`❌ Authorization failed: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end('Missing code');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('✅ Authorized! You can close this tab and return to the terminal.');
  server.close();

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    const data = (await tokenResponse.json()) as {
      refresh_token?: string;
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !data.refresh_token) {
      console.error(
        `❌ Token exchange failed: ${data.error || tokenResponse.statusText} — ${data.error_description || ''}`
      );
      process.exit(1);
    }

    console.log('\n✅ Got your refresh token! Add this to .env:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${data.refresh_token}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Token exchange error: ${err}`);
    process.exit(1);
  }
});

server.listen(PORT);
