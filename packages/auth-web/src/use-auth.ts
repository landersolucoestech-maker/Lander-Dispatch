import type { AuthUser } from '@workspace/api-client-react';
import { useCallback, useEffect, useState } from 'react';

export type { AuthUser };

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

interface ErrorEnvelope {
  error?: string;
}

const isStaticPreview =
  typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');

const previewUser: AuthUser = {
  id: 'frontend-preview',
  email: 'preview@landerdispatch.local',
  firstName: 'Lander',
  lastName: 'Dispatch',
  profileImageUrl: null,
};

function appPath(path: string): string {
  if (!isStaticPreview || typeof window === 'undefined') return path;

  const [repository] = window.location.pathname.split('/').filter(Boolean);
  const base = repository ? `/${repository}` : '';
  return `${base}${path}`;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(isStaticPreview ? previewUser : null);
  const [isLoading, setIsLoading] = useState(!isStaticPreview);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaticPreview) return;

    let cancelled = false;

    fetch('/api/auth/user', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setSessionError(null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setSessionError('Unable to verify the current session.');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    if (isStaticPreview) {
      setUser(previewUser);
      window.location.assign(appPath('/dashboard'));
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = (await response.json().catch(() => ({}))) as
      | { user?: AuthUser }
      | ErrorEnvelope;

    if (!response.ok || (!('user' in body) && response.status !== 204)) {
      throw new Error(
        'error' in body && body.error
          ? body.error
          : 'Authentication failed. Try again.',
      );
    }

    window.location.assign(appPath('/dashboard'));
  }, []);

  const logout = useCallback(async () => {
    if (isStaticPreview) {
      setUser(previewUser);
      window.location.assign(appPath('/dashboard'));
      return;
    }

    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);

    window.location.assign(appPath('/login'));
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    sessionError,
    login,
    logout,
  };
}
