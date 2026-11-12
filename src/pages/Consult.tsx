import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Badge, Status, day, useAction, useLoad } from '../ui';
import type { ConsultDetail } from '../types';

export default function Consult() {
  const { id } = useParams();
  const nav = useNavigate();
  const act = useAction();
  const { data, error, loading } = useLoad<ConsultDetail>(['consult', id], () => api.get(`/appointments/${id}`));
  const [form, setForm] = useState({ diagnosis: '', notes: '', prescription: '', labTests: '', fee: '500' });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const fee = parseInt(form.fee, 10);
    const ok = await act(
      () => api.post(`/appointments/${id}/complete`, { ...form, fee: Number.isFinite(fee) ? fee : 0 }), // fee must be a number
      'Visit completed',
    );
    if (ok) nav('/appointments');
  };

  if (loading || error || !data) return <Status loading={loading} error={error} />;
  const a = data.appointment;
  const age = a.dob ? Math.floor((Date.now() - new Date(a.dob).getTime()) / 31557600000) : null;

  return (
    <>
      <h1>Consultation</h1>
      <p className="sub">
        {a.patientName} · {a.mrn}{age !== null && ` · ${age} yrs`}{a.gender && ` · ${a.gender}`}{a.reason && ` · Reason: ${a.reason}`}
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h2>Visit</h2>
          <form className="grid" onSubmit={submit}>
            <label>Diagnosis<input value={form.diagnosis} onChange={set('diagnosis')} required style={{ width: '100%' }} /></label>
            <label>Clinical notes<textarea value={form.notes} onChange={set('notes')} /></label>
            <label>Prescription (one medicine per line)
              <textarea value={form.prescription} onChange={set('prescription')} placeholder="Paracetamol 500mg - 1 tab thrice daily - 3 days" />
            </label>
            <label>Lab tests (one per line)
              <textarea value={form.labTests} onChange={set('labTests')} placeholder={'CBC\nBlood sugar fasting'} />
            </label>
            <label>Consultation fee<input type="number" min="0" value={form.fee} onChange={set('fee')} /></label>
            <div><button className="btn">Complete visit</button></div>
          </form>
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <h2>Previous visits here</h2>
            {data.history.length === 0 && <p className="muted">No earlier visits at this hospital.</p>}
            {data.history.map((h, i) => <p key={i}><strong>{day(h.scheduledAt)}</strong> · {h.diagnosis || 'No diagnosis recorded'}</p>)}
          </div>
          <div className="card">
            <h2>Recent lab orders</h2>
            {data.labs.length === 0 && <p className="muted">None.</p>}
            {data.labs.map((l, i) => (
              <p key={i}>{l.test} <Badge tone={l.status === 'COMPLETED' ? 'ok' : 'warn'}>{l.status}</Badge>{l.result && <span className="muted"> {l.result}</span>}</p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
