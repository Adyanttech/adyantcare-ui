import { api } from '../api';
import { Badge, Status, day, useAction, useLoad } from '../ui';
import type { PortalRecord } from '../types';

export default function MyRecord() {
  const act = useAction();
  const { data, error, loading, reload } = useLoad<PortalRecord>(['my-record'], () => api.get('/me/record'));

  const setConsent = async (consent: boolean) => {
    if (await act(() => api.put('/me/consent', { consent }), 'Preference saved')) reload();
  };

  if (loading || error || !data) return <Status loading={loading} error={error} />;
  const { person, hospitals, appointments, prescriptions, labs } = data;

  return (
    <>
      <h1>My health record</h1>
      <p className="sub">Records from {hospitals.map((h) => h.name).join(', ')}. Only you can see this combined view.</p>

      <div className="card mb">
        <h2>Privacy</h2>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, color: 'inherit', fontWeight: 400, fontSize: 14 }}>
          <input type="checkbox" checked={person.shareConsent} onChange={(e) => setConsent(e.target.checked)} style={{ minWidth: 0 }} />
          Include my de-identified data in aggregate health statistics.
        </label>
        {person.idLabel && <p className="muted">Your ID on file: <strong>{person.idLabel}</strong>. The full number is never stored. It is only used to link your records across hospitals.</p>}
        <p className="muted" style={{ marginBottom: 0 }}>Off by default. Your name and phone are never shared in statistics.</p>
      </div>

      <div className="grid cols-2">
        <div className="card tablewrap">
          <h2>Appointments</h2>
          <table>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{day(a.scheduledAt)}</td>
                  <td>{a.hospitalName}<div className="muted">{a.doctorName}</div></td>
                  <td>{a.diagnosis || a.reason || '-'}</td>
                  <td><Badge>{a.status.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td className="muted">None.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <h2>Prescriptions</h2>
            {prescriptions.map((r) => (
              <div key={r.id} style={{ marginBottom: 10 }}>
                <strong>{day(r.createdAt)}</strong> · {r.hospitalName}
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{r.items.map((i, n) => <li key={n}>{i}</li>)}</ul>
              </div>
            ))}
            {prescriptions.length === 0 && <p className="muted">None.</p>}
          </div>
          <div className="card">
            <h2>Lab results</h2>
            {labs.map((l) => (
              <p key={l.id}>{l.test} · {l.hospitalName} <Badge tone={l.status === 'COMPLETED' ? 'ok' : 'warn'}>{l.status}</Badge>{l.result && <span className="muted"> {l.result}</span>}</p>
            ))}
            {labs.length === 0 && <p className="muted">None.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
