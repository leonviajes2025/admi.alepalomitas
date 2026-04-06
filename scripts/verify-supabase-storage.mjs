import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

const env = await loadEnvFile(resolve('.env.local'));

const requiredKeys = [
  'NG_APP_SUPABASE_URL',
  'NG_APP_SUPABASE_ANON_KEY',
  'NG_APP_SUPABASE_BUCKET',
  'NG_APP_SUPABASE_PRODUCT_IMAGES_PATH'
];

for (const key of requiredKeys) {
  if (!env[key]) {
    throw new Error(`Falta la variable ${key} en .env.local`);
  }
}

const client = createClient(env.NG_APP_SUPABASE_URL, env.NG_APP_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const objectPath = `${trimSlashes(env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH)}/probe-${Date.now()}.txt`;
const tempFilePath = resolve('.supabase-storage-probe.txt');

await writeFile(tempFilePath, 'ok', 'utf8');

try {
  const fileBuffer = await readFile(tempFilePath);
  const upload = await client.storage.from(env.NG_APP_SUPABASE_BUCKET).upload(objectPath, fileBuffer, {
    contentType: 'text/plain',
    upsert: false
  });

  if (upload.error) {
    throw upload.error;
  }

  const publicUrl = client.storage.from(env.NG_APP_SUPABASE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
  const response = await fetch(publicUrl);

  console.log(
    JSON.stringify(
      {
        bucket: env.NG_APP_SUPABASE_BUCKET,
        objectPath,
        publicUrl,
        publicReadable: response.ok,
        status: response.status
      },
      null,
      2
    )
  );

  const removal = await client.storage.from(env.NG_APP_SUPABASE_BUCKET).remove([objectPath]);

  if (removal.error) {
    throw removal.error;
  }
} finally {
  if (existsSync(tempFilePath)) {
    await import('node:fs/promises').then(({ unlink }) => unlink(tempFilePath));
  }
}

function trimSlashes(value) {
  return value.replace(/^\/+|\/+$/g, '');
}

async function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`No existe ${filePath}`);
  }

  const content = await readFile(filePath, 'utf8');

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

      result[trimmedLine.slice(0, separatorIndex).trim()] = trimmedLine
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['\"]|['\"]$/g, '');

      return result;
    }, {});
}