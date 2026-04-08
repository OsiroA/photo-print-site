import { clearSessionCookie, setSessionCookie } from './_cms.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const adminPassword = process.env.CMS_ADMIN_PASSWORD;

  if (!adminPassword) {
    return response.status(500).json({ error: 'CMS_ADMIN_PASSWORD is not configured.' });
  }

  const submittedPassword = String(request.body?.password || '');

  if (submittedPassword !== adminPassword) {
    clearSessionCookie(response);
    return response.status(401).json({ error: 'Incorrect password.' });
  }

  setSessionCookie(response, adminPassword);
  return response.status(200).json({ ok: true });
}
