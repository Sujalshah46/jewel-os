import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';

test('unimplemented operational workflows return an explicit unavailable response', async () => {
  const app = createApp({
    auth: { handler: async () => new Response(null, { status: 404 }) },
    pool: {},
    config: { appOrigin: 'http://127.0.0.1', authSecret: 'unit-test-secret' },
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const { port } = server.address();
    for (const path of ['/api/returns', '/api/purchases', '/api/transfers', '/api/repayments', '/api/schemes', '/api/integrations']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      assert.equal(response.status, 404, `${path} must stay disabled`);
      assert.equal((await response.json()).error.code, 'FEATURE_UNAVAILABLE');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
