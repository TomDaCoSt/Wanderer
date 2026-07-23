import {
  buildSessionPayload,
  clearOauthCookies,
  createSessionCookie,
  oauthCookieNames,
  parseCookies,
  signSessionToken,
} from '../../_lib/session.js';

async function exchangeCodeForToken({ code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams();
  body.set('code', code);
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('redirect_uri', redirectUri);
  body.set('grant_type', 'authorization_code');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${details}`);
  }

  return res.json();
}

async function fetchGoogleUser(accessToken) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Google user fetch failed (${res.status}): ${details}`);
  }

  return res.json();
}

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !sessionSecret) {
    return res.status(500).json({ error: 'Google OAuth/session env vars are missing' });
  }

  const code = req.query.code;
  const state = req.query.state;
  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const { OAUTH_STATE_COOKIE, OAUTH_RETURN_TO_COOKIE } = oauthCookieNames();
  const storedState = cookies[OAUTH_STATE_COOKIE];
  if (!storedState || storedState !== state) {
    return res.status(400).json({ error: 'Invalid OAuth state' });
  }

  try {
    const tokenPayload = await exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
    const profile = await fetchGoogleUser(tokenPayload.access_token);
    const sessionPayload = buildSessionPayload(profile);
    const sessionToken = await signSessionToken(sessionPayload, sessionSecret);
    const returnTo = cookies[OAUTH_RETURN_TO_COOKIE] || '/';

    res.setHeader('Set-Cookie', [createSessionCookie(sessionToken), ...clearOauthCookies()]);
    res.writeHead(302, { Location: returnTo });
    res.end();
  } catch (error) {
    res.status(500).json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
