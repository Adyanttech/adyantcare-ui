import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from './auth';
import type { Branding } from './types';

interface BrandState {
  branding: Branding | null;
  refresh: () => void;
}

const Ctx = createContext<BrandState>({ branding: null, refresh: () => {} });
export const useBranding = () => useContext(Ctx);

// Makes the app look like the signed-in hospital's own: accent colour, logo, banner, page title.
// Users without a hospital (platform admin, patients) get the default AdyantCare look.
export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const hid = user?.hospital?.id ?? null;

  const q = useQuery<Branding, Error>({
    queryKey: ['branding', hid],
    queryFn: () => api.get<Branding>('/branding'),
    enabled: !!hid,
    staleTime: 5 * 60_000,
  });

  const branding = hid ? q.data ?? null : null;
  const color = hid ? branding?.brandColor ?? user?.hospital?.brandColor ?? null : null;
  const hospitalName = user?.hospital?.name ?? null;

  useEffect(() => {
    const root = document.documentElement;
    if (color) root.style.setProperty('--brand', color);
    else root.style.removeProperty('--brand');
  }, [color]);

  useEffect(() => {
    document.title = hospitalName ? `${hospitalName} · AdyantCare` : 'AdyantCare';
  }, [hospitalName]);

  return (
    <Ctx.Provider value={{ branding, refresh: () => { void qc.invalidateQueries({ queryKey: ['branding'] }); } }}>
      {children}
    </Ctx.Provider>
  );
}
