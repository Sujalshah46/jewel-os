import pg from 'pg';
import { loadOperationalConfig } from './config.js';
import { createApp } from './app.js';
import { createAuth } from './auth.js';

const config = loadOperationalConfig();
const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30_000 });
await pool.query('SELECT 1');
await pool.query('SELECT 1 FROM tenant, membership, customer LIMIT 0');
const auth = createAuth(pool, config, { allowSignUp: false });

const app = createApp({ auth, pool, config });
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[operational-api] listening on port ${config.port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
