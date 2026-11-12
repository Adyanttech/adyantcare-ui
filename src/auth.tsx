import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import { queryClient } from './queryClient';
import type { AuthResponse, CountryCode, User } from './types';

/** Who is signing in: an email, or a country plus mobile number. */
export type Who = { email: string } | { country: CountryCode; phone: string };

interface AuthState {
  user: User | null;
  setUser: (u: User | null) => void;
  ready: boolean;
  login: (who: Who, password: string) => Promise<void>;
  loginWithOtp: (who: Who, code: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear(); // never show one user's cached data to the next user
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) { setReady(true); return; }
    api.get<{ user: User }>('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [logout]);

  const start = (d: AuthResponse) => {
    queryClient.clear();
    setToken(d.token);
    setUser(d.user);
  };

  const login = async (who: Who, password: string) =>
    start(await api.post<AuthResponse>('/auth/login', { ...who, password }));
  const loginWithOtp = async (who: Who, code: string) =>
    start(await api.post<AuthResponse>('/auth/otp/login', { ...who, code }));

  return <Ctx.Provider value={{ user, setUser, ready, login, loginWithOtp, logout }}>{children}</Ctx.Provider>;
}
