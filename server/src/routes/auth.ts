import { GetCurrentAuthUserResponse } from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';

import {
  clearSession,
  getSessionId,
  isLocalAuthBypassEnabled,
} from '../lib/auth';

const router: IRouter = Router();

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

  res.status(501).json({
    error: 'First-party credential login is not configured yet.',
  });
});

router.post('/auth/login', (req: Request, res: Response) => {
  if (isLocalAuthBypassEnabled() && req.isAuthenticated()) {
    res.json({ user: req.user });
    return;
  }

  res.status(501).json({
    error: 'First-party credential login is not configured yet.',
  });
});

async function logout(req: Request, res: Response) {
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
