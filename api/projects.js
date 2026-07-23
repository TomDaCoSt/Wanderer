import { requireSession } from './_lib/auth.js';
import { loadUserWorkspace, saveUserWorkspace } from './_lib/projectStore.js';

async function readRequestBody(req) {
  if (req.body !== undefined) return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) return {};

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    return rawBody;
  }
}

export default async function handler(req, res) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const workspace = await loadUserWorkspace(session.sub);
    return res.status(200).json({ workspace });
  }

  if (req.method === 'PUT') {
    const body = await readRequestBody(req);
    if (!body || typeof body !== 'object' || !body.workspace) {
      return res.status(400).json({ error: 'workspace payload is required' });
    }
    const workspace = await saveUserWorkspace(session.sub, body.workspace);
    return res.status(200).json({ workspace });
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
