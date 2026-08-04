import crypto from 'node:crypto';
import type { AuthUser } from '@workspace/api-zod';
import { db, sessionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { type Request, type Response } from 'express';

export const SESSION_COOKIE = 'lander_dispatch_session';
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export const LOCAL_DEVELOPMENT_USER: AuthUser = {
  id: 'local-development-user',
  email: 'auth-disabled@localhost',
  firstName: 'Local',
  lastName: 'Development',
  profileImageUrl: null,
};

export interface SessionData {
  user: AuthUser;
}

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isLocalAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.AUTH_DISABLED === 'true'
  );
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

export async function createSession(data: SessionData): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);

  await db.insert(sessionsTable).values({
    sid: tokenHash,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });

  return token;
}

export async function getSession(token: string): Promise<SessionData | null> {
  const tokenHash = hashSessionToken(token);
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, tokenHash));

  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(token);
    return null;
  }

  return row.sess as unknown as SessionData;
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, tokenHash));
}

export async function clearSession(
  res: Response,
  token?: string,
): Promise<void> {
  if (token) await deleteSession(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function getSessionId(req: Request): string | undefined {
  const value = req.cookies?.[SESSION_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
