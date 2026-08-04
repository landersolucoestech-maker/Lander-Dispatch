import '@workspace/db/env';

import app from './app';
import { isLocalAuthBypassEnabled } from './lib/auth';
import { logger } from './lib/logger';

const rawPort = process.env.PORT;
const host = process.env.HOST ?? '127.0.0.1';

if (!rawPort) {
  throw new Error('PORT environment variable is required but was not provided.');
}

const port = Number(rawPort);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1']);
if (isLocalAuthBypassEnabled() && !loopbackHosts.has(host)) {
  throw new Error(
    'AUTH_DISABLED=true is permitted only when HOST is a loopback address.',
  );
}

const server = app.listen(port, host, () => {
  logger.info({ host, port }, 'Server listening');
});

server.on('error', (error) => {
  logger.error({ err: error }, 'Error listening on server socket');
  process.exit(1);
});
