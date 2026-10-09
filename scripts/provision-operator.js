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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tenant = await client.query('INSERT INTO tenant (name) VALUES ($1) RETURNING id', [process.env.TENANT_NAME]);
    await client.query('INSERT INTO membership (user_id, tenant_id, role) VALUES ($1, $2, $3)', [user.user.id, tenant.rows[0].id, 'OWNER']);
    await client.query('INSERT INTO tenant_branch (tenant_id, name) VALUES ($1, $2)', [tenant.rows[0].id, 'Main']);
    await client.query('COMMIT');
    console.log(`Provisioned operator ${process.env.OPERATOR_EMAIL} for tenant ${tenant.rows[0].id}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
