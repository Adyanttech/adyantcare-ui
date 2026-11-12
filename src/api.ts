const BASE = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5080').replace(/\/$/, '');
const KEY = 'adyantcare_token';

export const getToken = (): string | null => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
export const setToken = (t: string | null): void => {
  try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch { /* ignore */ }
};

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void): void => { onUnauthorized = fn; };

const PUBLIC_PATHS = ['/auth/login', '/auth/otp/request', '/auth/otp/login', '/auth/password/reset'];

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('Cannot reach the server. If it was idle, wait about a minute and try again.');
  }
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    if (res.status === 401 && !PUBLIC_PATHS.includes(path)) onUnauthorized();
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b: unknown = {}) => request<T>('POST', p, b),
  put: <T>(p: string, b: unknown = {}) => request<T>('PUT', p, b),
  patch: <T>(p: string, b: unknown = {}) => request<T>('PATCH', p, b),
};
