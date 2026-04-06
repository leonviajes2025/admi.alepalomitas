const {
  assertConfig,
  buildObjectPath,
  createServerSupabaseClient,
  readRequestBuffer,
  sendJson
} = require('./_shared');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    sendJson(res, 405, { error: 'Metodo no permitido.' });
    return;
  }

  try {
    const { bucket } = assertConfig();
    const rawFileName = Array.isArray(req.headers['x-file-name'])
      ? req.headers['x-file-name'][0]
      : req.headers['x-file-name'];
    const contentType = Array.isArray(req.headers['content-type'])
      ? req.headers['content-type'][0]
      : req.headers['content-type'];
    const contentLength = Number.parseInt(String(req.headers['content-length'] || '0'), 10);

    if (!rawFileName) {
      sendJson(res, 400, { error: 'Falta el nombre del archivo.' });
      return;
    }

    if (!contentType || !contentType.startsWith('image/')) {
      sendJson(res, 400, { error: 'Solo se permiten imagenes.' });
      return;
    }

    if (Number.isFinite(contentLength) && contentLength > 5 * 1024 * 1024) {
      sendJson(res, 413, { error: 'La imagen no puede superar los 5 MB.' });
      return;
    }

    const fileBuffer = await readRequestBuffer(req);

    if (fileBuffer.length === 0) {
      sendJson(res, 400, { error: 'El archivo esta vacio.' });
      return;
    }

    const objectPath = buildObjectPath(rawFileName);
    const client = createServerSupabaseClient();
    const { error } = await client.storage.from(bucket).upload(objectPath, fileBuffer, {
      cacheControl: '3600',
      contentType,
      upsert: false
    });

    if (error) {
      sendJson(res, 500, { error: error.message || 'No fue posible subir la imagen.' });
      return;
    }

    const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
    sendJson(res, 200, { publicUrl: data.publicUrl, objectPath });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message || 'No fue posible subir la imagen.' });
  }
};