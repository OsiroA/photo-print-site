import crypto from 'node:crypto';
import defaultSiteContent from '../content/site-content.json' with { type: 'json' };
import defaultCatalog from '../content/catalog.json' with { type: 'json' };

const SESSION_COOKIE = 'cms_session';

function mergeSiteContent(baseContent, savedContent) {
  if (!savedContent) {
    return baseContent;
  }

  return {
    ...baseContent,
    ...savedContent,
    brand: { ...baseContent.brand, ...savedContent.brand },
    home: { ...baseContent.home, ...savedContent.home },
    about: {
      ...baseContent.about,
      ...savedContent.about,
      paragraphs:
        savedContent.about?.paragraphs?.length
          ? savedContent.about.paragraphs
          : baseContent.about.paragraphs,
    },
    socials: { ...baseContent.socials, ...savedContent.socials },
  };
}

function mergeCatalog(baseCatalog, savedCatalog) {
  return {
    fineArtThemes: Array.isArray(savedCatalog?.fineArtThemes)
      ? savedCatalog.fineArtThemes
      : baseCatalog.fineArtThemes,
    products: Array.isArray(savedCatalog?.products)
      ? savedCatalog.products
      : baseCatalog.products,
  };
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

async function loadJsonFromGithubOrDefault(baseData, mergeFn, envKeyPathName, fallbackPath) {
  const { owner, repo } = getRepoConfig();
  const filePath = process.env[envKeyPathName] || fallbackPath;

  if (!process.env.GITHUB_TOKEN || !owner || !repo) {
    return baseData;
  }

  try {
    const response = await githubRequest(buildContentsApiUrl(filePath, true));

    if (!response.ok) {
      return baseData;
    }

    const githubFile = await response.json();
    const decodedContent = Buffer.from(githubFile.content, 'base64').toString('utf8');
    return mergeFn(baseData, JSON.parse(decodedContent));
  } catch (error) {
    console.error(`Unable to load ${filePath} from GitHub.`, error);
    return baseData;
  }
}

async function saveJsonToGithub(baseData, envKeyPathName, data, mergeFn, message, fallbackPath) {
  const mergedData = mergeFn(baseData, data);
  const { owner, repo, branch } = getRepoConfig();
  const filePath = process.env[envKeyPathName] || fallbackPath;

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
  return loadJsonFromGithubOrDefault(
    defaultSiteContent,
    mergeSiteContent,
    'CMS_CONTENT_PATH',
    'content/site-content.json',
  );
}

export async function saveSiteContent(content) {
  return saveJsonToGithub(
    defaultSiteContent,
    'CMS_CONTENT_PATH',
    content,
    mergeSiteContent,
    'Update site content from CMS',
    'content/site-content.json',
  );
}

export async function loadCatalog() {
  return loadJsonFromGithubOrDefault(
    defaultCatalog,
    mergeCatalog,
    'CMS_CATALOG_PATH',
    'content/catalog.json',
  );
}

export async function saveCatalog(catalog) {
  return saveJsonToGithub(
    defaultCatalog,
    'CMS_CATALOG_PATH',
    catalog,
    mergeCatalog,
    'Update catalog from CMS',
    'content/catalog.json',
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
