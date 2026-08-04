import type { AuthUser } from '@workspace/api-zod';
import { GetCurrentAuthUserResponse } from '@workspace/api-zod';
import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';

import {
  clearSession,
  createSession,
  getSessionId,
  isLocalAuthBypassEnabled,
  setSessionCookie,
} from '../lib/auth';
import { verifyPassword } from '../lib/password';

const router: IRouter = Router();
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const LoginBody = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(256),
});

function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return '/';
  }
  return value;
}

function toAuthUser(user: typeof usersTable.$inferSelect): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  };
}

function invalidCredentials(res: Response): void {
  res.status(401).json({ error: 'Invalid email or password.' });
}

router.get('/auth/user', (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get('/login', (req: Request, res: Response) => {
  const returnTo = getSafeReturnTo(req.query.returnTo);

  if (isLocalAuthBypassEnabled() && req.isAuthenticated()) {
    res.redirect(returnTo);
    return;
  }

  const query = returnTo === '/' ? '' : `?returnTo=${encodeURIComponent(returnTo)}`;
  res.redirect(`/login${query}`);
});

router.post('/auth/login', async (req: Request, res: Response) => {
  if (isLocalAuthBypassEnabled() && req.isAuthenticated()) {
    res.json({ user: req.user });
    return;
  }

  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    invalidCredentials(res);
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user?.passwordHash || user.status !== 'active') {
    await new Promise((resolve) => setTimeout(resolve, 250));
    invalidCredentials(res);
    return;
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    res.status(423).json({
      error: 'Account temporarily locked. Try again later.',
    });
    return;
  }

  const passwordMatches = await verifyPassword(
    user.passwordHash,
    parsed.data.password,
  );

  if (!passwordMatches) {
    const previousAttempts =
      user.lockedUntil && user.lockedUntil <= now
        ? 0
        : user.failedLoginAttempts;
    const failedLoginAttempts = previousAttempts + 1;
    const lockedUntil =
      failedLoginAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MS)
        : null;

    await db
      .update(usersTable)
      .set({
        failedLoginAttempts: lockedUntil ? 0 : failedLoginAttempts,
        lockedUntil,
        updatedAt: now,
      })
      .where(eq(usersTable.id, user.id));

    invalidCredentials(res);
    return;
  }

  const authUser = toAuthUser(user);
  const existingToken = getSessionId(req);
  if (existingToken) await clearSession(res, existingToken);

  const token = await createSession({ user: authUser });
  setSessionCookie(res, token);

  await db
    .update(usersTable)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(usersTable.id, user.id));

  res.json({ user: authUser });
});

async function logout(req: Request, res: Response): Promise<void> {
  const token = getSessionId(req);
  await clearSession(res, token);
}

router.get('/logout', async (req: Request, res: Response) => {
  const returnTo = getSafeReturnTo(req.query.returnTo);
  await logout(req, res);
  res.redirect(returnTo);
});

router.post('/auth/logout', async (req: Request, res: Response) => {
  await logout(req, res);
  res.status(204).end();
});

export default router;
