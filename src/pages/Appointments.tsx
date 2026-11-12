import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Badge, Status, dt, startOfToday, useAction, useLoad } from '../ui';
import type { AppointmentRow, Doctor, Patient } from '../types';

const TONE: Record<string, string> = { BOOKED: '', CHECKED_IN: 'warn', COMPLETED: 'ok', CANCELLED: 'bad' };
const EMPTY = { patientId: '', doctorId: '', scheduledAt: '', reason: '' };

export default function Appointments() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const act = useAction();
  const from = encodeURIComponent(startOfToday().toISOString());

  const list = useLoad<{ appointments: AppointmentRow[] }>(['appointments', from], () => api.get(`/appointments?from=${from}`));
  const lookups = useLoad<{ patients: Patient[]; doctors: Doctor[] }>(['appointment-lookups', isDoctor], async () => {
    if (isDoctor) return { patients: [], doctors: [] };
    const [p, d] = await Promise.all([
      api.get<{ patients: Patient[] }>('/patients'),
      api.get<{ doctors: Doctor[] }>('/staff/doctors'),
    ]);
    return { patients: p.patients, doctors: d.doctors };
  });

  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const book = async (e: FormEvent) => {
    e.preventDefault();
    // datetime-local has no time zone: convert from the user's local time to a real instant
    const ok = await act(() => api.post('/appointments', { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }), 'Appointment booked');
    if (ok) { setForm(EMPTY); list.reload(); }
  };
  const setStatus = async (id: string, status: string) => {
    if (await act(() => api.patch(`/appointments/${id}/status`, { status }))) list.reload();
  };

  return (
    <>
      <h1>{isDoctor ? 'My appointments' : 'Appointments'}</h1>
      <p className="sub">Today and upcoming.</p>

      {!isDoctor && (
        <div className="card mb">
          <h2>Book appointment</h2>
          <form className="row" onSubmit={book}>
            <label>
              Patient
              <select value={form.patientId} onChange={set('patientId')} required>
                <option value="">Select</option>
                {lookups.data?.patients.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.mrn})</option>)}
              </select>
            </label>
            <label>
              Doctor
              <select value={form.doctorId} onChange={set('doctorId')} required>
                <option value="">Select</option>
                {lookups.data?.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` · ${d.specialty}` : ''}</option>)}
              </select>
            </label>
            <label>When<input type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} required /></label>
            <label>Reason<input value={form.reason} onChange={set('reason')} placeholder="Fever, follow-up..." /></label>
            <button className="btn">Book</button>
          </form>
        </div>
      )}

      <Status loading={list.loading} error={list.error} />
      <div className="card tablewrap">
        <table>
          <thead><tr><th>When</th><th>Patient</th>{!isDoctor && <th>Doctor</th>}<th>Reason</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.data?.appointments.map((a) => {
              const open = a.status === 'BOOKED' || a.status === 'CHECKED_IN';
              return (
                <tr key={a.id}>
                  <td>{dt(a.scheduledAt)}</td>
                  <td>{a.patientName}<div className="muted">{a.mrn}</div></td>
                  {!isDoctor && <td>{a.doctorName}</td>}
                  <td>{a.reason || '-'}</td>
                  <td><Badge tone={TONE[a.status]}>{a.status.replace('_', ' ')}</Badge></td>
                  <td>
                    <span className="gap">
                      {a.status === 'BOOKED' && !isDoctor && <button className="btn ghost sm" onClick={() => setStatus(a.id, 'CHECKED_IN')}>Check in</button>}
                      {isDoctor && open && <Link className="btn sm" to={`/consult/${a.id}`}>Consult</Link>}
                      {open && <button className="btn danger sm" onClick={() => setStatus(a.id, 'CANCELLED')}>Cancel</button>}
                    </span>
                  </td>
                </tr>
              );
            })}
            {list.data && list.data.appointments.length === 0 && <tr><td colSpan={6} className="muted">Nothing scheduled.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
