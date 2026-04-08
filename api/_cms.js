import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, '..', 'content', 'site-content.json');
const SESSION_COOKIE = 'cms_session';

function mergeContent(defaultContent, savedContent) {
  if (!savedContent) {
    return defaultContent;
  }

  return {
    ...defaultContent,
    ...savedContent,
    brand: { ...defaultContent.brand, ...savedContent.brand },
    home: { ...defaultContent.home, ...savedContent.home },
    about: {
      ...defaultContent.about,
      ...savedContent.about,
      paragraphs:
        savedContent.about?.paragraphs?.length
          ? savedContent.about.paragraphs
          : defaultContent.about.paragraphs,
    },
    socials: { ...defaultContent.socials, ...savedContent.socials },
  };
}

async function readDefaultContent() {
  const rawContent = await fs.readFile(CONTENT_FILE, 'utf8');
  return JSON.parse(rawContent);
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'photo-print-site-cms',
      ...(options.headers || {}),
    },
  });

  return response;
}

export function createSessionToken(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) {
    return '';
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const matched = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return matched ? decodeURIComponent(matched.split('=').slice(1).join('=')) : '';
}

export function setSessionCookie(response, password) {
  const sessionToken = createSessionToken(password);
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`,
  );
}

export function clearSessionCookie(response) {
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`,
  );
}

export function isAuthenticated(request) {
  const adminPassword = process.env.CMS_ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  const cookieValue = getCookieValue(request.headers.cookie, SESSION_COOKIE);
  return cookieValue === createSessionToken(adminPassword);
}

export async function loadSiteContent() {
  const defaultContent = await readDefaultContent();

  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    return defaultContent;
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = process.env.CMS_CONTENT_PATH || 'content/site-content.json';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  try {
    const response = await githubRequest(apiUrl);

    if (!response.ok) {
      return defaultContent;
    }

    const githubFile = await response.json();
    const decodedContent = Buffer.from(githubFile.content, 'base64').toString('utf8');
    return mergeContent(defaultContent, JSON.parse(decodedContent));
  } catch (error) {
    console.error('Unable to load CMS content from GitHub.', error);
    return defaultContent;
  }
}

export async function saveSiteContent(content) {
  const defaultContent = await readDefaultContent();
  const mergedContent = mergeContent(defaultContent, content);

  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    throw new Error('Missing GitHub CMS environment variables.');
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = process.env.CMS_CONTENT_PATH || 'content/site-content.json';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  let sha;
  const existingFileResponse = await githubRequest(`${apiUrl}?ref=${branch}`);

  if (existingFileResponse.ok) {
    const existingFile = await existingFileResponse.json();
    sha = existingFile.sha;
  }

  const response = await githubRequest(apiUrl, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'Update site content from CMS',
      content: Buffer.from(JSON.stringify(mergedContent, null, 2)).toString('base64'),
      branch,
      sha,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.message || 'Unable to save CMS content.');
  }

  return mergedContent;
}
