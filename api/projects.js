import { requireSession } from './_lib/auth.js';
import { loadUserWorkspace, saveUserWorkspace } from './_lib/projectStore.js';

export default async function handler(req, res) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const workspace = await loadUserWorkspace(session.sub);
    return res.status(200).json({ workspace });
  }

  if (req.method === 'PUT') {
    if (!req.body || typeof req.body !== 'object' || !req.body.workspace) {
      return res.status(400).json({ error: 'workspace payload is required' });
    }
    const workspace = await saveUserWorkspace(session.sub, req.body.workspace);
    return res.status(200).json({ workspace });
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
