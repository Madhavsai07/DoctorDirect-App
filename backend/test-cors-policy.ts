import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import config from './src/config/env';
import { createCorsMiddleware } from './src/middleware/cors.middleware';

async function run(): Promise<void> {
  assert.ok(config.corsOrigins.includes('https://doctor-direct-app-ten.vercel.app'));
  const app = express();
  app.use(createCorsMiddleware(config.corsOrigins));
  app.use((_req, res) => res.status(404).send('test route'));

  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const allowed = await fetch(`${baseUrl}/test`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.match(allowed.headers.get('access-control-allow-headers') ?? '', /authorization/i);
    assert.match(allowed.headers.get('access-control-allow-headers') ?? '', /content-type/i);
    assert.equal(allowed.headers.get('access-control-allow-credentials'), null);
    console.log('PASS: configured localhost origin receives required non-credentialed CORS headers.');

    const vercelAllowed = await fetch(`${baseUrl}/test`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://doctor-direct-app-ten.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    assert.equal(vercelAllowed.status, 204);
    assert.equal(vercelAllowed.headers.get('access-control-allow-origin'), 'https://doctor-direct-app-ten.vercel.app');
    console.log('PASS: production Vercel origin receives required CORS headers.');

    const rejected = await fetch(`${baseUrl}/test`, {
      headers: { Origin: 'https://unapproved.example' },
    });
    assert.equal(rejected.status, 403);
    assert.equal(rejected.headers.get('access-control-allow-origin'), null);
    console.log('PASS: unapproved browser origin is rejected.');

    const native = await fetch(`${baseUrl}/test`);
    assert.equal(native.status, 404);
    console.log('PASS: originless native-style request passes the CORS gate.');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

run().catch((error: unknown) => {
  console.error('CORS policy tests failed:', error);
  process.exitCode = 1;
});
