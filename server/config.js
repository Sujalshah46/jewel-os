import { z } from 'zod';
import { isIP } from 'node:net';

const proxyAllowlist = z.string().default('').transform(value => value.trim() ? value.split(',').map(part => part.trim()) : [])
  .refine(values => values.length <= 32 && values.every(value => {
    const [address, prefix, extra] = value.split('/');
    const version = isIP(address);
    return version && extra === undefined && (prefix === undefined || (/^\d{1,3}$/.test(prefix) && Number(prefix) >= 1 && Number(prefix) <= (version === 4 ? 32 : 128)));
  }), { message: 'TRUST_PROXY must be explicit IP addresses or CIDRs; blanket trust and hop counts are forbidden.' });

const operationalSchema = z.object({
  APP_MODE: z.literal('operational'),
  DATABASE_URL: z.string().url().startsWith('postgres'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  APP_ORIGIN: z.string().url(),
  TRUST_PROXY: proxyAllowlist,
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
    TRUST_PROXY: env.TRUST_PROXY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map(issue => issue.path.join('.')).join(', ');
    throw new Error(`Operational mode configuration is invalid (${missing}); refusing to start.`);
  }
  const config = parsed.data;
  if (/replace|changeme|example/i.test(config.BETTER_AUTH_SECRET) || new Set(config.BETTER_AUTH_SECRET).size < 8) {
    throw new Error('Operational session secret is a placeholder or too repetitive; refusing to start.');
  }
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
    trustProxy: config.TRUST_PROXY.length ? config.TRUST_PROXY : false,
    secureCookies: appOrigin.protocol === 'https:',
  };
}
