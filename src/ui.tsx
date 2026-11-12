import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CountUp, Sparkline } from './charts';
import { Icon, type IconName } from './icons';
import type { CountryCode } from './types';

// ---------- data loading (React Query underneath) ----------
export function useLoad<T>(key: unknown[], fn: () => Promise<T>, enabled = true) {
  const q = useQuery<T, Error>({ queryKey: key, queryFn: fn, enabled });
  return {
    data: q.data,
    error: q.error ? q.error.message : '',
    loading: enabled && q.isLoading,
    reload: () => { void q.refetch(); },
  };
}

// ---------- toasts ----------
type ToastKind = 'ok' | 'bad';
const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string; kind: ToastKind }[]>([]);
  const push = useCallback((message: string, kind: ToastKind = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, message, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {items.map((i) => <div key={i.id} className={`toast ${i.kind}`}>{i.message}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

// Run an async action; toast the outcome. Resolves to the result, or null if it failed.
export function useAction() {
  const toast = useToast();
  return async <T,>(fn: () => Promise<T>, successMsg?: string): Promise<T | null> => {
    try {
      const r = await fn();
      if (successMsg) toast(successMsg);
      return r;
    } catch (e) {
      toast((e as Error).message, 'bad');
      return null;
    }
  };
}

// ---------- small components ----------
export const Stat = ({ n, l }: { n: ReactNode; l: string }) => (
  <div className="card stat"><div className="n">{n}</div><div className="l">{l}</div></div>
);

export type Tone = 'brand' | 'violet' | 'amber' | 'green' | 'rose' | 'sky';

// Dashboard number card: icon, animated value, optional sparkline.
export function StatCard({ icon, label, value, format, tone = 'brand', hint, spark, delay = 0 }: {
  icon: IconName; label: string; value: number; format?: (n: number) => string;
  tone?: Tone; hint?: ReactNode; spark?: number[]; delay?: number;
}) {
  return (
    <div className={`card statcard tone-${tone} rise`} style={{ animationDelay: `${delay}ms` }}>
      <div className="statcard-top">
        <span className="statcard-icon"><Icon name={icon} size={20} /></span>
        {spark && <span className="statcard-spark"><Sparkline values={spark} color="var(--tone)" /></span>}
      </div>
      <div className="statcard-n"><CountUp value={value} format={format} /></div>
      <div className="statcard-l">{label}</div>
      {hint && <div className="statcard-hint">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="pagehead">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="pagehead-actions">{actions}</div>}
    </div>
  );
}

export function Empty({ icon = 'sparkle', title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={26} /></span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>{initials || '?'}</span>;
}

export const Badge = ({ tone = '', children }: { tone?: string; children: ReactNode }) => (
  <span className={`badge ${tone}`}>{children}</span>
);

export function Status({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return (
      <div className="skeleton-wrap" aria-busy="true" aria-label="Loading">
        <div className="skeleton h" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton s" />
      </div>
    );
  }
  if (error) return <div className="note bad">{error}</div>;
  return null;
}

export function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 10 }}>
          <div className="between"><span>{r.label}</span><strong>{r.value.toLocaleString()}</strong></div>
          <div className="bar"><span style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </>
  );
}

// ---------- formatting ----------
export const money = (amount: number, currency: string = 'INR') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
export const todayLabel = () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
export const shortDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const dt = (d: string) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
export const day = (d: string) => new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });

export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const todayWindow = () => {
  const from = startOfToday();
  const to = new Date(from); to.setDate(to.getDate() + 1);
  return `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
};

// ---------- phone input ----------
export const COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: 'IN', label: 'India (+91)' },
  { code: 'US', label: 'United States (+1)' },
];

export type ContactMethod = 'mobile' | 'email';

/** Body fields for sign-in style requests: either an email or a country plus mobile number. */
export const whoBody = (method: ContactMethod, country: CountryCode, phone: string, email: string) =>
  method === 'email' ? { email: email.trim() } : { country, phone };

interface ContactFieldProps {
  method: ContactMethod;
  setMethod: (m: ContactMethod) => void;
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  phone: string;
  setPhone: (p: string) => void;
  email: string;
  setEmail: (e: string) => void;
}

/** Mobile number or email address, with a small switch. Used on sign-in and password reset. */
export function ContactField({ method, setMethod, country, setCountry, phone, setPhone, email, setEmail }: ContactFieldProps) {
  return (
    <>
      <div className="seg sm contact-seg" role="tablist" aria-label="Sign in with">
        <button type="button" role="tab" aria-selected={method === 'mobile'} className={method === 'mobile' ? 'on' : ''} onClick={() => setMethod('mobile')}><Icon name="phone" size={14} /> Mobile</button>
        <button type="button" role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'on' : ''} onClick={() => setMethod('email')}><Icon name="mail" size={14} /> Email</button>
      </div>
      {method === 'mobile'
        ? <PhoneField label="Mobile number" country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} />
        : (
          <label>
            Email address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" autoComplete="username" required />
          </label>
        )}
    </>
  );
}

/** Aadhaar (India) or SSN (US) field. Required for every user. Only a hash and the last 4 digits are kept. */
export function NationalIdField({ country, value, setValue }: { country: CountryCode; value: string; setValue: (v: string) => void }) {
  const us = country === 'US';
  return (
    <label>
      {us ? 'Social Security Number (SSN)' : 'Aadhaar number'}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        maxLength={14}
        placeholder={us ? '9 digits' : '12 digits'}
        required
      />
      <span className="hint">Required. Links the same person across hospitals. Only the last 4 digits are kept.</span>
    </label>
  );
}

interface PhoneFieldProps {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  phone: string;
  setPhone: (p: string) => void;
  label?: string;
  required?: boolean;
}

export function PhoneField({ country, setCountry, phone, setPhone, label = 'Phone number', required = true }: PhoneFieldProps) {
  return (
    <label>
      {label}
      <div className="phone">
        <select value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} aria-label="Country code">
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" required={required} />
      </div>
    </label>
  );
}
