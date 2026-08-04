import { rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const userAgent = process.env.npm_config_user_agent ?? '';

await Promise.all([
  rm(path.join(repositoryRoot, 'package-lock.json'), { force: true }),
  rm(path.join(repositoryRoot, 'yarn.lock'), { force: true }),
]);

if (!userAgent.startsWith('pnpm/')) {
  console.error('Use pnpm to install dependencies in this repository.');
  process.exit(1);
}
