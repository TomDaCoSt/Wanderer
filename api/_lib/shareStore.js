// api/_lib/shareStore.js
// Stockage des projets partagés dans Upstash Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 365; // 1 an

// Clés Redis
const shareKey    = (shareId)  => `shared:${shareId}`;
const userSetKey  = (userId)   => `user_shares:${userId}`;
const inviteKey   = (email)    => `invites:${encodeURIComponent(email)}`;

function genShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return 'share-' + Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Crée un nouveau partage de projet.
 * - Génère un shareId unique
 * - Stocke le projet partagé dans Redis
 * - Enregistre le shareId dans le set de l'owner et dans les invitations de l'invité
 */
export async function createShare({ ownerId, ownerEmail, project, inviteeEmail }) {
  const shareId = genShareId();
  const now = new Date().toISOString();

  const shareData = {
    shareId,
    ownerId,
    ownerEmail,
    collaborators: [{ email: inviteeEmail }],
    project: {
      ...project,
      updatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Stocker le projet partagé
  await redis.set(shareKey(shareId), shareData, { ex: TTL });

  // Enregistrer dans le set de l'owner
  await redis.sadd(userSetKey(ownerId), shareId);
  await redis.expire(userSetKey(ownerId), TTL);

  // Enregistrer dans les invitations de l'invité (pour qu'il le retrouve à la connexion)
  await redis.sadd(inviteKey(inviteeEmail), shareId);
  await redis.expire(inviteKey(inviteeEmail), TTL);

  return shareData;
}

/**
 * Charge un projet partagé par shareId.
 * Vérifie que le demandeur est owner ou collaborateur.
 */
export async function getShare(shareId, requesterId, requesterEmail) {
  const data = await redis.get(shareKey(shareId));
  if (!data) return null;

  const isOwner = data.ownerId === requesterId;
  const isCollaborator = data.collaborators?.some(
    (c) => c.email === requesterEmail || c.userId === requesterId
  );

  if (!isOwner && !isCollaborator) return null;

  // Enregistrer l'userId du collaborateur s'il n'est pas encore stocké
  if (isCollaborator) {
    const collab = data.collaborators.find((c) => c.email === requesterEmail);
    if (collab && !collab.userId) {
      collab.userId = requesterId;
      await redis.set(shareKey(shareId), data, { ex: TTL });
      // Ajouter à son set personnel
      await redis.sadd(userSetKey(requesterId), shareId);
      await redis.expire(userSetKey(requesterId), TTL);
    }
  }

  return data;
}

/**
 * Met à jour les données d'un projet partagé (last-write-wins).
 * Tout collaborateur peut écrire.
 */
export async function updateShare(shareId, requesterId, requesterEmail, projectData) {
  const existing = await getShare(shareId, requesterId, requesterEmail);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    project: {
      ...existing.project,
      data: projectData,
      updatedAt: now,
    },
    updatedAt: now,
  };

  await redis.set(shareKey(shareId), updated, { ex: TTL });
  return updated;
}

/**
 * Supprime un partage.
 * Seul le propriétaire peut supprimer.
 */
export async function deleteShare(shareId, requesterId) {
  const existing = await redis.get(shareKey(shareId));
  if (!existing) return false;
  if (existing.ownerId !== requesterId) return false;

  // Supprimer la clé principale
  await redis.del(shareKey(shareId));

  // Nettoyer les sets utilisateurs
  await redis.srem(userSetKey(requesterId), shareId);
  for (const collab of existing.collaborators || []) {
    if (collab.userId) await redis.srem(userSetKey(collab.userId), shareId);
    if (collab.email) await redis.srem(inviteKey(collab.email), shareId);
  }

  return true;
}

/**
 * Liste tous les partages accessibles par un utilisateur :
 * - les partages dont il est owner
 * - les partages où il est collaborateur (via invitations par email)
 */
export async function listUserShares(userId, userEmail) {
  const shareIds = new Set();

  // Récupérer les partages de l'owner
  const ownerIds = await redis.smembers(userSetKey(userId));
  for (const id of ownerIds || []) shareIds.add(id);

  // Récupérer les invitations pour cet email
  const inviteIds = await redis.smembers(inviteKey(userEmail));
  for (const id of inviteIds || []) shareIds.add(id);

  if (!shareIds.size) return [];

  // Charger les données de chaque partage (en parallèle)
  const results = await Promise.all(
    [...shareIds].map((id) => getShare(id, userId, userEmail))
  );

  return results.filter(Boolean).map((share) => ({
    shareId: share.shareId,
    ownerId: share.ownerId,
    ownerEmail: share.ownerEmail,
    isOwner: share.ownerId === userId,
    collaborators: share.collaborators,
    project: share.project,
    createdAt: share.createdAt,
    updatedAt: share.updatedAt,
  }));
}
