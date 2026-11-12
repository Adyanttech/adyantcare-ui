import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../ui';
import type { User } from '../types';

export default function ChangePassword() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const forced = !!user?.mustChangePassword;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ user: User }>('/auth/password/change', { currentPassword: current, newPassword: pw });
      setUser(r.user);
      toast('Password changed');
      nav('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>Change password</h1>
      <p className="sub">{forced ? 'Your password was set by someone else. Choose your own to continue.' : 'Use at least 8 characters.'}</p>
      <div className="card" style={{ maxWidth: 440 }}>
        <form className="grid" onSubmit={submit}>
          <label>Current password (leave empty if you signed in with a one-time code)
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label>New password
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required style={{ width: '100%' }} />
          </label>
          <label>Repeat new password
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required style={{ width: '100%' }} />
          </label>
          {error && <div className="err">{error}</div>}
          <div><button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button></div>
        </form>
      </div>
    </>
  );
}
