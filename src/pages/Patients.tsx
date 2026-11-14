import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { looksLikeNationalId, looksLikePhone } from '../lib';
import { Badge, NationalIdField, PhoneField, Status, useAction, useLoad, useToast } from '../ui';
import type { CountryCode, Patient, PatientLookup, RegisterResult } from '../types';

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
  // Once a full phone number or ID is typed, check whether this person is already on the platform (for example at another hospital).
  const [lookup, setLookup] = useState<PatientLookup | null>(null);
  const lastKey = useRef('');
  useEffect(() => {
    const okPhone = looksLikePhone(country, phone);
    const okId = looksLikeNationalId(country, form.nationalId);
    if (!okPhone && !okId) { lastKey.current = ''; setLookup(null); return; }
    const key = `${country}|${okPhone ? phone : ''}|${okId ? form.nationalId : ''}`;
    if (key === lastKey.current) return;
    const timer = setTimeout(async () => {
      lastKey.current = key;
      try {
        const r = await api.post<PatientLookup>('/patients/lookup', { country, phone: okPhone ? phone : null, nationalId: okId ? form.nationalId : null });
        setLookup(r);
        // An ID match is proof of identity: fill the form from the existing person.
        if (r.found && r.matchedBy === 'ID') {
          setForm((f) => ({ ...f, fullName: r.fullName ?? f.fullName, email: r.email ?? f.email, dob: r.dob ?? f.dob, gender: r.gender ?? f.gender }));
        }
      } catch { setLookup(null); }
    }, 400);
    return () => clearTimeout(timer);
  }, [country, phone, form.nationalId]);

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
    setForm(EMPTY); setPhone(''); setLookup(null); lastKey.current = ''; reload();
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
        {lookup?.found && lookup.matchedBy === 'ID' && (
          <div className="note info" role="status">
            {lookup.atThisHospital
              ? <>Already registered at this hospital (MRN {lookup.mrn}). Registering again changes nothing.</>
              : <>Found on the platform ({lookup.idLabel}). Their details are filled in. Registering links them to this hospital; clinical records stay separate.</>}
          </div>
        )}
        {lookup?.found && lookup.matchedBy === 'PHONE' && (
          <div className="note info" role="status">
            {lookup.atThisHospital
              ? <>{lookup.fullName} is already registered at this hospital (MRN {lookup.mrn}).</>
              : <>A person with this phone number is already on the platform ({lookup.fullName}). Enter their Aadhaar / SSN to fill in their details and link them.</>}
          </div>
        )}
        {lookup?.warning && <div className="note bad" role="alert">{lookup.warning}</div>}
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
