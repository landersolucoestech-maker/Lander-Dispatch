import process from 'node:process';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:5000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const healthResponse = await fetch(`${apiBaseUrl}/api/healthz`);
assert(healthResponse.ok, `Health check failed with ${healthResponse.status}.`);

const sessionResponse = await fetch(`${apiBaseUrl}/api/auth/user`);
assert(sessionResponse.ok, `Session endpoint failed with ${sessionResponse.status}.`);
const session = await sessionResponse.json();
assert(session.user === null, 'Unauthenticated session unexpectedly returned a user.');

const dashboardResponse = await fetch(`${apiBaseUrl}/api/dashboard/kpis`);
assert(
  dashboardResponse.status === 401,
  `Dashboard did not require authentication. Received ${dashboardResponse.status}.`,
);

const storageResponse = await fetch(
  `${apiBaseUrl}/api/storage/uploads/request-url`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'unauthorized.txt',
      size: 12,
      contentType: 'text/plain',
    }),
  },
);
assert(
  storageResponse.status === 401,
  `Storage upload did not require authentication. Received ${storageResponse.status}.`,
);

console.log('Authentication-required smoke test passed.');
