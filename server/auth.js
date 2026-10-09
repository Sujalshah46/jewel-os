import { createHmac } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';

export function createAuth(pool, config, { allowSignUp = false } = {}) {
  const db = drizzle(pool, { schema });
  return betterAuth({
    appName: 'Jewellery OS',
    baseURL: config.authUrl,
    basePath: '/api/auth',
    secret: config.authSecret,
    trustedOrigins: [config.appOrigin],
    rateLimit: {
      enabled: true, window: 60, max: 120,
      customRules: { '/sign-in/email': { window: 60, max: 10 } },
      customStorage: {
        async consume(key, rule) {
          const digest = createHmac('sha256', config.authSecret).update(key).digest('hex');
          const result = await pool.query(`
            INSERT INTO auth_rate_limit (key, window_start, attempts) VALUES ($1, clock_timestamp(), 1)
            ON CONFLICT (key) DO UPDATE SET
              attempts = CASE WHEN auth_rate_limit.window_start <= clock_timestamp() - ($2 * interval '1 second') THEN 1
                ELSE LEAST(auth_rate_limit.attempts + 1, $3 + 1) END,
              window_start = CASE WHEN auth_rate_limit.window_start <= clock_timestamp() - ($2 * interval '1 second')
                THEN clock_timestamp() ELSE auth_rate_limit.window_start END
            RETURNING attempts, GREATEST(1, CEIL(EXTRACT(EPOCH FROM window_start + ($2 * interval '1 second') - clock_timestamp())))::int AS retry_after`,
          [digest, rule.window, rule.max]);
          const row = result.rows[0];
          return { allowed: row.attempts <= rule.max, retryAfter: row.attempts <= rule.max ? null : row.retry_after };
        },
      },
    },
    database: drizzleAdapter(db, { provider: 'pg', schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    } }),
    user: { additionalFields: { disabled: { type: 'boolean', defaultValue: false, input: false } } },
    databaseHooks: { session: { create: { async before(session) {
      const result = await pool.query('SELECT disabled FROM "user" WHERE id=$1', [session.userId]);
      return result.rows[0]?.disabled === false;
    } } } },
    emailAndPassword: { enabled: true, disableSignUp: !allowSignUp },
    advanced: {
      ipAddress: { ipAddressHeaders: ['x-jewel-client-ip'] },
      useSecureCookies: config.secureCookies,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.secureCookies, path: '/' },
    },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 15, cookieCache: { enabled: false } },
  });
}
