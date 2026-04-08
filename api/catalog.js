import { isAuthenticated, loadCatalog, saveCatalog } from './_cms.js';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    const catalog = await loadCatalog();
    return response.status(200).json({ catalog });
  }

  if (request.method === 'PUT') {
    if (!isAuthenticated(request)) {
      return response.status(401).json({ error: 'Unauthorized.' });
    }

    try {
      const catalog = await saveCatalog(request.body);
      return response.status(200).json({ catalog });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  response.setHeader('Allow', 'GET, PUT');
  return response.status(405).json({ error: 'Method not allowed.' });
}
