import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_COOKIE = 'cms_session';
const defaultsCache = new Map();

function mergeSiteContent(defaultContent, savedContent) {
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

function mergeCatalog(defaultCatalog, savedCatalog) {
  return {
    fineArtThemes: Array.isArray(savedCatalog?.fineArtThemes)
      ? savedCatalog.fineArtThemes
      : defaultCatalog.fineArtThemes,
    products: Array.isArray(savedCatalog?.products)
      ? savedCatalog.products
      : defaultCatalog.products,
  };
}

async function readDefaultJson(relativePath) {
  if (defaultsCache.has(relativePath)) {
    return defaultsCache.get(relativePath);
  }

  const fullPath = path.join(__dirname, '..', relativePath);
  const rawContent = await fs.readFile(fullPath, 'utf8');
  const parsed = JSON.parse(rawContent);
  defaultsCache.set(relativePath, parsed);
  return parsed;
}

async function githubRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'photo-print-site-cms',
      ...(options.headers || {}),
    },
  });
}

function getRepoConfig() {
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

function buildContentsApiUrl(filePath, withRef = false) {
  const { owner, repo, branch } = getRepoConfig();
  const refPart = withRef ? `?ref=${branch}` : '';
  return `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${refPart}`;
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
  return matched ? decodeURIComponent(matched.split('=')[1] || '') : '';
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

async function loadJsonFromGithubOrDefault(defaultPath, mergeFn, envKeyPathName) {
  const defaults = await readDefaultJson(defaultPath);
  const { owner, repo } = getRepoConfig();
  const filePath = process.env[envKeyPathName] || defaultPath;

  if (!process.env.GITHUB_TOKEN || !owner || !repo) {
    return defaults;
  }

  try {
    const response = await githubRequest(buildContentsApiUrl(filePath, true));

    if (!response.ok) {
      return defaults;
    }

    const githubFile = await response.json();
    const decodedContent = Buffer.from(githubFile.content, 'base64').toString('utf8');
    return mergeFn(defaults, JSON.parse(decodedContent));
  } catch (error) {
    console.error(`Unable to load ${filePath} from GitHub.`, error);
    return defaults;
  }
}

async function saveJsonToGithub(defaultPath, envKeyPathName, data, mergeFn, message) {
  const defaults = await readDefaultJson(defaultPath);
  const mergedData = mergeFn(defaults, data);
  const { owner, repo, branch } = getRepoConfig();
  const filePath = process.env[envKeyPathName] || defaultPath;

  if (!process.env.GITHUB_TOKEN || !owner || !repo) {
    throw new Error('Missing GitHub CMS environment variables.');
  }

  const apiUrl = buildContentsApiUrl(filePath);
  let sha;
  const existingFileResponse = await githubRequest(buildContentsApiUrl(filePath, true));

  if (existingFileResponse.ok) {
    const existingFile = await existingFileResponse.json();
    sha = existingFile.sha;
  }

  const response = await githubRequest(apiUrl, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(mergedData, null, 2)).toString('base64'),
      branch,
      sha,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.message || `Unable to save ${filePath}.`);
  }

  return mergedData;
}

export async function loadSiteContent() {
  return loadJsonFromGithubOrDefault('content/site-content.json', mergeSiteContent, 'CMS_CONTENT_PATH');
}

export async function saveSiteContent(content) {
  return saveJsonToGithub(
    'content/site-content.json',
    'CMS_CONTENT_PATH',
    content,
    mergeSiteContent,
    'Update site content from CMS',
  );
}

export async function loadCatalog() {
  return loadJsonFromGithubOrDefault('content/catalog.json', mergeCatalog, 'CMS_CATALOG_PATH');
}

export async function saveCatalog(catalog) {
  return saveJsonToGithub(
    'content/catalog.json',
    'CMS_CATALOG_PATH',
    catalog,
    mergeCatalog,
    'Update catalog from CMS',
  );
}

export async function uploadImageToGithub({ fileName, mimeType, base64Data }) {
  const { owner, repo, branch } = getRepoConfig();

  if (!process.env.GITHUB_TOKEN || !owner || !repo) {
    throw new Error('Missing GitHub CMS environment variables.');
  }

  const sanitizedName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-');
  const extension =
    sanitizedName.includes('.') ? sanitizedName.split('.').pop() : mimeType.split('/')[1] || 'jpg';
  const filePath = `${process.env.CMS_IMAGE_PATH || 'public/images/cms'}/${Date.now()}-${sanitizedName.replace(/\.[^.]+$/, '')}.${extension}`;
  const apiUrl = buildContentsApiUrl(filePath);

  const response = await githubRequest(apiUrl, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Upload image ${fileName} from CMS`,
      content: base64Data,
      branch,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.message || 'Unable to upload image.');
  }

  return { path: `/${filePath.replace(/^public\//, '')}` };
}
