// api/share.js
// GET  /api/share  — liste tous les partages de l'utilisateur
// POST /api/share  — crée un nouveau partage
import { requireSession } from './_lib/auth.js';
import { createShare, listUserShares } from './_lib/shareStore.js';

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

  // ── GET : liste les partages accessibles par l'utilisateur ──────────────
  if (req.method === 'GET') {
    const shares = await listUserShares(session.sub, session.email);
    return res.status(200).json({ shares });
  }

  // ── POST : crée un partage ───────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = await readBody(req);
    const { project, inviteeEmail } = body;

    if (!project || typeof project !== 'object') {
      return res.status(400).json({ error: 'project est requis' });
    }
    if (!inviteeEmail || typeof inviteeEmail !== 'string' || !inviteeEmail.includes('@')) {
      return res.status(400).json({ error: 'inviteeEmail invalide' });
    }
    // Empêcher de partager avec soi-même
    if (inviteeEmail.toLowerCase() === session.email.toLowerCase()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas partager un projet avec vous-même' });
    }

    const share = await createShare({
      ownerId: session.sub,
      ownerEmail: session.email,
      project,
      inviteeEmail: inviteeEmail.toLowerCase().trim(),
    });

    return res.status(201).json({ shareId: share.shareId, share });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
