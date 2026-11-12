import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { AreaChart, Columns, Donut } from '../charts';
import { Icon } from '../icons';
import { Avatar, Bars, Empty, PageHeader, Status, StatCard, money, shortDay, useLoad } from '../ui';
import type { Report } from '../types';

const PERIODS = [7, 30, 90];

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const pretty = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

export default function Reports() {
  const { user } = useAuth();
  const cur = user?.hospital?.currency;
  const [days, setDays] = useState(30);
  const { data, error, loading } = useLoad<Report>(['reports', days], () => api.get(`/reports?days=${days}`));

  const exportCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      [`${user?.hospital?.name ?? 'Hospital'} report, last ${data.days} days`], [],
      ['Date', 'Appointments', `Collected revenue (${data.currency})`],
      ...data.appointmentsByDay.map((p, i) => [p.date, p.value, data.revenueByDay[i]?.value ?? 0]), [],
      ['Doctor', 'Specialty', 'Appointments', 'Completed', `Revenue (${data.currency})`],
      ...data.doctors.map((d) => [d.name, d.specialty ?? '', d.appointments, d.completed, d.revenue]),
    ];
    downloadCsv(`adyantcare-report-${days}d.csv`, rows);
  };

  const t = data?.totals;
  const rate = t && t.appointments ? Math.round((t.completed / t.appointments) * 100) : 0;
  const labRate = t && t.labsOrdered ? Math.round((t.labsCompleted / t.labsOrdered) * 100) : 0;
  const maxDoc = Math.max(1, ...(data?.doctors.map((d) => d.completed) ?? [1]));

  return (
    <>
      <PageHeader
        title="Reports"
        sub={`How ${user?.hospital?.name ?? 'your hospital'} is doing, from the last ${days} days.`}
        actions={
          <>
            <div className="seg sm" role="group" aria-label="Period">
              {PERIODS.map((p) => (
                <button key={p} type="button" className={days === p ? 'on' : ''} onClick={() => setDays(p)}>{p} days</button>
              ))}
            </div>
            <button className="btn ghost sm" onClick={exportCsv} disabled={!data}><Icon name="download" size={15} /> Export CSV</button>
            <button className="btn ghost sm" onClick={() => window.print()}><Icon name="printer" size={15} /> Print</button>
          </>
        }
      />
      <Status loading={loading} error={error} />

      {data && t && (
        <>
          <div className="grid cols-6">
            <StatCard icon="calendar" label="Appointments" value={t.appointments} tone="brand" delay={0} />
            <StatCard icon="check" label="Completed" value={rate} format={(n) => `${n}%`} tone="green" hint={`${t.completed} visits`} delay={50} />
            <StatCard icon="wallet" label="Collected" value={t.collected} format={(n) => money(n, data.currency)} tone="green" delay={100} />
            <StatCard icon="receipt" label="Outstanding" value={t.pending} format={(n) => money(n, data.currency)} tone="amber" delay={150} />
            <StatCard icon="heart" label="New patients" value={t.newPatients} tone="rose" delay={200} />
            <StatCard icon="flask" label="Labs completed" value={labRate} format={(n) => `${n}%`} tone="violet" hint={`${t.labsCompleted} of ${t.labsOrdered}`} delay={250} />
          </div>

          <div className="grid cols-2 mt">
            <div className="card rise">
              <div className="between"><h2>Appointments per day</h2><span className="muted">{t.cancelled} cancelled</span></div>
              <AreaChart data={data.appointmentsByDay.map((p) => ({ label: shortDay(p.date), value: p.value }))} />
            </div>
            <div className="card rise" style={{ animationDelay: '70ms' }}>
              <div className="between"><h2>Collected revenue</h2><span className="muted">{money(t.collected, data.currency)}</span></div>
              <AreaChart data={data.revenueByDay.map((p) => ({ label: shortDay(p.date), value: p.value }))} color="#10b981" format={(n) => money(n, cur ?? data.currency)} />
            </div>
          </div>

          <div className="grid cols-3 mt">
            <div className="card rise">
              <h2>Visit outcomes</h2>
              <Donut rows={data.status.map((s) => ({ label: pretty(s.label), value: s.value }))} center={<><strong>{t.appointments + t.cancelled}</strong><small>visits</small></>} />
            </div>
            <div className="card rise" style={{ animationDelay: '70ms' }}>
              <h2>Busiest days</h2>
              <Columns rows={data.weekdays} />
            </div>
            <div className="card rise" style={{ animationDelay: '140ms' }}>
              <h2>Top diagnoses</h2>
              {data.diagnoses.length ? <Bars rows={data.diagnoses} /> : <Empty icon="stethoscope" title="No diagnoses yet" text="They appear as doctors complete visits." />}
            </div>
          </div>

          <div className="grid cols-2 mt">
            <div className="card rise">
              <h2>Patients by gender</h2>
              <Donut rows={data.gender} size={150} center={<><strong>{data.gender.reduce((s, g) => s + g.value, 0)}</strong><small>patients</small></>} />
            </div>
            <div className="card rise" style={{ animationDelay: '70ms' }}>
              <h2>Patients by age</h2>
              <Columns rows={data.ageBands} height={160} />
            </div>
          </div>

          <div className="card mt rise tablewrap">
            <h2>Doctor performance</h2>
            <table>
              <thead><tr><th>Doctor</th><th>Appointments</th><th>Completed</th><th style={{ width: '28%' }}>Share of completed</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.doctors.map((d) => (
                  <tr key={d.name}>
                    <td><span className="cell-id"><Avatar name={d.name} size={32} /><span><strong>{d.name}</strong><div className="muted">{d.specialty ?? 'General'}</div></span></span></td>
                    <td>{d.appointments}</td>
                    <td>{d.completed}</td>
                    <td><div className="bar"><span style={{ width: `${(d.completed / maxDoc) * 100}%` }} /></div></td>
                    <td><strong>{money(d.revenue, data.currency)}</strong></td>
                  </tr>
                ))}
                {data.doctors.length === 0 && <tr><td colSpan={5} className="muted">No doctors yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
