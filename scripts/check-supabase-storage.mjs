#!/usr/bin/env node
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

async function parseEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content
      .split(/\r?\n/)
      .reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return acc;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return acc;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
          val = val.slice(1, -1);
        }
        acc[key] = val;
        return acc;
      }, {});
  } catch (err) {
    return {};
  }
}

function projectUrlFromStorageUrl(storageUrl) {
  try {
    const u = new URL(storageUrl);
    const projectRef = u.hostname.split('.storage.supabase.co')[0];
    return projectRef ? `https://${projectRef}.supabase.co` : null;
  } catch (err) {
    return null;
  }
}

async function main() {
  const env = await parseEnv('.env.production');

  const serviceRoleKey = env.NG_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.NG_APP_SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = env.NG_APP_SUPABASE_ANON_KEY || process.env.NG_APP_SUPABASE_ANON_KEY || '';
  const usedKey = serviceRoleKey || anonKey;
  const storageUrl = env.NG_APP_SUPABASE_STORAGE_URL || process.env.NG_APP_SUPABASE_STORAGE_URL || '';
  const bucket = env.NG_APP_SUPABASE_BUCKET || process.env.NG_APP_SUPABASE_BUCKET || 'productos';
  const productPath = env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH || process.env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH || 'productos';

  if (!usedKey) {
    console.error('ERROR: No se encontró NG_APP_SUPABASE_ANON_KEY ni NG_APP_SUPABASE_SERVICE_ROLE_KEY en .env.production ni en variables de entorno.');
    process.exit(2);
  }

  const projectUrl = projectUrlFromStorageUrl(storageUrl);
  if (!projectUrl) {
    console.error('ERROR: No se pudo resolver la URL del proyecto desde storageUrl:', storageUrl);
    process.exit(2);
  }

  console.log('Usando project URL:', projectUrl);
  console.log('Usando bucket:', bucket, ' path:', productPath);
  if (serviceRoleKey) {
    console.log('Usando Service Role Key (privilegiada) desde variable de entorno. NO exponer esta clave.');
  } else {
    console.log('Usando ANON key (cliente).');
  }

  const supabase = createClient(projectUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Petición manual al endpoint de Storage para mostrar request/response completos
  try {
    const listUrl = `${projectUrl}/storage/v1/object/list/${bucket}`;
    const reqBody = { prefix: productPath, limit: 100 };

    const manualHeaders = {
      'Content-Type': 'application/json',
      apikey: usedKey,
      Authorization: `Bearer ${usedKey}`
    };

    console.log('\n--- PETICIÓN MANUAL (raw) ---');
    console.log('URL:', listUrl);
    console.log('Method: POST');
    console.log('Headers:', manualHeaders);
    console.log('Body:', JSON.stringify(reqBody));

    const manualResp = await fetch(listUrl, {
      method: 'POST',
      headers: manualHeaders,
      body: JSON.stringify(reqBody)
    });

    console.log('\n--- RESPUESTA MANUAL (raw) ---');
    console.log('Status:', manualResp.status, manualResp.statusText);
    console.log('Response headers:');
    manualResp.headers.forEach((v, k) => console.log(k + ':', v));

    const manualText = await manualResp.text();
    try {
      const json = JSON.parse(manualText);
      console.log('Response body (json):', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response body (text):', manualText);
    }

    console.log('\n--- PETICIÓN VÍA SDK (supabase-js) ---');
    const { data, error } = await supabase.storage.from(bucket).list(productPath, { limit: 100 });

    if (error) {
      console.error('Error al listar objetos con SDK:', error);
      process.exit(3);
    }

    if (!data || data.length === 0) {
      console.log('Conexión OK (SDK), pero no se encontraron archivos en la ruta especificada.');
    } else {
      console.log('Conexión OK (SDK). Archivos encontrados:');
      for (const item of data) {
        console.log('-', item.name, item.type, item.size ?? '');
      }
    }
  } catch (err) {
    console.error('Excepción durante petición manual o SDK:', err);
    process.exit(4);
  }
}

main();
