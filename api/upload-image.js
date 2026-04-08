import { isAuthenticated, uploadImageToGithub } from './_cms.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (!isAuthenticated(request)) {
    return response.status(401).json({ error: 'Unauthorized.' });
  }

  const fileName = String(request.body?.fileName || '').trim();
  const mimeType = String(request.body?.mimeType || '').trim();
  const dataUrl = String(request.body?.dataUrl || '');

  if (!fileName || !mimeType || !dataUrl.startsWith('data:')) {
    return response.status(400).json({ error: 'A valid image payload is required.' });
  }

  const base64Data = dataUrl.split(',')[1];

  if (!base64Data) {
    return response.status(400).json({ error: 'Invalid image payload.' });
  }

  try {
    const result = await uploadImageToGithub({ fileName, mimeType, base64Data });
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
