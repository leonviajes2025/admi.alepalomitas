const {
  assertConfig,
  createServerSupabaseClient,
  extractObjectPathFromPublicUrl,
  readJsonBody,
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
    const body = await readJsonBody(req);
    const publicUrl = typeof body.publicUrl === 'string' ? body.publicUrl : '';

    if (!publicUrl) {
      sendJson(res, 400, { error: 'Falta la URL publica de la imagen.' });
      return;
    }

    const objectPath = extractObjectPathFromPublicUrl(publicUrl);

    if (!objectPath) {
      sendJson(res, 404, { error: 'No se pudo resolver la imagen a eliminar.' });
      return;
    }

    const client = createServerSupabaseClient();
    const { error } = await client.storage.from(bucket).remove([objectPath]);

    if (error) {
      sendJson(res, 500, { error: error.message || 'No fue posible eliminar la imagen.' });
      return;
    }

    sendJson(res, 200, { deleted: true });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message || 'No fue posible eliminar la imagen.' });
  }
};