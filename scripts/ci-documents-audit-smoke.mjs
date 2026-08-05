import process from 'node:process';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:5000';
const browserOrigin = 'http://127.0.0.1:3000';

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

async function waitForAudit(action, entityId) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const response = await fetch(
      `${apiBaseUrl}/api/audit-logs?action=${encodeURIComponent(action)}&entityId=${encodeURIComponent(entityId)}`,
    );
    assert(response.ok, `Audit query failed with ${response.status}.`);
    const body = await readJson(response, 'Audit query');
    if (body.data?.some((entry) => entry.action === action && entry.entityId === entityId)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Audit event ${action} for ${entityId} was not recorded.`);
}

const filename = `documents-smoke-${Date.now()}.txt`;
const payload = Buffer.from(`lander-dispatch-documents-${Date.now()}\n`, 'utf8');

const targetResponse = await fetch(`${apiBaseUrl}/api/storage/uploads/request-url`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: filename,
    size: payload.length,
    contentType: 'text/plain',
  }),
});
assert(targetResponse.ok, `Document upload target failed with ${targetResponse.status}.`);
const target = await readJson(targetResponse, 'Document upload target');

const preflightResponse = await fetch(target.uploadURL, {
  method: 'OPTIONS',
  headers: {
    Origin: browserOrigin,
    'Access-Control-Request-Method': 'PUT',
    'Access-Control-Request-Headers': 'content-type',
  },
});
assert(
  preflightResponse.ok,
  `MinIO browser upload preflight failed with ${preflightResponse.status}.`,
);
assert(
  preflightResponse.headers.get('access-control-allow-origin') === browserOrigin,
  `MinIO preflight did not allow ${browserOrigin}.`,
);
assert(
  (preflightResponse.headers.get('access-control-allow-methods') ?? '')
    .toUpperCase()
    .includes('PUT'),
  'MinIO preflight did not allow PUT.',
);

const uploadResponse = await fetch(target.uploadURL, {
  method: 'PUT',
  headers: {
    Origin: browserOrigin,
    'content-type': 'text/plain',
  },
  body: payload,
});
assert(uploadResponse.ok, `Document object upload failed with ${uploadResponse.status}.`);
assert(
  uploadResponse.headers.get('access-control-allow-origin') === browserOrigin,
  'MinIO upload response did not include the allowed browser origin.',
);

const createResponse = await fetch(`${apiBaseUrl}/api/documents`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: filename,
    category: 'Other',
    entityType: 'load',
    entityId: 'ci-runtime-load',
    objectPath: target.objectPath,
    contentType: 'text/plain',
    size: payload.length,
    notes: 'CI documents and audit validation',
  }),
});
assert(createResponse.status === 201, `Document creation failed with ${createResponse.status}.`);
const document = await readJson(createResponse, 'Document creation');
assert(typeof document.id === 'string', 'Document creation did not return an ID.');
assert(document.objectPath === target.objectPath, 'Document metadata stored the wrong object path.');
assert(document.downloadUrl === `/api/storage${target.objectPath}`, 'Document download URL is invalid.');

const listResponse = await fetch(
  `${apiBaseUrl}/api/documents?search=${encodeURIComponent(filename)}`,
);
assert(listResponse.ok, `Document listing failed with ${listResponse.status}.`);
const list = await readJson(listResponse, 'Document listing');
assert(
  list.data?.some((entry) => entry.id === document.id),
  'Created document was not returned by document search.',
);

const downloadResponse = await fetch(`${apiBaseUrl}${document.downloadUrl}`);
assert(downloadResponse.ok, `Document download failed with ${downloadResponse.status}.`);
const downloadedPayload = Buffer.from(await downloadResponse.arrayBuffer());
assert(downloadedPayload.equals(payload), 'Document download payload does not match upload.');

await waitForAudit('document.created', document.id);

const deleteResponse = await fetch(`${apiBaseUrl}/api/documents/${document.id}`, {
  method: 'DELETE',
});
assert(deleteResponse.status === 204, `Document deletion failed with ${deleteResponse.status}.`);

const deletedDownloadResponse = await fetch(`${apiBaseUrl}${document.downloadUrl}`);
assert(
  deletedDownloadResponse.status === 404,
  `Deleted object remained downloadable with status ${deletedDownloadResponse.status}.`,
);

await waitForAudit('document.deleted', document.id);

const deletedListResponse = await fetch(
  `${apiBaseUrl}/api/documents?search=${encodeURIComponent(filename)}`,
);
assert(deletedListResponse.ok, `Post-delete listing failed with ${deletedListResponse.status}.`);
const deletedList = await readJson(deletedListResponse, 'Post-delete listing');
assert(
  !deletedList.data?.some((entry) => entry.id === document.id),
  'Deleted document metadata remained in the database.',
);

console.log('Documents and audit smoke test passed.');