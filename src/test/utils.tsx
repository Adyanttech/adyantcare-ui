import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../ui';
import type { User } from '../types';

/** Renders a page the way the app does: data cache, toasts and a router. Other routes show a marker so navigation can be asserted. */
export function renderPage(ui: ReactElement, { path = '/', route = '/' }: { path?: string; route?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="/my" element={<div>My record page</div>} />
            <Route path="*" element={<div>Somewhere else</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

type Handler = unknown | ((path: string, body?: unknown) => unknown);
export type Routes_ = Record<string, Handler>;

/** Answers a mocked API call from a table of path to response. A path matches exactly or ahead of a query string. */
export function respond(table: Routes_, path: string, body?: unknown) {
  const key = Object.keys(table).find((k) => path === k || path.startsWith(`${k}?`));
  if (!key) throw new Error(`Unexpected request in test: ${path}`);
  const v = table[key];
  return typeof v === 'function' ? (v as (p: string, b?: unknown) => unknown)(path, body) : v;
}

export const inDays = (days: number, hours = 0) => new Date(Date.now() + days * 86_400_000 + hours * 3_600_000).toISOString();

export function makeUser(role: User['role'], currency: 'INR' | 'USD' | null = 'INR'): User {
  return {
    id: 'u1', name: 'Test User', role, phone: '+919000000000', specialty: null, mustChangePassword: false,
    hospital: currency ? { id: 'h1', name: 'Sunrise', city: 'Hyderabad', currency, code: 'SUN', tagline: null, brandColor: null } : null,
  };
}
