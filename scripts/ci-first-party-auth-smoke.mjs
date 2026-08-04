import process from 'node:process';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:5000';
const ownerEmail = process.env.OWNER_EMAIL;
const ownerPassword = process.env.OWNER_PASSWORD;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

if (!ownerEmail || !ownerPassword) {
  throw new Error('OWNER_EMAIL and OWNER_PASSWORD are required for the auth smoke test.');
}

const invalidLoginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email: ownerEmail,
    password: `${ownerPassword}-incorrect`,
  }),
});
assert(
  invalidLoginResponse.status === 401,
  `Invalid password was not rejected. Received ${invalidLoginResponse.status}.`,
);

const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
});
assert(loginResponse.ok, `Owner login failed with ${loginResponse.status}.`);

const setCookie = loginResponse.headers.get('set-cookie');
assert(setCookie, 'Owner login did not return a session cookie.');
assert(
  setCookie.toLowerCase().includes('httponly'),
  'Session cookie is not HttpOnly.',
);
assert(
  setCookie.toLowerCase().includes('samesite=lax'),
  'Session cookie does not use SameSite=Lax.',
);

const cookie = setCookie.split(';', 1)[0];
const loginBody = await loginResponse.json();
assert(
  loginBody.user?.email === ownerEmail,
  'Owner login returned an unexpected user.',
);

const sessionResponse = await fetch(`${apiBaseUrl}/api/auth/user`, {
  headers: { cookie },
});
assert(sessionResponse.ok, `Authenticated session failed with ${sessionResponse.status}.`);
const session = await sessionResponse.json();
assert(
  session.user?.email === ownerEmail,
  'Authenticated session did not return the owner.',
);

const dashboardResponse = await fetch(`${apiBaseUrl}/api/dashboard/kpis`, {
  headers: { cookie },
});
assert(
  dashboardResponse.ok,
  `Authenticated Dashboard request failed with ${dashboardResponse.status}.`,
);

const logoutResponse = await fetch(`${apiBaseUrl}/api/auth/logout`, {
  method: 'POST',
  headers: { cookie },
});
assert(logoutResponse.status === 204, `Logout failed with ${logoutResponse.status}.`);

const revokedSessionResponse = await fetch(`${apiBaseUrl}/api/auth/user`, {
  headers: { cookie },
});
assert(
  revokedSessionResponse.ok,
  `Revoked session endpoint failed with ${revokedSessionResponse.status}.`,
);
const revokedSession = await revokedSessionResponse.json();
assert(revokedSession.user === null, 'Logged-out session remained authenticated.');

const revokedDashboardResponse = await fetch(`${apiBaseUrl}/api/dashboard/kpis`, {
  headers: { cookie },
});
assert(
  revokedDashboardResponse.status === 401,
  `Revoked session still accessed the Dashboard. Received ${revokedDashboardResponse.status}.`,
);

console.log('First-party authentication smoke test passed.');
