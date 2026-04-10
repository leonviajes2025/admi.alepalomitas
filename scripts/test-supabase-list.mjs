import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const bucket = 'productos';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listBucket() {
  try {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit: 100 });

    if (error) {
      console.error('Error al listar objetos:', error.message || error);
      process.exit(2);
    }

    if (!data || data.length === 0) {
      console.log(`No se encontraron objetos en el bucket "${bucket}".`);
      return;
    }

    console.log(`Se encontraron ${data.length} objetos en el bucket "${bucket}":`);
    for (const obj of data) {
      console.log(`- ${obj.name} ${obj.updated_at ? ` (updated: ${obj.updated_at})` : ''}`);
    }
  } catch (err) {
    console.error('Excepción inesperada:', err);
    process.exit(3);
  }
}

listBucket();
