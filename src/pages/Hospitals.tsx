import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { Badge, NationalIdField, PhoneField, Status, useAction, useLoad } from '../ui';
import type { CountryCode, Hospital } from '../types';

const EMPTY = { name: '', code: '', city: '', adminName: '', password: '', adminEmail: '', adminNationalId: '' };

export default function Hospitals() {
  const { data, error, loading, reload } = useLoad<{ hospitals: Hospital[] }>(['hospitals'], () => api.get('/hospitals'));
  const act = useAction();
  const [form, setForm] = useState(EMPTY);
  const [country, setCountry] = useState<CountryCode>('IN');
  const [phone, setPhone] = useState('');
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await act(() => api.post('/hospitals', { ...form, adminEmail: form.adminEmail || null, country, adminPhone: phone }), 'Hospital created');
    if (ok) { setForm(EMPTY); setPhone(''); reload(); }
  };
  const toggle = async (id: string) => { if (await act(() => api.patch(`/hospitals/${id}/toggle`))) reload(); };

  return (
    <>
      <h1>Hospitals</h1>
      <p className="sub">Each hospital is a tenant in one shared database. Its users only ever see its own data.</p>

      <div className="card mb">
        <h2>Onboard a hospital</h2>
        <form className="row" onSubmit={create}>
          <label>Hospital name<input value={form.name} onChange={set('name')} required /></label>
          <label>Short code<input value={form.code} onChange={set('code')} required maxLength={10} placeholder="SUN" /></label>
          <label>City<input value={form.city} onChange={set('city')} required /></label>
          <label>Admin name<input value={form.adminName} onChange={set('adminName')} /></label>
          <PhoneField label="Admin phone" country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} />
          <label>Admin email (optional)<input type="email" value={form.adminEmail} onChange={set('adminEmail')} /></label>
          <NationalIdField country={country} value={form.adminNationalId} setValue={(v) => setForm({ ...form, adminNationalId: v })} />
          <label>Admin password<input type="password" value={form.password} onChange={set('password')} required minLength={8} /></label>
          <button className="btn">Create</button>
        </form>
        <p className="muted" style={{ marginBottom: 0 }}>The hospital's country follows the phone country (India = INR, US = USD). The admin must change the password at first sign-in.</p>
      </div>

      <Status loading={loading} error={error} />
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Hospital</th><th>City</th><th>Users</th><th>Patients</th><th>Appointments</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.hospitals.map((h) => (
              <tr key={h.id}>
                <td><strong>{h.name}</strong><div className="muted">{h.code} · {h.country}</div></td>
                <td>{h.city}</td>
                <td>{h.userCount}</td>
                <td>{h.patientCount}</td>
                <td>{h.appointmentCount}</td>
                <td><Badge tone={h.active ? 'ok' : 'bad'}>{h.active ? 'Active' : 'Disabled'}</Badge></td>
                <td><button className="btn ghost sm" onClick={() => toggle(h.id)}>{h.active ? 'Disable' : 'Enable'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
