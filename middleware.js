import { SESSION_COOKIE_NAME, parseCookies, verifySessionToken } from './api/_lib/session.js';

const PUBLIC_PATHS = [
  '/api/auth/google/login',
  '/api/auth/google/callback',
];

function isPublicAsset(pathname) {
  return pathname.startsWith('/css/')
    || pathname.startsWith('/js/')
    || pathname === '/manifest.json'
    || pathname === '/sw.js'
    || pathname === '/favicon.ico';
}

function redirectToLogin(request) {
  const currentUrl = new URL(request.url);
  const loginUrl = new URL('/api/auth/google/login', currentUrl.origin);
  loginUrl.searchParams.set('returnTo', `${currentUrl.pathname}${currentUrl.search}`);

  return Response.redirect(loginUrl, 302);
}

export async function middleware(request) {
  const { pathname } = new URL(request.url);

  if (isPublicAsset(pathname) || PUBLIC_PATHS.includes(pathname)) {
    return;
  }

  if (pathname.startsWith('/api/')) {
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return new Response('SESSION_SECRET is not configured', {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const cookies = parseCookies(request.headers.get('cookie') || '');
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return redirectToLogin(request);

  const session = await verifySessionToken(token, secret);
  if (!session) return redirectToLogin(request);
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
