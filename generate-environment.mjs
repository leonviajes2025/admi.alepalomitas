import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const mode = process.argv[2] === 'development' ? 'development' : 'production';
const truthy = new Set(['1', 'true', 'yes', 'on']);

// Load .env files depending on mode. Development reads .env and .env.local;
// production reads .env and .env.production.
if (mode === 'development') {
  await loadDotEnvFiles(['.env', '.env.local']);
} else {
  await loadDotEnvFiles(['.env', '.env.production']);
}

const defaultApiBaseUrl = mode === 'development' ? '/api' : 'https://api.palomitasbee.com';
const apiBaseUrl = process.env.NG_APP_API_BASE_URL || defaultApiBaseUrl;
const diagnosticsFallback = mode === 'development' ? 'true' : 'false';
const diagnosticsValue = (process.env.NG_APP_API_DIAGNOSTICS || diagnosticsFallback).toLowerCase();
const apiDiagnostics = truthy.has(diagnosticsValue);
const authDefaultUsername = process.env.NG_APP_DEFAULT_ADMIN_USERNAME || (mode === 'development' ? 'alejandrina' : '');
const authDefaultPassword = process.env.NG_APP_DEFAULT_ADMIN_PASSWORD || (mode === 'development' ? 'alejandrina123' : '');
const supabaseUrl = process.env.NG_APP_SUPABASE_URL || '';
const supabaseStorageUrl = process.env.NG_APP_SUPABASE_STORAGE_URL || '';
const supabaseAnonKey = process.env.NG_APP_SUPABASE_ANON_KEY || '';
const supabaseBucket = process.env.NG_APP_SUPABASE_BUCKET || 'productos';
const supabaseProductImagesPath = process.env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH || 'productos';

const content = `export const environment = {
  production: ${mode === 'production'},
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
  apiDiagnostics: ${apiDiagnostics},
  auth: {
    defaultUsername: ${JSON.stringify(authDefaultUsername)},
    defaultPassword: ${JSON.stringify(authDefaultPassword)}
  },
  supabase: {
    url: ${JSON.stringify(supabaseUrl)},
    storageUrl: ${JSON.stringify(supabaseStorageUrl)},
    anonKey: ${JSON.stringify(supabaseAnonKey)},
    bucket: ${JSON.stringify(supabaseBucket)},
    productImagesPath: ${JSON.stringify(supabaseProductImagesPath)}
  }
} as const;
`;

const generatedPath = resolve(
  mode === 'development'
    ? 'src/environments/environment.generated.development.ts'
    : 'src/environments/environment.generated.production.ts'
);

const mainPath = resolve('src/environments/environment.ts');

// Write both a generated file (for reference) and the canonical environment.ts
await writeFile(generatedPath, content, 'utf8');
await writeFile(mainPath, content, 'utf8');

process.stdout.write(`${mode} environment generated at ${generatedPath} and ${mainPath}\n`);

async function loadDotEnvFiles(fileNames) {
  for (const fileName of fileNames) {
    const filePath = resolve(fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const content = await readFile(filePath, 'utf8');
    const entries = parseDotEnv(content);

    for (const [key, value] of Object.entries(entries)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseDotEnv(content) {
  return content
    .split(/\r?\n/)
    .reduce((result, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return result;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        return result;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const normalizedValue = rawValue.replace(/^['\"]|['\"]$/g, '');

      result[key] = normalizedValue;
      return result;
    }, {});
}