import fs from 'fs';
import path from 'path';

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3000';
const filePath = path.resolve(process.cwd(), 'test.png');

async function upload() {
  const fileStat = fs.statSync(filePath);
  const fileStream = fs.readFileSync(filePath);
  const url = `${API_BASE}/api/storage/upload`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      'x-file-name': 'test.png',
      'Content-Length': String(fileStat.size)
    },
    body: fileStream
  });

  const json = await resp.json();
  console.log('upload:', resp.status, json);
  return json;
}

async function remove(publicUrl) {
  const url = `${API_BASE}/api/storage/delete`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicUrl })
  });

  const json = await resp.json();
  console.log('delete:', resp.status, json);
  return json;
}

(async function run() {
  try {
    const up = await upload();
    if (up && up.publicUrl) {
      await remove(up.publicUrl);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
