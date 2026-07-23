let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function refreshCurrentUser() {
  const res = await fetch('/api/auth/me', { method: 'GET' });
  if (!res.ok) {
    currentUser = null;
    return null;
  }

  const payload = await res.json();
  currentUser = payload.user || null;
  return currentUser;
}

export function logout() {
  window.location.href = '/api/auth/logout';
}
