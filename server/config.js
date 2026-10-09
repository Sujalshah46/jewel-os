import { z } from 'zod';

const operationalSchema = z.object({
  APP_MODE: z.literal('operational'),
  DATABASE_URL: z.string().url().startsWith('postgres'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  APP_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
}).strict();

export function loadOperationalConfig(env = process.env) {
  const parsed = operationalSchema.safeParse({
    APP_MODE: env.APP_MODE,
    DATABASE_URL: env.DATABASE_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    APP_ORIGIN: env.APP_ORIGIN,
    PORT: env.PORT,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map(issue => issue.path.join('.')).join(', ');
    throw new Error(`Operational mode configuration is invalid (${missing}); refusing to start.`);
  }
  const config = parsed.data;
  const appOrigin = new URL(config.APP_ORIGIN);
  const authUrl = new URL(config.BETTER_AUTH_URL);
  if (authUrl.origin !== appOrigin.origin) {
    throw new Error('BETTER_AUTH_URL and APP_ORIGIN must share an origin for same-site session cookies.');
  }
  if (env.NODE_ENV === 'production' && appOrigin.protocol !== 'https:') {
    throw new Error('Operational production mode requires an HTTPS application origin.');
  }
  return {
    databaseUrl: config.DATABASE_URL,
    authSecret: config.BETTER_AUTH_SECRET,
    authUrl: config.BETTER_AUTH_URL,
    appOrigin: appOrigin.origin,
    port: config.PORT,
    secureCookies: appOrigin.protocol === 'https:',
  };
}
