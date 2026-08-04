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

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
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

    window.location.assign('/dashboard');
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);

    window.location.assign('/login');
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
