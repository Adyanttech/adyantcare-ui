import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { ROLE_LABEL } from '../Layout';
import { Badge, NationalIdField, PhoneField, Status, useAction, useLoad } from '../ui';
import type { CountryCode, Staff as StaffRow } from '../types';

const EMPTY = { name: '', role: 'DOCTOR', specialty: '', password: '', email: '', nationalId: '' };

export default function Staff() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useLoad<{ staff: StaffRow[] }>(['staff'], () => api.get('/staff'));
  const act = useAction();
  const [form, setForm] = useState(EMPTY);
  const [country, setCountry] = useState<CountryCode>(user?.hospital?.currency === 'USD' ? 'US' : 'IN');
  const [phone, setPhone] = useState('');
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await act(() => api.post('/staff', { ...form, email: form.email || null, country, phone }), 'Staff member added');
    if (ok) { setForm(EMPTY); setPhone(''); reload(); }
  };
  const toggle = async (id: string) => { if (await act(() => api.patch(`/staff/${id}/toggle`))) reload(); };

  return (
    <>
      <h1>Staff</h1>
      <p className="sub">Create logins for doctors, front desk and lab staff. Each needs a mobile number and an Aadhaar (India) or SSN (US), and can also sign in by email. They must change the password at first sign-in.</p>

      <div className="card mb">
        <h2>Add staff member</h2>
        <form className="row" onSubmit={create}>
          <label>Name<input value={form.name} onChange={set('name')} required /></label>
          <PhoneField country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} />
          <label>Email (optional)<input type="email" value={form.email} onChange={set('email')} /></label>
          <NationalIdField country={country} value={form.nationalId} setValue={(v) => setForm({ ...form, nationalId: v })} />
          <label>
            Role
            <select value={form.role} onChange={set('role')}>
              <option value="DOCTOR">Doctor</option>
              <option value="FRONT_DESK">Front Desk</option>
              <option value="LAB_TECH">Lab Technician</option>
              <option value="ADMIN">Hospital Admin</option>
            </select>
          </label>
          {form.role === 'DOCTOR' && <label>Specialty<input value={form.specialty} onChange={set('specialty')} placeholder="Cardiology" /></label>}
          <label>Temporary password<input type="password" value={form.password} onChange={set('password')} required minLength={8} /></label>
          <button className="btn">Add</button>
        </form>
      </div>

      <Status loading={loading} error={error} />
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Name</th><th>Mobile / email</th><th>ID</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.staff.map((u) => (
              <tr key={u.id}>
                <td>{u.name}{u.specialty && <div className="muted">{u.specialty}</div>}</td>
                <td>{u.phone}{u.email && <div className="muted">{u.email}</div>}</td>
                <td>{u.idLabel || <span className="muted">Not recorded</span>}</td>
                <td>{ROLE_LABEL[u.role]}</td>
                <td><Badge tone={u.active ? 'ok' : 'bad'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
                <td>{u.id !== user?.id && <button className="btn ghost sm" onClick={() => toggle(u.id)}>{u.active ? 'Disable' : 'Enable'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
