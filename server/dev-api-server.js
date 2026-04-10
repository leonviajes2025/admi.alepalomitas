const http = require('http');
const { parse } = require('url');
const path = require('path');

const handlers = {
  '/api/storage/upload': require(path.resolve(__dirname, '../api/storage/upload.js')),
  '/api/storage/delete': require(path.resolve(__dirname, '../api/storage/delete.js'))
};

const server = http.createServer((req, res) => {
  try {
    const parsed = parse(req.url);
    const pathname = parsed.pathname;

    const handler = handlers[pathname];

    if (handler) {
      return handler(req, res);
    }

    res.statusCode = 404;
    res.end('Not Found');
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err));
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Dev API server listening on http://localhost:${port}`));
