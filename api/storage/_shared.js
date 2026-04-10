const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('node:crypto');

function resolveProjectUrl() {
  const explicitProjectUrl = process.env.SUPABASE_URL || process.env.NG_APP_SUPABASE_URL || '';

  if (explicitProjectUrl) {
    return explicitProjectUrl;
  }

  const storageUrl =
    process.env.SUPABASE_STORAGE_URL ||
    process.env.NG_APP_SUPABASE_STORAGE_URL || '';

  try {
    const parsedStorageUrl = new URL(storageUrl);
    const projectRef = parsedStorageUrl.hostname.split('.storage.supabase.co')[0];

    return projectRef ? `https://${projectRef}.supabase.co` : '';
  } catch {
    return '';
  }
}

function getConfig() {
  const projectUrl = resolveProjectUrl();
  const bucket = process.env.SUPABASE_BUCKET || process.env.NG_APP_SUPABASE_BUCKET || 'productos';
  const productImagesPath = process.env.SUPABASE_PRODUCT_IMAGES_PATH || process.env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH || 'productos';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return {
    projectUrl,
    bucket,
    productImagesPath,
    serviceRoleKey
  };
}

function assertConfig() {
  const config = getConfig();

  if (!config.projectUrl || !config.bucket || !config.serviceRoleKey) {
    const error = new Error('Falta configurar Supabase en el entorno del servidor.');
    error.statusCode = 500;
    throw error;
  }

  return config;
}

function createServerSupabaseClient() {
  const config = assertConfig();

  return createClient(config.projectUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function sanitizeFileName(fileName) {
  return fileName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'producto';
}

function getFileExtension(fileName) {
  const extension = fileName.match(/\.[^.]+$/)?.[0]?.toLowerCase();
  return extension || '.jpg';
}

function buildObjectPath(fileName) {
  const { productImagesPath, bucket } = assertConfig();
  let folder = (productImagesPath || '').trim().replace(/^\/+|\/+$/g, '');

  // Evita crear una carpeta con el mismo nombre que el bucket (p. ej. "productos/productos").
  if (folder === bucket) {
    folder = '';
  }
  const cleanFileName = decodeURIComponent(fileName || 'producto.jpg');
  const extension = getFileExtension(cleanFileName);
  const baseName = sanitizeFileName(cleanFileName.replace(/\.[^.]+$/, ''));

  return [folder, `${Date.now()}-${randomUUID()}-${baseName}${extension}`]
    .filter(Boolean)
    .join('/');
}

function extractObjectPathFromPublicUrl(publicUrl) {
  const { bucket } = assertConfig();

  try {
    const url = new URL(publicUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const publicObjectIndex = pathSegments.findIndex(
      (segment, index) => segment === 'object' && pathSegments[index + 1] === 'public'
    );

    if (publicObjectIndex === -1) {
      return null;
    }

    const pathBucket = pathSegments[publicObjectIndex + 2];

    if (pathBucket !== bucket) {
      return null;
    }

    const objectPath = pathSegments.slice(publicObjectIndex + 3).join('/');
    return objectPath ? decodeURIComponent(objectPath) : null;
  } catch {
    return null;
  }
}

async function readRequestBuffer(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const buffer = await readRequestBuffer(req);

  if (buffer.length === 0) {
    return {};
  }

  return JSON.parse(buffer.toString('utf8'));
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

module.exports = {
  assertConfig,
  buildObjectPath,
  createServerSupabaseClient,
  extractObjectPathFromPublicUrl,
  readJsonBody,
  readRequestBuffer,
  resolveProjectUrl,
  sendJson
};