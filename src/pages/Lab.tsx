import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { Status, day, dt, useAction, useLoad } from '../ui';
import type { LabOrder } from '../types';

function PendingRow({ o, onSaved }: { o: LabOrder; onSaved: () => void }) {
  const act = useAction();
  const [result, setResult] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (await act(() => api.post(`/lab/${o.id}/result`, { result }), 'Result saved')) onSaved();
  };
  return (
    <tr>
      <td>{o.patientName}<div className="muted">{o.mrn}</div></td>
      <td>{o.test}</td>
      <td>{day(o.createdAt)}</td>
      <td>
        <form className="row" onSubmit={save}>
          <input value={result} onChange={(e) => setResult(e.target.value)} required placeholder="e.g. Hb 13.2 g/dL" />
          <button className="btn sm">Save</button>
        </form>
      </td>
    </tr>
  );
}

export default function Lab() {
  const { data, error, loading, reload } = useLoad<{ pending: LabOrder[]; done: LabOrder[] }>(['lab'], () => api.get('/lab'));
  return (
    <>
      <h1>Lab orders</h1>
      <p className="sub">Enter results to release them to the doctor and the patient.</p>
      <Status loading={loading} error={error} />
      {data && (
        <>
          <div className="card mb tablewrap">
            <h2>Pending ({data.pending.length})</h2>
            <table>
              <thead><tr><th>Patient</th><th>Test</th><th>Ordered</th><th>Result</th></tr></thead>
              <tbody>
                {data.pending.map((o) => <PendingRow key={o.id} o={o} onSaved={reload} />)}
                {data.pending.length === 0 && <tr><td colSpan={4} className="muted">No pending orders.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card tablewrap">
            <h2>Recently completed</h2>
            <table>
              <thead><tr><th>Patient</th><th>Test</th><th>Result</th><th>Done</th></tr></thead>
              <tbody>
                {data.done.map((o) => (
                  <tr key={o.id}><td>{o.patientName}</td><td>{o.test}</td><td>{o.result}</td><td>{o.completedAt ? dt(o.completedAt) : ''}</td></tr>
                ))}
                {data.done.length === 0 && <tr><td colSpan={4} className="muted">Nothing yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
