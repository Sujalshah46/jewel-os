import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { loadOperationalConfig } from '../server/config.js';
import { createApp } from '../server/app.js';

const valid = {
  APP_MODE: 'operational',
  DATABASE_URL: 'postgresql://user:pass@127.0.0.1/app',
  BETTER_AUTH_SECRET: 'sufficiently-long-test-secret-value',
  BETTER_AUTH_URL: 'http://127.0.0.1:4000',
  APP_ORIGIN: 'http://127.0.0.1:4000',
};

test('operational startup fails closed if database or session secret is missing', () => {
  assert.throws(() => loadOperationalConfig({ ...valid, DATABASE_URL: '' }), /refusing to start/);
  assert.throws(() => loadOperationalConfig({ ...valid, BETTER_AUTH_SECRET: '' }), /refusing to start/);
  assert.throws(() => loadOperationalConfig({ ...valid, APP_MODE: 'demo' }), /refusing to start/);
  assert.throws(() => loadOperationalConfig({ ...valid, APP_ORIGIN: 'https://app.example', BETTER_AUTH_URL: 'http://api.example' }), /share an origin/);
  assert.throws(() => loadOperationalConfig({ ...valid, NODE_ENV: 'production' }), /requires an HTTPS/);
  assert.throws(() => loadOperationalConfig({ ...valid, BETTER_AUTH_SECRET: 'replace-with-at-least-32-random-bytes' }), /refusing to start/);
  assert.equal(loadOperationalConfig(valid).trustProxy, false);
  assert.deepEqual(loadOperationalConfig({ ...valid, TRUST_PROXY: '127.0.0.1/32,::1/128' }).trustProxy, ['127.0.0.1/32','::1/128']);
  for (const unsafe of ['true', '*', '1', '0.0.0.0/0', 'proxy.example.test', '127.0.0.1/33', '::1/129', '127.0.0.1,']) {
    assert.throws(() => loadOperationalConfig({ ...valid, TRUST_PROXY: unsafe }), /refusing to start/);
  }
  assert.equal(loadOperationalConfig({ ...valid, APP_ORIGIN: `${valid.APP_ORIGIN}/` }).appOrigin, valid.APP_ORIGIN);
  const startup = spawnSync(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { PATH: process.env.PATH, APP_MODE: 'operational' },
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.notEqual(startup.status, 0);
  assert.match(startup.stderr, /refusing to start/);
});

test('operational entrypoint does not statically import demo seeds or local ERP provider', async () => {
  const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
  const operational = await readFile(new URL('../src/OperationalApp.jsx', import.meta.url), 'utf8');
  assert.match(main, /import\('\.\/OperationalApp\.jsx'\)/);
  assert.doesNotMatch(main, /import App from ['"]\.\/App\.jsx/);
  assert.doesNotMatch(operational, /JewelleryContext|initialData|localStorage/);
  assert.match(operational, /Billing, stock, transfers, purchases, returns, accounting/);
  const server = await readFile(new URL('../server/app.js', import.meta.url), 'utf8');
  assert.match(server, /FEATURE_UNAVAILABLE/);
});

test('demo credential entry controls are absent', async () => {
  const integrations = await readFile(new URL('../src/components/admin/AdminIntegrationsTab.jsx', import.meta.url), 'utf8');
  const firms = await readFile(new URL('../src/components/modules/FirmMasterModule.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(integrations, /onChange[^\n]*apiKeyMasked|API KEY \(STORED SAFELY/);
  assert.doesNotMatch(firms, /onChange[^\n]*handleEInvoiceChange/);
});


test('auth IP honors only explicitly trusted proxy hops and overwrites caller identity', async () => {
  for (const trusted of [false, true]) {
    const config = loadOperationalConfig({ ...valid, ...(trusted ? { TRUST_PROXY: '127.0.0.1/32' } : {}) });
    const app = createApp({ auth: { handler: async req => Response.json({ ip: req.headers.get('x-jewel-client-ip') }) }, pool: {}, config });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const url = `http://127.0.0.1:${server.address().port}/api/auth/probe`;
      const headers = { 'X-Forwarded-For': '203.0.113.10, 198.51.100.20', 'X-Jewel-Client-Ip': '192.0.2.99' };
      assert.equal((await (await fetch(url, { headers })).json()).ip, trusted ? '198.51.100.20' : '127.0.0.1');
      const second = await fetch(url, { headers: { ...headers, 'X-Forwarded-For': '203.0.113.30' } });
      assert.equal((await second.json()).ip, trusted ? '203.0.113.30' : '127.0.0.1');
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
});
