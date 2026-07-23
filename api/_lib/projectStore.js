const API_BASE = 'https://jsonblob.com/api/jsonBlob';
const REGISTRY_BLOB_ID = '019fe77f-4b2a-7ef0-9fbf-8ec55817d281';

function createEmptyRegistry() {
  return { version: 1, users: {} };
}

function normalizeRegistry(payload) {
  if (!payload || typeof payload !== 'object' || !payload.users || typeof payload.users !== 'object') {
    return createEmptyRegistry();
  }
  return { version: 1, users: { ...payload.users } };
}

function extractBlobIdFromLocation(res) {
  const location = res.headers.get('Location') || res.headers.get('location') || res.headers.get('X-jsonblob-id');
  if (!location) return null;
  return location.split('/').filter(Boolean).pop() || null;
}

async function readRegistry() {
  const res = await fetch(`${API_BASE}/${REGISTRY_BLOB_ID}`);
  if (!res.ok) return createEmptyRegistry();
  return normalizeRegistry(await res.json());
}

async function writeRegistry(registry) {
  const res = await fetch(`${API_BASE}/${REGISTRY_BLOB_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registry),
  });
  if (!res.ok) {
    throw new Error(`Unable to update projects registry (${res.status})`);
  }
}

async function createBlob(payload) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Unable to create projects blob (${res.status})`);
  }
  const blobId = extractBlobIdFromLocation(res);
  if (!blobId) throw new Error('Unable to resolve new projects blob id');
  return blobId;
}

async function writeBlob(blobId, payload) {
  const res = await fetch(`${API_BASE}/${blobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Unable to update projects blob (${res.status})`);
  }
}

function createDefaultWorkspace() {
  return {
    version: 1,
    activeProjectId: '',
    projects: [],
  };
}

function normalizeWorkspace(payload) {
  if (!payload || typeof payload !== 'object') return createDefaultWorkspace();
  const projects = Array.isArray(payload.projects) ? payload.projects.filter((project) => project && typeof project === 'object' && project.id && project.data) : [];
  const activeProjectId = typeof payload.activeProjectId === 'string' ? payload.activeProjectId : '';
  return {
    version: 1,
    activeProjectId,
    projects,
  };
}

export async function loadUserWorkspace(userId) {
  const registry = await readRegistry();
  const blobId = registry.users[userId];
  if (!blobId) return createDefaultWorkspace();

  const res = await fetch(`${API_BASE}/${blobId}`);
  if (!res.ok) return createDefaultWorkspace();
  return normalizeWorkspace(await res.json());
}

export async function saveUserWorkspace(userId, workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const registry = await readRegistry();
  let blobId = registry.users[userId];

  if (!blobId) {
    blobId = await createBlob(normalizedWorkspace);
    const nextRegistry = {
      version: 1,
      users: { ...registry.users, [userId]: blobId },
    };
    await writeRegistry(nextRegistry);
    return normalizedWorkspace;
  }

  await writeBlob(blobId, normalizedWorkspace);
  return normalizedWorkspace;
}
