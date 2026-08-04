import http from 'node:http';
import process from 'node:process';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:5000';
const apiUrl = new URL(apiBaseUrl);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(response, label) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${label} returned invalid JSON: ${body}`);
  }
}

function requestStatus({ hostHeader, forwardedFor }) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        path: '/api/auth/user',
        method: 'GET',
        headers: {
          Host: hostHeader,
          ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
        },
      },
      (response) => {
        response.resume();
        response.once('end', () => resolve(response.statusCode));
      },
    );

    request.once('error', reject);
    request.end();
  });
}

const healthResponse = await fetch(`${apiBaseUrl}/api/healthz`);
assert(healthResponse.ok, `Health check failed with ${healthResponse.status}.`);
const health = await readJson(healthResponse, 'Health check');
assert(health.status === 'ok', 'Health check did not return status=ok.');

const sessionResponse = await fetch(`${apiBaseUrl}/api/auth/user`);
assert(sessionResponse.ok, `Session check failed with ${sessionResponse.status}.`);
const session = await readJson(sessionResponse, 'Session check');
assert(
  session.user?.id === 'local-development-user',
  'Loopback development session did not return the synthetic local user.',
);
assert(
  session.user?.email === 'auth-disabled@localhost',
  'Loopback development session returned an unexpected email.',
);

const invalidHostStatus = await requestStatus({
  hostHeader: 'example.com',
});
assert(
  invalidHostStatus === 403,
  `Non-loopback Host was not rejected. Received ${invalidHostStatus}.`,
);

const forwardedStatus = await requestStatus({
  hostHeader: `127.0.0.1:${apiUrl.port}`,
  forwardedFor: '203.0.113.10',
});
assert(
  forwardedStatus === 403,
  `Forwarded request was not rejected. Received ${forwardedStatus}.`,
);

const payload = Buffer.from(`lander-dispatch-smoke-${Date.now()}\n`, 'utf8');
const uploadTargetResponse = await fetch(
  `${apiBaseUrl}/api/storage/uploads/request-url`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'runtime-smoke.txt',
      size: payload.length,
      contentType: 'text/plain',
    }),
  },
);
assert(
  uploadTargetResponse.ok,
  `Upload target request failed with ${uploadTargetResponse.status}.`,
);
const uploadTarget = await readJson(
  uploadTargetResponse,
  'Upload target request',
);
assert(
  typeof uploadTarget.uploadURL === 'string' &&
    uploadTarget.uploadURL.startsWith('http'),
  'Upload target did not contain a valid signed URL.',
);
assert(
  typeof uploadTarget.objectPath === 'string' &&
    uploadTarget.objectPath.startsWith('/objects/'),
  'Upload target did not contain a valid object path.',
);

const uploadResponse = await fetch(uploadTarget.uploadURL, {
  method: 'PUT',
  headers: { 'content-type': 'text/plain' },
  body: payload,
});
assert(uploadResponse.ok, `Signed upload failed with ${uploadResponse.status}.`);

const downloadResponse = await fetch(
  `${apiBaseUrl}/api/storage${uploadTarget.objectPath}`,
);
assert(
  downloadResponse.ok,
  `Private object download failed with ${downloadResponse.status}.`,
);
const downloadedPayload = Buffer.from(await downloadResponse.arrayBuffer());
assert(
  downloadedPayload.equals(payload),
  'Downloaded private object does not match the uploaded payload.',
);
assert(
  downloadResponse.headers.get('cache-control') === 'private, no-store',
  'Private object response has an unsafe cache policy.',
);

console.log('Runtime smoke test passed.');
