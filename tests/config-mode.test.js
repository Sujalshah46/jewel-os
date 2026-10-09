import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { loadOperationalConfig } from '../server/config.js';

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
  assert.match(operational, /Billing, stock, accounting, rates, integrations, and administration remain unavailable/);
  const server = await readFile(new URL('../server/app.js', import.meta.url), 'utf8');
  assert.match(server, /FEATURE_UNAVAILABLE/);
});

test('demo credential entry controls are absent', async () => {
  const integrations = await readFile(new URL('../src/components/admin/AdminIntegrationsTab.jsx', import.meta.url), 'utf8');
  const firms = await readFile(new URL('../src/components/modules/FirmMasterModule.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(integrations, /apiKeyMasked|API KEY \(STORED SAFELY/);
  assert.doesNotMatch(firms, /E-INVOICE API KEY|eInvoiceApi\?\.apiKey/);
});
