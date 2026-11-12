import { api } from '../api';
import { useAuth } from '../auth';
import { Badge, Status, day, money, useAction, useLoad } from '../ui';
import type { Invoice } from '../types';

export default function Billing() {
  const { user } = useAuth();
  const cur = user?.hospital?.currency;
  const act = useAction();
  const { data, error, loading, reload } = useLoad<{ invoices: Invoice[] }>(['billing'], () => api.get('/billing'));
  const pay = async (id: string) => { if (await act(() => api.patch(`/billing/${id}/pay`), 'Marked as paid')) reload(); };
  const pending = (data?.invoices ?? []).filter((i) => i.status === 'PENDING').reduce((a, i) => a + i.amount, 0);

  return (
    <>
      <h1>Billing</h1>
      <p className="sub">Outstanding: {money(pending, cur)}</p>
      <Status loading={loading} error={error} />
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Date</th><th>Patient</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.invoices.map((i) => (
              <tr key={i.id}>
                <td>{day(i.createdAt)}</td>
                <td>{i.patientName}<div className="muted">{i.mrn}</div></td>
                <td>{money(i.amount, cur)}</td>
                <td><Badge tone={i.status === 'PAID' ? 'ok' : 'warn'}>{i.status}</Badge></td>
                <td>{i.status === 'PENDING' && <button className="btn ghost sm" onClick={() => pay(i.id)}>Mark paid</button>}</td>
              </tr>
            ))}
            {data && data.invoices.length === 0 && <tr><td colSpan={5} className="muted">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
