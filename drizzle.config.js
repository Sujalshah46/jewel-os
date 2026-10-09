import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.js',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL || 'postgresql://invalid:invalid@127.0.0.1/invalid' },
});
