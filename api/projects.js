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
  // Vérification anticipée des variables d'environnement Upstash
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('[api/projects] UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN manquant !');
    return res.status(503).json({
      error: 'Cloud storage non configuré. Ajoutez UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN dans les variables Vercel.',
    });
  }

  const session = await requireSession(req, res);
  if (!session) return;

  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const workspace = await loadUserWorkspace(session.sub);

    // Header Last-Modified pour la sync conditionnelle (If-Modified-Since)
    if (workspace.updatedAt) {
      res.setHeader('Last-Modified', new Date(workspace.updatedAt).toUTCString());
    }

    // 304 Not Modified si le client a déjà la version à jour
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince && workspace.updatedAt) {
      const clientDate = new Date(ifModifiedSince);
      const serverDate = new Date(workspace.updatedAt);
      if (!isNaN(clientDate) && serverDate <= clientDate) {
        return res.status(304).end();
      }
    }

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
