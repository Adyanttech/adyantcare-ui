import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Badge, Status, dt, getDisplayZone, startOfToday, todayIn, useAction, useLoad, useToast } from '../ui';
import type { Doctor, Plan, ReleaseResult, Slot } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LENGTHS = [10, 15, 20, 30, 45, 60];
const TONE: Record<string, string> = { OPEN: 'ok', BOOKED: 'warn', CLOSED: 'bad' };

export default function Schedule() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const act = useAction();
  const toast = useToast();

  const doctors = useLoad<{ doctors: Doctor[] }>(['schedule-doctors', isDoctor], async () =>
    isDoctor ? { doctors: [] } : api.get<{ doctors: Doctor[] }>('/staff/doctors'));
  const [doctorId, setDoctorId] = useState('');
  const ready = isDoctor || !!doctorId;
  const who = !isDoctor && doctorId ? `doctorId=${doctorId}` : '';

  const [range, setRange] = useState(14);
  const from = encodeURIComponent(startOfToday().toISOString());
  const to = encodeURIComponent(new Date(startOfToday().getTime() + range * 86400000).toISOString());
  const slots = useLoad<{ slots: Slot[] }>(['schedule-slots', doctorId, range],
    () => api.get(`/schedule/slots?from=${from}&to=${to}&${who}`), ready);
  const plans = useLoad<{ plans: Plan[] }>(['schedule-plans', doctorId],
    () => api.get(`/schedule/plans?${who}`), ready);

  const reloadAll = () => { slots.reload(); plans.reload(); };
  const report = (r: ReleaseResult | null) => {
    if (!r) return;
    toast(r.created > 0 ? `${r.created} slot${r.created === 1 ? '' : 's'} released${r.skipped ? ` (${r.skipped} skipped: already there or in the past)` : ''}` : 'Nothing new to release: those times already exist or have passed.', r.created > 0 ? 'ok' : 'bad');
    reloadAll();
  };

  // One-off window
  const [win, setWin] = useState({ date: todayIn(getDisplayZone()), start: '10:00', end: '13:00', slotMinutes: 15 });
  const release = async (e: FormEvent) => {
    e.preventDefault();
    report(await act(() => api.post<ReleaseResult>('/schedule/windows', { ...win, doctorId: doctorId || undefined })));
  };

  // Weekly plan
  const [plan, setPlan] = useState({ dayOfWeek: 1, start: '10:00', end: '13:00', slotMinutes: 15 });
  const [days, setDays] = useState(14);
  const addPlan = async (e: FormEvent) => {
    e.preventDefault();
    if (await act(() => api.post('/schedule/plans', { ...plan, doctorId: doctorId || undefined }), 'Weekly plan added')) plans.reload();
  };
  const removePlan = async (id: string) => {
    if (!window.confirm('Remove this weekly plan? Slots already released stay.')) return;
    if (await act(() => api.del(`/schedule/plans/${id}`), 'Plan removed')) plans.reload();
  };
  const releasePlans = async () =>
    report(await act(() => api.post<ReleaseResult>('/schedule/plans/release', { doctorId: doctorId || undefined, days })));

  const setOpen = async (s: Slot, open: boolean) => {
    if (await act(() => api.post(`/schedule/slots/${s.id}/${open ? 'open' : 'close'}`), open ? 'Slot reopened' : 'Slot closed')) slots.reload();
  };

  return (
    <>
      <h1>{isDoctor ? 'My schedule' : 'Doctor schedule'}</h1>
      <p className="sub">Release the times patients can book. Each slot is one appointment. Front desk and patients book from the open slots.</p>

      {!isDoctor && (
        <div className="card mb">
          <label style={{ maxWidth: 360 }}>
            Doctor
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Select a doctor</option>
              {doctors.data?.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` · ${d.specialty}` : ''}</option>)}
            </select>
          </label>
        </div>
      )}

      {!ready && <div className="note">Choose a doctor to manage their schedule.</div>}

      {ready && (
        <>
          <div className="card mb">
            <h2>Release time for a day</h2>
            <form className="row" onSubmit={release}>
              <label>Date<input type="date" min={todayIn(getDisplayZone())} value={win.date} onChange={(e) => setWin({ ...win, date: e.target.value })} required /></label>
              <label>From<input type="time" value={win.start} onChange={(e) => setWin({ ...win, start: e.target.value })} required /></label>
              <label>Until<input type="time" value={win.end} onChange={(e) => setWin({ ...win, end: e.target.value })} required /></label>
              <label>
                Minutes per slot
                <select value={win.slotMinutes} onChange={(e) => setWin({ ...win, slotMinutes: Number(e.target.value) })}>
                  {LENGTHS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </label>
              <button className="btn">Release slots</button>
            </form>
            <p className="muted" style={{ marginBottom: 0 }}>Times are in the hospital's local time. Example: 10:00 to 13:00 with 15 minute slots makes 12 slots.</p>
          </div>

          <div className="card mb">
            <h2>Weekly plan</h2>
            <p className="muted" style={{ marginTop: -6 }}>Set your usual hours once, then release them for the coming weeks in one click.</p>
            <form className="row" onSubmit={addPlan}>
              <label>
                Day
                <select value={plan.dayOfWeek} onChange={(e) => setPlan({ ...plan, dayOfWeek: Number(e.target.value) })}>
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </label>
              <label>From<input type="time" value={plan.start} onChange={(e) => setPlan({ ...plan, start: e.target.value })} required /></label>
              <label>Until<input type="time" value={plan.end} onChange={(e) => setPlan({ ...plan, end: e.target.value })} required /></label>
              <label>
                Minutes per slot
                <select value={plan.slotMinutes} onChange={(e) => setPlan({ ...plan, slotMinutes: Number(e.target.value) })}>
                  {LENGTHS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </label>
              <button className="btn ghost">Add to plan</button>
            </form>

            <Status loading={plans.loading} error={plans.error} />
            {plans.data && plans.data.plans.length > 0 && (
              <div className="tablewrap" style={{ marginTop: 14 }}>
                <table>
                  <thead><tr>{!isDoctor && <th>Doctor</th>}<th>Day</th><th>Hours</th><th>Slot</th><th></th></tr></thead>
                  <tbody>
                    {plans.data.plans.map((p) => (
                      <tr key={p.id}>
                        {!isDoctor && <td>{p.doctorName}</td>}
                        <td>{DAYS[p.dayOfWeek]}</td>
                        <td>{p.start} to {p.end}</td>
                        <td>{p.slotMinutes} min</td>
                        <td><button className="btn danger sm" onClick={() => removePlan(p.id)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {plans.data && plans.data.plans.length === 0 && <p className="muted">No weekly plan yet.</p>}

            {plans.data && plans.data.plans.length > 0 && (
              <div className="gap" style={{ marginTop: 14, alignItems: 'center' }}>
                <span>Release the plan for the next</span>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 'auto' }} aria-label="Days to release">
                  {[7, 14, 21, 28, 60].map((n) => <option key={n} value={n}>{n} days</option>)}
                </select>
                <button className="btn" onClick={releasePlans}>Release plan</button>
              </div>
            )}
          </div>

          <div className="card mb">
            <div className="between" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Released slots</h2>
              <select value={range} onChange={(e) => setRange(Number(e.target.value))} style={{ width: 'auto' }} aria-label="Range">
                {[7, 14, 30].map((n) => <option key={n} value={n}>Next {n} days</option>)}
              </select>
            </div>
            <Status loading={slots.loading} error={slots.error} />
            {slots.data && (
              <div className="tablewrap">
                <table>
                  <thead><tr><th>When</th>{!isDoctor && <th>Doctor</th>}<th>Status</th><th>Patient</th><th></th></tr></thead>
                  <tbody>
                    {slots.data.slots.map((s) => (
                      <tr key={s.id}>
                        <td>{dt(s.startsAt)}</td>
                        {!isDoctor && <td>{s.doctorName}</td>}
                        <td><Badge tone={TONE[s.status]}>{s.status}</Badge></td>
                        <td>{s.patientName ? <>{s.patientName}<div className="muted">{s.mrn}</div></> : '-'}</td>
                        <td>
                          {s.status === 'OPEN' && <button className="btn danger sm" onClick={() => setOpen(s, false)}>Close</button>}
                          {s.status === 'CLOSED' && new Date(s.startsAt) > new Date() && <button className="btn ghost sm" onClick={() => setOpen(s, true)}>Reopen</button>}
                        </td>
                      </tr>
                    ))}
                    {slots.data.slots.length === 0 && <tr><td colSpan={5} className="muted">No slots released for this period.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
