import pg from 'pg';
import { assertOperationalSchema } from './readiness.js';
import { loadOperationalConfig } from './config.js';
import { createApp } from './app.js';
import { createAuth } from './auth.js';

const config = loadOperationalConfig();
const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5000, statement_timeout: 15000, idle_in_transaction_session_timeout: 30000 });
await pool.query('SELECT 1');
await assertOperationalSchema(pool);
const auth = createAuth(pool, config, { allowSignUp: false });

const app = createApp({ auth, pool, config });
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[operational-api] listening on port ${config.port}`);
});

async function shutdown() {
  const deadline = setTimeout(() => { server.closeAllConnections(); }, 10000);
  deadline.unref();
  await new Promise(resolve => server.close(resolve));
  clearTimeout(deadline);
  await pool.end();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
