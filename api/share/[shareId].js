// api/share/[shareId].js
// GET    /api/share/:shareId  — charge un projet partagé
// PUT    /api/share/:shareId  — met à jour les données (last-write-wins)
// DELETE /api/share/:shareId  — supprime le partage (owner uniquement)
import { requireSession } from '../_lib/auth.js';
import { getShare, updateShare, deleteShare } from '../_lib/shareStore.js';

async function readBody(req) {
  if (req.body !== undefined) return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function handler(req, res) {
  const session = await requireSession(req, res);
  if (!session) return;

  res.setHeader('Cache-Control', 'no-store');

  const { shareId } = req.query;
  if (!shareId || typeof shareId !== 'string') {
    return res.status(400).json({ error: 'shareId manquant' });
  }

  // ── GET : lire un projet partagé ─────────────────────────────────────────
  if (req.method === 'GET') {
    const share = await getShare(shareId, session.sub, session.email);
    if (!share) return res.status(404).json({ error: 'Partage introuvable ou accès refusé' });
    return res.status(200).json({ share });
  }

  // ── PUT : mettre à jour les données du projet partagé ────────────────────
  if (req.method === 'PUT') {
    const body = await readBody(req);
    if (!body || typeof body.data !== 'object') {
      return res.status(400).json({ error: 'data est requise' });
    }

    const updated = await updateShare(shareId, session.sub, session.email, body.data);
    if (!updated) return res.status(404).json({ error: 'Partage introuvable ou accès refusé' });

    return res.status(200).json({ share: updated });
  }

  // ── DELETE : supprimer le partage (owner seulement) ──────────────────────
  if (req.method === 'DELETE') {
    const ok = await deleteShare(shareId, session.sub);
    if (!ok) return res.status(403).json({ error: 'Seul le propriétaire peut supprimer ce partage' });
    return res.status(200).json({ deleted: true });
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
