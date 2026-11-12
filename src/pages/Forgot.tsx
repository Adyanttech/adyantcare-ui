import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../AuthShell';
import { Icon } from '../icons';
import { ContactField, useToast, whoBody, type ContactMethod } from '../ui';
import { OtpBoxes } from './Login';
import type { CountryCode } from '../types';

// Forgot password: phone -> code -> new password.
export default function Forgot() {
  const nav = useNavigate();
  const toast = useToast();
  const [country, setCountry] = useState<CountryCode>('IN');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<ContactMethod>('mobile');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!sent) {
      return run(async () => {
        const r = await api.post<{ devCode?: string | null }>('/auth/otp/request', { ...whoBody(method, country, phone, email), purpose: 'reset' });
        setSent(true);
        setDevCode(r.devCode || '');
      });
    }
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    if (pw !== pw2) { setError('The two passwords do not match.'); return; }
    return run(async () => {
      await api.post('/auth/password/reset', { ...whoBody(method, country, phone, email), code, newPassword: pw });
      toast('Password updated. Please sign in.');
      nav('/login');
    });
  };

  return (
    <AuthShell compact>
      <div className="authcard glass">
        <div className="authcard-badge"><Icon name="key" size={22} /></div>
        <h2>Reset password</h2>
        <p className="authcard-sub">Enter your mobile number or email. We will text a 6-digit code to the mobile number on the account.</p>
        <form onSubmit={submit}>
          <ContactField
            method={method} setMethod={(m) => { setMethod(m); setSent(false); }}
            country={country} setCountry={setCountry}
            phone={phone} setPhone={(v) => { setPhone(v); setSent(false); }}
            email={email} setEmail={(v) => { setEmail(v); setSent(false); }}
          />
          {sent && (
            <>
              {devCode
                ? <div className="note demo-note">Demo mode: no SMS is sent. Your code is <strong>{devCode}</strong>.</div>
                : <div className="muted">If this account exists, a code has been sent to its registered mobile number.</div>}
              <div className="field-label">6-digit code</div>
              <OtpBoxes value={code} onChange={setCode} />
              <label>New password (8+ characters)<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required /></label>
              <label>Repeat new password<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required /></label>
            </>
          )}
          {error && <div className="err" role="alert">{error}</div>}
          <button className="btn lg block" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Please wait...' : sent ? 'Set new password' : 'Send code'}
          </button>
        </form>
        <p className="authcard-links"><Link to="/login">Back to sign in</Link></p>
      </div>
    </AuthShell>
  );
}
