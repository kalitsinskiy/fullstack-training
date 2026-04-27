// ============================================
// BASIC HTTP SERVER Example
// ============================================
// Run this file with: npx ts-node src/04-backend/lessons/01-nodejs-and-npm/examples/http-server.ts

import * as http from 'node:http';

const PORT = 3000;

// http.createServer takes a request handler callback
// The callback receives IncomingMessage (req) and ServerResponse (res)
const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const { method, url } = req;
  console.log(`${method} ${url}`);

  // Set response headers
  res.setHeader('Content-Type', 'application/json');

  // Simple routing
  if (method === 'GET' && url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Hello from Node.js HTTP server!' }));
    return;
  }

  if (method === 'GET' && url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (method === 'GET' && url === '/info') {
    res.writeHead(200);
    res.end(JSON.stringify({
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
    }));
    return;
  }

  // 404 for anything else
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Try:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/health`);
  console.log(`  curl http://localhost:${PORT}/info`);
  console.log('\nPress Ctrl+C to stop');
});
