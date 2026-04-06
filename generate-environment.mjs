import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const mode = process.argv[2] === 'development' ? 'development' : 'production';
const truthy = new Set(['1', 'true', 'yes', 'on']);

await loadDotEnvFiles(['.env', '.env.local']);

const apiBaseUrl = process.env.NG_APP_API_BASE_URL || '/api';
const diagnosticsFallback = mode === 'development' ? 'true' : 'false';
const diagnosticsValue = (process.env.NG_APP_API_DIAGNOSTICS || diagnosticsFallback).toLowerCase();
const apiDiagnostics = truthy.has(diagnosticsValue);
const supabaseUrl = process.env.NG_APP_SUPABASE_URL || '';
const supabaseStorageUrl = process.env.NG_APP_SUPABASE_STORAGE_URL || 'https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3';
const supabaseAnonKey = process.env.NG_APP_SUPABASE_ANON_KEY || '';
const supabaseBucket = process.env.NG_APP_SUPABASE_BUCKET || '';
const supabaseProductImagesPath = process.env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH || 'productos';

const content = `export const environment = {
  production: ${mode === 'production'},
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
  apiDiagnostics: ${apiDiagnostics},
  supabase: {
    url: ${JSON.stringify(supabaseUrl)},
    storageUrl: ${JSON.stringify(supabaseStorageUrl)},
    anonKey: ${JSON.stringify(supabaseAnonKey)},
    bucket: ${JSON.stringify(supabaseBucket)},
    productImagesPath: ${JSON.stringify(supabaseProductImagesPath)}
  }
} as const;
`;

const outputPath = resolve(
  mode === 'development'
    ? 'src/environments/environment.development.ts'
    : 'src/environments/environment.production.ts'
);

await writeFile(outputPath, content, 'utf8');

process.stdout.write(`${mode} environment generated at ${outputPath}\n`);

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