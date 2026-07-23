const PROTECTED_PATHS = ['/'];

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Wanderer", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) return null;

  const decoded = atob(header.slice(6));
  const separator = decoded.indexOf(':');
  if (separator === -1) return null;

  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

export function middleware(request) {
  const { pathname } = new URL(request.url);
  const username = process.env.VERCEL_AUTH_USER;
  const password = process.env.VERCEL_AUTH_PASSWORD;

  if (!username || !password) {
    return new Response('Auth not configured', {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const isProtected = PROTECTED_PATHS.some((path) => pathname === path);
  if (!isProtected) return;

  const credentials = parseBasicAuth(request.headers.get('authorization'));
  if (!credentials) return unauthorized();

  if (credentials.username !== username || credentials.password !== password) {
    return unauthorized();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
