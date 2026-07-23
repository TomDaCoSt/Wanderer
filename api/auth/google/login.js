import { createReturnToCookie, createStateCookie, generateRandomState } from '../../_lib/session.js';

function sanitizeReturnTo(returnTo) {
  if (!returnTo || typeof returnTo !== 'string') return '/';
  if (!returnTo.startsWith('/')) return '/';
  if (returnTo.startsWith('//')) return '/';
  return returnTo;
}

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Google OAuth is not configured' });
  }

  const state = generateRandomState();
  const returnTo = sanitizeReturnTo(req.query.returnTo);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  res.setHeader('Set-Cookie', [createStateCookie(state), createReturnToCookie(returnTo)]);
  res.writeHead(302, { Location: authUrl.toString() });
  res.end();
}
