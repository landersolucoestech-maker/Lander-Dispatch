import './src/loadEnv';

import { defineConfig } from 'drizzle-kit';
import path from 'node:path';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set in the environment or repository .env.local file.',
  );
}

export default defineConfig({
  schema: path.join(__dirname, './src/schema/index.ts'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
