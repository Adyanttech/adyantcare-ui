import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { renderTemplate, TEMPLATE_PLACEHOLDERS, unknownPlaceholders } from '../lib';
import { Badge, Status, dt, useAction, useLoad } from '../ui';
import type { ReminderLogItem, ReminderSettings } from '../types';

const DAY_BEFORE_CHOICES = [12, 18, 24, 36, 48];
const SHORT_CHOICES = [1, 2, 3, 4, 6];
const SAMPLE = { patient: 'Ravi', doctor: 'Dr. Meera Iyer', hospital: 'Your hospital', date: 'Mon, 16 Nov', time: '10:30 AM' };
const STATUS_TONE: Record<string, string> = { SENT: 'ok', FAILED: 'bad', SKIPPED: 'warn', PENDING: 'warn' };
const KIND_LABEL: Record<string, string> = { DAY_BEFORE: 'Day before', SHORT_NOTICE: 'Short notice' };

// Hospital-wide reminder settings. Front desk, doctors and admins can change them.
export default function Reminders() {
  const act = useAction();
  const settings = useLoad<ReminderSettings>(['reminder-settings'], () => api.get('/reminders/settings'));
  const log = useLoad<{ items: ReminderLogItem[] }>(['reminder-log'], () => api.get('/reminders/log'));
  const [form, setForm] = useState<ReminderSettings | null>(null);

  useEffect(() => { if (settings.data) setForm(settings.data); }, [settings.data]);

  const bad = form ? unknownPlaceholders(form.template) : [];
  const tooClose = form ? form.shortHours >= form.dayBeforeHours : false;
  const preview = form ? renderTemplate(form.template, SAMPLE) : '';

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || bad.length || tooClose) return;
    const saved = await act(() => api.put<ReminderSettings>('/reminders/settings', {
      enabled: form.enabled,
      dayBeforeEnabled: form.dayBeforeEnabled, dayBeforeHours: form.dayBeforeHours,
      shortEnabled: form.shortEnabled, shortHours: form.shortHours,
      template: form.template === form.defaultTemplate ? '' : form.template,
    }), 'Reminder settings saved');
    if (saved) { setForm(saved); settings.reload(); }
  };

  return (
    <>
      <h1>Appointment reminders</h1>
      <p className="sub">Patients get a text message before their visit. These settings apply to the whole hospital.</p>

      <Status loading={settings.loading} error={settings.error} />

      {form && (
        <>
          {!form.jobEnabled && (
            <div className="note">
              The reminder job is switched off on this server, so no messages are being sent yet. You can set everything up now; sending starts when the job is enabled.
            </div>
          )}

          <form className="card mb" onSubmit={save}>
            <h2>Settings</h2>

            <label className="check">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
              Send appointment reminders for this hospital
            </label>

            <div className="row" style={{ marginTop: 14, opacity: form.enabled ? 1 : 0.5 }}>
              <div>
                <label className="check">
                  <input type="checkbox" disabled={!form.enabled} checked={form.dayBeforeEnabled} onChange={(e) => setForm({ ...form, dayBeforeEnabled: e.target.checked })} />
                  Early reminder
                </label>
                <label>
                  Hours before the visit
                  <select disabled={!form.enabled || !form.dayBeforeEnabled} value={form.dayBeforeHours} onChange={(e) => setForm({ ...form, dayBeforeHours: Number(e.target.value) })}>
                    {DAYBEFORE(form.dayBeforeHours).map((h) => <option key={h} value={h}>{h === 24 ? '24 hours (one day before)' : `${h} hours`}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <label className="check">
                  <input type="checkbox" disabled={!form.enabled} checked={form.shortEnabled} onChange={(e) => setForm({ ...form, shortEnabled: e.target.checked })} />
                  Short-notice reminder
                </label>
                <label>
                  Hours before the visit
                  <select disabled={!form.enabled || !form.shortEnabled} value={form.shortHours} onChange={(e) => setForm({ ...form, shortHours: Number(e.target.value) })}>
                    {SHORT(form.shortHours).map((h) => <option key={h} value={h}>{h} hour{h === 1 ? '' : 's'}</option>)}
                  </select>
                </label>
              </div>
            </div>
            {tooClose && <div className="err" role="alert">The short-notice reminder must be closer to the visit than the early reminder.</div>}

            <label style={{ marginTop: 14 }}>
              Message
              <textarea rows={3} maxLength={300} value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} disabled={!form.enabled} />
            </label>
            <div className="hint">
              Use {TEMPLATE_PLACEHOLDERS.map((p) => `{${p}}`).join(' ')}. {form.template.length}/300 characters.
              {' '}<button type="button" className="linkbtn" onClick={() => setForm({ ...form, template: form.defaultTemplate })}>Use the standard message</button>
            </div>
            {bad.length > 0 && <div className="err" role="alert">Unknown placeholder: {bad.map((b) => `{${b}}`).join(', ')}</div>}

            <div className="preview" aria-label="Message preview">
              <small className="muted">Preview</small>
              <p>{preview}</p>
            </div>

            <button className="btn" disabled={bad.length > 0 || tooClose}>Save settings</button>
          </form>
        </>
      )}

      <div className="card">
        <div className="between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Recent reminders</h2>
          <button className="btn ghost sm" onClick={log.reload}>Refresh</button>
        </div>
        <Status loading={log.loading} error={log.error} />
        <div className="tablewrap">
          <table>
            <thead><tr><th>Visit</th><th>Patient</th><th>Reminder</th><th>Status</th><th>Sent</th></tr></thead>
            <tbody>
              {log.data?.items.map((r) => (
                <tr key={r.id}>
                  <td>{dt(r.appointmentAt)}</td>
                  <td>{r.patientName}<div className="muted">{r.mrn}</div></td>
                  <td>{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>{r.error && <div className="muted">{r.error}</div>}</td>
                  <td>{r.sentAt ? dt(r.sentAt) : '-'}</td>
                </tr>
              ))}
              {log.data && log.data.items.length === 0 && <tr><td colSpan={5} className="muted">No reminders sent yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Offer the standard choices, plus the saved value if it is something else.
const DAYBEFORE = (current: number) => (DAY_BEFORE_CHOICES.includes(current) ? DAY_BEFORE_CHOICES : [...DAY_BEFORE_CHOICES, current].sort((a, b) => a - b));
const SHORT = (current: number) => (SHORT_CHOICES.includes(current) ? SHORT_CHOICES : [...SHORT_CHOICES, current].sort((a, b) => a - b));
