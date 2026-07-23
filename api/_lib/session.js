const SESSION_VERSION = 'v1';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE_NAME = 'wanderer_session';
const OAUTH_STATE_COOKIE = 'wanderer_oauth_state';
const OAUTH_RETURN_TO_COOKIE = 'wanderer_oauth_return_to';

function toBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(base64) {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(base64, 'base64'));
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBase64Url(input) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const decoder = new TextDecoder();
  return decoder.decode(fromBase64(padded));
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256Hex(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return toHex(signature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function parseCookies(cookieHeader) {
  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const separator = entry.indexOf('=');
      if (separator === -1) return acc;
      const name = entry.slice(0, separator).trim();
      const value = entry.slice(separator + 1).trim();
      acc[name] = decodeURIComponent(value);
      return acc;
    }, {});
}

export function serializeCookie(name, value, options = {}) {
  const attributes = [`${name}=${encodeURIComponent(value)}`];
  attributes.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) attributes.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) attributes.push('HttpOnly');
  if (options.secure !== false) attributes.push('Secure');
  attributes.push(`SameSite=${options.sameSite || 'Lax'}`);
  return attributes.join('; ');
}

export function buildSessionPayload(profile) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: profile.sub,
    email: profile.email,
    name: profile.name || profile.email || 'Utilisateur',
    picture: profile.picture || '',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
}

export async function signSessionToken(payload, secret) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await hmacSha256Hex(secret, `${SESSION_VERSION}.${encodedPayload}`);
  return `${SESSION_VERSION}.${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const [version, encodedPayload, signature] = token.split('.');
  if (!version || !encodedPayload || !signature) return null;
  if (version !== SESSION_VERSION) return null;

  const expected = await hmacSha256Hex(secret, `${version}.${encodedPayload}`);
  if (!timingSafeEqual(expected, signature)) return null;

  const payload = JSON.parse(decodeBase64Url(encodedPayload));
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.exp || Math.floor(Date.now() / 1000) >= payload.exp) return null;
  if (!payload.sub || !payload.email) return null;
  return payload;
}

export function createSessionCookie(token) {
  return serializeCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
  });
}

export function oauthCookieNames() {
  return { OAUTH_STATE_COOKIE, OAUTH_RETURN_TO_COOKIE };
}

export function createStateCookie(state) {
  return serializeCookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 600,
    path: '/',
  });
}

export function createReturnToCookie(returnTo) {
  return serializeCookie(OAUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 600,
    path: '/',
  });
}

export function clearOauthCookies() {
  return [
    serializeCookie(OAUTH_STATE_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 0,
      path: '/',
    }),
    serializeCookie(OAUTH_RETURN_TO_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 0,
      path: '/',
    }),
  ];
}

export function generateRandomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
