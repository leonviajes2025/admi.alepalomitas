import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NG_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NG_APP_SUPABASE_ANON_KEY;
const bucket = process.env.SUPABASE_BUCKET || process.env.NG_APP_SUPABASE_BUCKET || 'productos';
let folder = (process.env.SUPABASE_PRODUCT_IMAGES_PATH || process.env.NG_APP_SUPABASE_PRODUCT_IMAGES_PATH || 'productos').trim().replace(/^\/+|\/+$/g, '');
if (folder === bucket) folder = '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno.');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const fileBuffer = Buffer.from('hello');
  const fileName = `test-${Date.now()}-${randomUUID()}.txt`;
  const objectPath = [folder, fileName].filter(Boolean).join('/');

  console.log('Uploading to bucket:', bucket);
  console.log('Using objectPath:', objectPath);

  const { error } = await client.storage.from(bucket).upload(objectPath, fileBuffer, { contentType: 'text/plain' });
  if (error) {
    console.error('Upload error:', error.message || error);
    process.exit(2);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  console.log('Public URL:', data.publicUrl);
}

run();
