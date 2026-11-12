import { api } from '../api';
import { Donut } from '../charts';
import { Icon } from '../icons';
import { Bars, Empty, PageHeader, Status, StatCard, useLoad } from '../ui';
import type { Insights as InsightsData } from '../types';

export default function Insights() {
  const { data, error, loading } = useLoad<InsightsData>(['insights'], () => api.get('/insights'));
  if (loading || error || !data) return <Status loading={loading} error={error} />;
  const { totals, byHospital, diagnoses, minGroup } = data;
  const optIn = totals.people ? Math.round((totals.optedIn / totals.people) * 100) : 0;

  return (
    <>
      <PageHeader title="Insights" sub="Aggregate view across hospitals. No names, phones or individual records." />
      <div className="note"><Icon name="shieldcheck" size={16} />
        <span>
          Diagnosis statistics include only patients who opted in, and groups smaller than {minGroup} are hidden.
          Keep this rule if the data is ever used for advertising or reporting outside the platform.
          Under India's DPDP Act and US HIPAA, health data needs explicit consent and likely legal review first.
        </span>
      </div>

      <div className="grid cols-4 mb">
        <StatCard icon="users" label="Unique people" value={totals.people} tone="brand" delay={0} />
        <StatCard icon="hospital" label="Seen at 2+ hospitals" value={totals.multiHospital} tone="violet" delay={60} />
        <StatCard icon="shieldcheck" label="Opted in to statistics" value={totals.optedIn} tone="green" hint={`${optIn}% of people`} delay={120} />
      </div>

      <div className="grid cols-3">
        <div className="card rise">
          <h2>Appointments by hospital</h2>
          <Donut rows={byHospital.map((h) => ({ label: h.name, value: h.appointments }))} center={<><strong>{byHospital.reduce((s, h) => s + h.appointments, 0)}</strong><small>visits</small></>} />
        </div>
        <div className="card rise" style={{ animationDelay: '70ms' }}>
          <h2>Patients by hospital</h2>
          <Bars rows={byHospital.map((h) => ({ label: h.name, value: h.patients }))} />
        </div>
        <div className="card rise" style={{ animationDelay: '140ms' }}>
          <h2>Collected revenue</h2>
          <Bars rows={byHospital.map((h) => ({ label: `${h.name} (${h.currency})`, value: h.revenue }))} />
        </div>
      </div>

      <div className="card mt rise">
        <h2>Top diagnoses (opted-in patients)</h2>
        {diagnoses.length ? <Bars rows={diagnoses} /> : <Empty icon="stethoscope" title="Not enough opted-in data yet" />}
      </div>
    </>
  );
}
