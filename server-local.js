// server-local.js - Servidor de desarrollo local compatible con Vercel Functions
// Permite probar todo el proyecto en local sin necesidad de instalar la CLI de Vercel
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
require('dotenv').config();

const initiativesHandler = require('./api/initiatives');
const collaborationsHandler = require('./api/collaborations');
const setupHandler = require('./api/setup');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Adaptador para emular res.status(...).json(...) de Express/Vercel
  res.status = function (statusCode) {
    this.statusCode = statusCode;
    return this;
  };
  res.json = function (data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
  };

  // Parsear body JSON para peticiones POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    await new Promise(resolve => req.on('end', resolve));
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch (e) {
      req.body = body;
    }
  }

  req.query = parsedUrl.query;

  // Rutas de API Serverless
  if (pathname === '/api/initiatives') {
    return initiativesHandler(req, res);
  }
  if (pathname === '/api/collaborations') {
    return collaborationsHandler(req, res);
  }
  if (pathname === '/api/setup') {
    return setupHandler(req, res);
  }

  // Servir archivos estáticos de public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<h1>404 No encontrado</h1><p><a href="/">Volver al inicio</a></p>');
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor de Puente Digital iniciado`);
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log(`🗄️  Base de datos: ${process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'Configurada' : 'Falta configurar .env'}`);
  console.log(`======================================================\n`);
});
