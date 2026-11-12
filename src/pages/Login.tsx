import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import AuthShell from '../AuthShell';
import { Icon, type IconName } from '../icons';
import { ContactField, whoBody, type ContactMethod } from '../ui';
import type { CountryCode } from '../types';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_USERS: [string, IconName, CountryCode, string][] = [
  ['Platform admin', 'globe', 'IN', '9000000000'],
  ['Hospital admin', 'hospital', 'IN', '9100000001'],
  ['Doctor', 'stethoscope', 'IN', '9100000002'],
  ['Front desk', 'calendar', 'IN', '9100000004'],
  ['Lab tech', 'flask', 'IN', '9100000005'],
  ['Patient (2 hospitals)', 'heart', 'IN', '9000000001'],
  ['US clinic admin', 'hospital', 'US', '4045550101'],
  ['US patient', 'user', 'US', '4045550199'],
  ['Admin by email', 'mail', 'IN', 'admin@sunrise.demo'],
];

// Six separate boxes for the one-time code. Supports typing, backspace and pasting.
export function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  return (
    <div
      className="otp"
      onPaste={(e) => {
        const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!t) return;
        e.preventDefault();
        onChange(t);
        refs.current[Math.min(t.length, 5)]?.focus();
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            const next = digits.slice();
            next[i] = v;
            onChange(next.join(''));
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [country, setCountry] = useState<CountryCode>('IN'); // India is the default
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<ContactMethod>('mobile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  const sendCode = () => run(async () => {
    const r = await api.post<{ message: string; devCode?: string | null }>('/auth/otp/request', { ...whoBody(method, country, phone, email), purpose: 'login' });
    setCodeSent(true);
    setInfo(r.message);
    setDevCode(r.devCode || '');
    setCode('');
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'password') return run(() => login(whoBody(method, country, phone, email), password));
    if (!codeSent) return sendCode();
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    return run(() => loginWithOtp(whoBody(method, country, phone, email), code));
  };

  const switchMode = (m: 'password' | 'otp') => { setMode(m); setError(''); setInfo(''); setCodeSent(false); setDevCode(''); };

  return (
    <AuthShell>
      <div className="authcard glass">
        <div className="authcard-badge"><Icon name="shieldcheck" size={22} /></div>
        <h2>Welcome back</h2>
        <p className="authcard-sub">Sign in with your mobile number or email. You will land in your own hospital.</p>

        <form onSubmit={submit}>
          <ContactField
            method={method} setMethod={(m) => { setMethod(m); setCodeSent(false); }}
            country={country} setCountry={setCountry}
            phone={phone} setPhone={(v) => { setPhone(v); setCodeSent(false); }}
            email={email} setEmail={(v) => { setEmail(v); setCodeSent(false); }}
          />

          <div className="seg contact-seg" data-on={mode}>
            <i className="seg-thumb" />
            <button type="button" className={mode === 'password' ? 'on' : ''} onClick={() => switchMode('password')}><Icon name="lock" size={15} /> Password</button>
            <button type="button" className={mode === 'otp' ? 'on' : ''} onClick={() => switchMode('otp')}><Icon name="phone" size={15} /> One-time code</button>
          </div>

          {mode === 'password' && (
            <label>
              Password
              <span className="pw">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" className="pw-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <Icon name={showPw ? 'eyeoff' : 'eye'} size={18} />
                </button>
              </span>
            </label>
          )}

          {mode === 'otp' && codeSent && (
            <>
              {devCode && <div className="note demo-note">Demo mode: no SMS is sent. Your code is <strong>{devCode}</strong>.</div>}
              {!devCode && info && <div className="muted">{info}</div>}
              <div className="field-label">6-digit code</div>
              <OtpBoxes value={code} onChange={setCode} />
            </>
          )}

          {error && <div className="err" role="alert">{error}</div>}

          <button className="btn lg block" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Please wait...' : mode === 'password' ? 'Sign in' : codeSent ? 'Verify and sign in' : 'Send code'}
            {!busy && <Icon name="arrowright" size={18} />}
          </button>
          {mode === 'otp' && codeSent && (
            <button type="button" className="btn ghost block" disabled={busy} onClick={sendCode}>Send a new code</button>
          )}
        </form>

        <p className="authcard-links"><Link to="/forgot">Forgot password?</Link></p>

        <div className="secure-note"><Icon name="lock" size={13} /> Your connection is encrypted</div>

        {DEMO && (
          <div className="demo">
            <div className="demo-title"><Icon name="sparkle" size={14} /> Quick demo logins <span>(password <code>Demo@123</code>)</span></div>
            <div className="demo-chips">
              {DEMO_USERS.map(([label, icon, c, p]) => (
                <button key={label} type="button" onClick={() => {
                  switchMode('password');
                  if (p.includes('@')) { setMethod('email'); setEmail(p); } else { setMethod('mobile'); setCountry(c); setPhone(p); }
                  setPassword('Demo@123');
                }}>
                  <Icon name={icon} size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
