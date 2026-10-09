import pg from 'pg';
import { loadOperationalConfig } from '../server/config.js';
import { createAuth } from '../server/auth.js';

const config = loadOperationalConfig();
const required = ['OPERATOR_EMAIL', 'OPERATOR_NAME', 'OPERATOR_PASSWORD', 'TENANT_NAME'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Missing provisioning inputs: ${missing.join(', ')}`);
if (process.env.OPERATOR_PASSWORD.length < 12) throw new Error('OPERATOR_PASSWORD must be at least 12 characters.');

const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 2 });
try {
  const auth = createAuth(pool, config, { allowSignUp: true });
  const user = await auth.api.signUpEmail({ body: {
    name: process.env.OPERATOR_NAME,
    email: process.env.OPERATOR_EMAIL,
    password: process.env.OPERATOR_PASSWORD,
  } });
  let client;
  let committed = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const tenant = await client.query('INSERT INTO tenant (name) VALUES ($1) RETURNING id', [process.env.TENANT_NAME]);
    await client.query('INSERT INTO membership (user_id, tenant_id, role) VALUES ($1, $2, $3)', [user.user.id, tenant.rows[0].id, 'OWNER']);
    await client.query('INSERT INTO tenant_branch (tenant_id, name) VALUES ($1, $2)', [tenant.rows[0].id, 'Main']);
    await client.query('COMMIT');
    committed = true;
    console.log('Provisioned operator and tenant.');
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); }
      catch { client.release(true); client = null; }
    }
    // Free the transaction connection before independent best-effort cleanup.
    if (client) { client.release(); client = null; }
    // Only delete this newly-created identity when no committed membership exists.
    // Preserve the original error even if the database is unavailable for cleanup.
    if (!committed) {
      try {
        await pool.query(
          'DELETE FROM "user" WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM membership WHERE user_id = $1)',
          [user.user.id],
        );
      } catch { console.error('Provisioning cleanup failed; inspect unassigned identities before retrying.'); }
    }
    throw error;
  } finally {
    client?.release();
  }
} finally {
  await pool.end();
}
