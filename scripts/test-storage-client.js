import fs from 'fs';
import path from 'path';

// Este script emula las llamadas que hace `SupabaseStorageService` del cliente.
// Por defecto intentará enviar las peticiones a http://127.0.0.1:4200 (frontend dev)
// Si tu frontend no reescribe /storage-api/* localmente, define API_BASE
// a 'http://127.0.0.1:3000/api' para apuntar directamente al dev API server.

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:4200';
const filePath = path.resolve(process.cwd(), 'test.png');

// If test.png doesn't exist, create a 1x1 transparent PNG from base64 so tests can run immediately.
if (!fs.existsSync(filePath)) {
  const onePxPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
  fs.writeFileSync(filePath, Buffer.from(onePxPngBase64, 'base64'));
  console.log('Created test.png (1x1 PNG)');
}

async function upload() {
  if (!fs.existsSync(filePath)) {
    console.error('Faltó test.png en la raíz del repo. Crea o añade un archivo test.png.');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const url = `${API_BASE.replace(/\/$/, '')}/storage-api/upload`;

  console.log('POST', url);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'image/png',
      'x-file-name': encodeURIComponent('test.png')
    },
    body: fileBuffer
  });

  const text = await resp.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  console.log('upload ->', resp.status, json);
  return { status: resp.status, payload: json };
}

async function remove(publicUrl) {
  const url = `${API_BASE.replace(/\/$/, '')}/storage-api/delete`;
  console.log('POST', url, 'body:', { publicUrl });
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ publicUrl })
  });

  const json = await resp.json().catch(() => ({ raw: null }));
  console.log('delete ->', resp.status, json);
  return { status: resp.status, payload: json };
}

(async function run() {
  try {
    const up = await upload();
    const publicUrl = up.payload?.publicUrl;
    if (!publicUrl) {
      console.error('Upload no devolvió publicUrl. Revisa la respuesta anterior.');
      process.exit(1);
    }

    // Opcional: validar disponibilidad
    console.log('Validando disponibilidad:', publicUrl);
    const head = await fetch(publicUrl, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
    if (head?.ok) {
      console.log('HEAD ok');
    } else {
      const get = await fetch(publicUrl, { method: 'GET', cache: 'no-store' }).catch(() => null);
      console.log('GET ->', get?.status || 'error');
    }

    // Borrar
    await remove(publicUrl);
  } catch (err) {
    console.error('Error durante la prueba:', err);
    process.exit(1);
  }
})();
