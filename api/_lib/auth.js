import { SESSION_COOKIE_NAME, parseCookies, verifySessionToken } from './session.js';

export async function requireSession(req, res) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'SESSION_SECRET is not configured' });
    return null;
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const session = await verifySessionToken(token, secret);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  return session;
}
