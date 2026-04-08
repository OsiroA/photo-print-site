import { clearSessionCookie, isAuthenticated } from './_cms.js';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    return response.status(200).json({ authenticated: isAuthenticated(request) });
  }

  if (request.method === 'DELETE') {
    clearSessionCookie(response);
    return response.status(200).json({ ok: true });
  }

  response.setHeader('Allow', 'GET, DELETE');
  return response.status(405).json({ error: 'Method not allowed.' });
}
