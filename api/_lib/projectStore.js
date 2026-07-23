// api/_lib/projectStore.js
// Stockage des workspaces utilisateur via Upstash Redis (recommandé par Vercel)
// Nécessite les variables d'env : UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
import { Redis } from '@upstash/redis';

const KV_PREFIX = 'workspace:';
const KV_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 an

// Le client Redis est initialisé automatiquement depuis les variables d'environnement
// UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function userKey(userId) {
  return `${KV_PREFIX}${userId}`;
}

function createDefaultWorkspace() {
  return {
    version: 1,
    activeProjectId: '',
    projects: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeWorkspace(payload) {
  if (!payload || typeof payload !== 'object') return createDefaultWorkspace();

  const projects = Array.isArray(payload.projects)
    ? payload.projects.filter(
        (p) => p && typeof p === 'object' && p.id && p.data
      )
    : [];

  return {
    version: 1,
    activeProjectId: typeof payload.activeProjectId === 'string' ? payload.activeProjectId : '',
    projects,
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };
}

/**
 * Charge le workspace d'un utilisateur depuis Upstash Redis.
 * Retourne un workspace vide si l'utilisateur n'existe pas encore.
 */
export async function loadUserWorkspace(userId) {
  try {
    const data = await redis.get(userKey(userId));
    return normalizeWorkspace(data);
  } catch (error) {
    console.error('[projectStore] loadUserWorkspace error:', error);
    return createDefaultWorkspace();
  }
}

/**
 * Sauvegarde le workspace d'un utilisateur dans Upstash Redis.
 * Le serveur est la source de vérité pour l'horodatage updatedAt.
 */
export async function saveUserWorkspace(userId, workspace) {
  const normalized = normalizeWorkspace(workspace);
  normalized.updatedAt = new Date().toISOString(); // Toujours forcer l'horodatage serveur

  try {
    await redis.set(userKey(userId), normalized, { ex: KV_TTL_SECONDS });
    return normalized;
  } catch (error) {
    console.error('[projectStore] saveUserWorkspace error:', error);
    throw error;
  }
}
