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
    database: drizzleAdapter(db, { provider: 'pg', schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    } }),
    emailAndPassword: { enabled: true, disableSignUp: !allowSignUp },
    advanced: {
      useSecureCookies: config.secureCookies,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.secureCookies, path: '/' },
    },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 15, cookieCache: { enabled: false } },
  });
}
