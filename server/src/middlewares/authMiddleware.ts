import type { AuthUser } from '@workspace/api-zod';
import { type NextFunction, type Request, type Response } from 'express';

import {
  clearSession,
  getSession,
  getSessionId,
  isLocalAuthBypassEnabled,
  LOCAL_DEVELOPMENT_USER,
} from '../lib/auth';

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

function isLoopbackAddress(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1'
  );
}

function isLoopbackHost(value: string | undefined): boolean {
  if (!value) return false;
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\](:\d+)?$/, '')
    .replace(/:\d+$/, '');
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isStrictLocalRequest(req: Request): boolean {
  const hasForwardedHeaders =
    req.headers['x-forwarded-for'] !== undefined ||
    req.headers['x-forwarded-host'] !== undefined ||
    req.headers['x-forwarded-proto'] !== undefined;

  if (hasForwardedHeaders) return false;

  const origin = req.headers.origin;
  if (typeof origin === 'string') {
    try {
      if (!isLoopbackHost(new URL(origin).hostname)) return false;
    } catch {
      return false;
    }
  }

  return (
    isLoopbackAddress(req.socket.localAddress) &&
    isLoopbackAddress(req.socket.remoteAddress) &&
    isLoopbackHost(req.headers.host)
  );
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request['isAuthenticated'];

  if (isLocalAuthBypassEnabled()) {
    if (!isStrictLocalRequest(req)) {
      res.status(403).json({
        error: 'Local authentication bypass is restricted to loopback requests.',
      });
      return;
    }

    req.user = LOCAL_DEVELOPMENT_USER;
    next();
    return;
  }

  const token = getSessionId(req);
  if (!token) {
    next();
    return;
  }

  const session = await getSession(token);
  if (!session?.user?.id) {
    await clearSession(res, token);
    next();
    return;
  }

  req.user = session.user;
  next();
}

export function requireAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  next();
}
