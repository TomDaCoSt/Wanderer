import { requireSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  const session = await requireSession(req, res);
  if (!session) return;

  res.status(200).json({
    authenticated: true,
    user: {
      sub: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
    },
  });
}
