import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Badge, NationalIdField, PhoneField, Status, useAction, useLoad, useToast } from '../ui';
import type { CountryCode, Patient, RegisterResult } from '../types';

const EMPTY = { fullName: '', email: '', dob: '', gender: '', portalPassword: '', nationalId: '' };

export default function Patients() {
  const { user } = useAuth();
  const toast = useToast();
  const act = useAction();
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const { data, error, loading, reload } = useLoad<{ patients: Patient[] }>(
    ['patients', applied],
    () => api.get(`/patients?q=${encodeURIComponent(applied)}`),
  );

  const [form, setForm] = useState(EMPTY);
  const [country, setCountry] = useState<CountryCode>(user?.hospital?.currency === 'USD' ? 'US' : 'IN');
  const [phone, setPhone] = useState('');
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const register = async (e: FormEvent) => {
    e.preventDefault();
    const r = await act(() => api.post<RegisterResult>('/patients', {
      fullName: form.fullName,
      email: form.email || null,
      dob: form.dob || null, // the API expects a date or null, never an empty string
      gender: form.gender || null,
      portalPassword: form.portalPassword || null,
      nationalId: form.nationalId,
      country,
      phone,
    }));
    if (!r) return;
    if (!r.created) toast('Already registered at this hospital');
    else toast(r.linkedExisting ? `Registered (${r.mrn}) and linked to the existing person` : `Registered (${r.mrn})`);
    setForm(EMPTY); setPhone(''); reload();
  };

  return (
    <>
      <h1>Patients</h1>
      <p className="sub">
        Every patient needs an Aadhaar number (India) or SSN (United States). The same ID at another hospital links to the same person, so their history follows them.
        Only identity is shared. Clinical records stay inside each hospital.
      </p>

      <div className="card mb">
        <h2>Register patient</h2>
        <form className="row" onSubmit={register}>
          <label>Full name<input value={form.fullName} onChange={set('fullName')} required /></label>
          <PhoneField country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} />
          <NationalIdField country={country} value={form.nationalId} setValue={(v) => setForm({ ...form, nationalId: v })} />
          <label>Email (optional)<input type="email" value={form.email} onChange={set('email')} placeholder="lets the patient sign in by email" /></label>
          <label>Date of birth<input type="date" value={form.dob} onChange={set('dob')} /></label>
          <label>
            Gender
            <select value={form.gender} onChange={set('gender')}>
              <option value="">-</option><option>Female</option><option>Male</option><option>Other</option>
            </select>
          </label>
          <label>Portal password (optional)<input type="password" value={form.portalPassword} onChange={set('portalPassword')} minLength={8} placeholder="lets the patient sign in" /></label>
          <button className="btn">Register</button>
        </form>
      </div>

      <div className="card">
        <form className="row" style={{ marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); setApplied(q); }}>
          <label>Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, MRN, phone or full Aadhaar / SSN" /></label>
          <button className="btn ghost">Search</button>
        </form>
        <Status loading={loading} error={error} />
        <div className="tablewrap">
          <table>
            <thead><tr><th>MRN</th><th>Name</th><th>Phone</th><th>ID</th><th>Gender</th><th>Platform</th></tr></thead>
            <tbody>
              {data?.patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.mrn}</td>
                  <td>{p.fullName}</td>
                  <td>{p.phone}{p.email && <div className="muted">{p.email}</div>}</td>
                  <td>{p.idLabel || <span className="muted">Not recorded</span>}</td>
                  <td>{p.gender || '-'}</td>
                  <td>{p.hospitalCount > 1 ? <Badge>Also at {p.hospitalCount - 1} other hospital(s)</Badge> : <span className="muted">This hospital only</span>}</td>
                </tr>
              ))}
              {data && data.patients.length === 0 && <tr><td colSpan={6} className="muted">No patients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
