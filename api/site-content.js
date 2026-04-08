import { loadSiteContent, saveSiteContent, isAuthenticated } from './_cms.js';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    const content = await loadSiteContent();
    return response.status(200).json({ content });
  }

  if (request.method === 'PUT') {
    if (!isAuthenticated(request)) {
      return response.status(401).json({ error: 'Unauthorized.' });
    }

    try {
      const content = await saveSiteContent(request.body);
      return response.status(200).json({ content });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  response.setHeader('Allow', 'GET, PUT');
  return response.status(405).json({ error: 'Method not allowed.' });
}
