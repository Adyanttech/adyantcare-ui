import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useBranding } from '../brand';
import { AreaChart } from '../charts';
import { Icon } from '../icons';
import { HospitalMark } from '../Logo';
import { Badge, Empty, Status, StatCard, day, greeting, money, shortDay, startOfToday, todayLabel, todayWindow, useLoad } from '../ui';
import type { AppointmentRow, Dashboard as DashboardData, Hospital, LabOrder, PortalRecord, Report } from '../types';

const TONE: Record<string, string> = { BOOKED: '', CHECKED_IN: 'warn', COMPLETED: 'ok', CANCELLED: 'bad' };

// Welcome banner. Hospital users see their own banner image; everyone else gets the AdyantCare look.
function Hero({ title, sub, cover, children }: { title: string; sub?: ReactNode; cover?: string | null; children?: ReactNode }) {
  const style = cover
    ? { backgroundImage: `linear-gradient(105deg, rgba(4,16,30,.82) 8%, rgba(4,16,30,.35) 70%), url("${cover}")` }
    : undefined;
  return (
    <section className={`hero rise ${cover ? 'has-cover' : ''}`} style={style}>
      <div className="hero-body">
        <span className="hero-date"><Icon name="calendar" size={14} /> {todayLabel()}</span>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
        {children && <div className="hero-actions">{children}</div>}
      </div>
    </section>
  );
}

function UpNext({ rows, doctor }: { rows: AppointmentRow[]; doctor: boolean }) {
  const list = rows.filter((a) => a.status === 'BOOKED' || a.status === 'CHECKED_IN').slice(0, 6);
  if (!list.length) return <Empty icon="calendar" title="Nothing scheduled" text="New appointments will show up here." />;
  return (
    <ul className="timeline">
      {list.map((a) => {
        const d = new Date(a.scheduledAt);
        return (
          <li key={a.id} className={a.status === 'CHECKED_IN' ? 'live' : ''}>
            <div className="tl-time">
              <b>{d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</b>
              <span>{d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="tl-body">
              <strong>{a.patientName}</strong>
              <span>{a.reason || 'Consultation'}{doctor ? '' : ` · ${a.doctorName}`}</span>
            </div>
            <Badge tone={TONE[a.status]}>{a.status.replace('_', ' ')}</Badge>
            {doctor && <Link className="btn sm" to={`/consult/${a.id}`}>Consult</Link>}
          </li>
        );
      })}
    </ul>
  );
}

function Quick({ items }: { items: { to: string; icon: Parameters<typeof Icon>[0]['name']; label: string; text: string }[] }) {
  return (
    <div className="quick">
      {items.map((q) => (
        <Link key={q.to + q.label} to={q.to} className="quick-item">
          <span><Icon name={q.icon} size={20} /></span>
          <div><strong>{q.label}</strong><small>{q.text}</small></div>
          <Icon name="arrowright" size={16} />
        </Link>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const role = user?.role;
  const cur = user?.hospital?.currency;
  const first = (user?.name ?? '').replace(/^(Dr\.?)\s+/i, 'Dr. ').split(/\s+/).slice(0, 2).join(' ');

  const dash = useLoad<DashboardData>(['dashboard'], () => api.get(`/dashboard?${todayWindow()}`));
  const from = encodeURIComponent(startOfToday().toISOString());
  const staffView = role === 'ADMIN' || role === 'FRONT_DESK' || role === 'DOCTOR';
  const appts = useLoad<{ appointments: AppointmentRow[] }>(['appointments', from], () => api.get(`/appointments?from=${from}`), staffView);
  const report = useLoad<Report>(['reports', 14], () => api.get('/reports?days=14'), role === 'ADMIN');
  const labs = useLoad<{ pending: LabOrder[]; done: LabOrder[] }>(['lab'], () => api.get('/lab'), role === 'LAB_TECH');
  const hospitals = useLoad<{ hospitals: Hospital[] }>(['hospitals'], () => api.get('/hospitals'), role === 'SUPER_ADMIN');
  const record = useLoad<PortalRecord>(['my-record'], () => api.get('/me/record'), role === 'PATIENT');

  const s = dash.data?.stats;
  const hospital = user?.hospital;
  const heroSub = hospital
    ? <>{hospital.name}, {hospital.city}{(branding?.tagline ?? hospital.tagline) ? <> · <em>{branding?.tagline ?? hospital.tagline}</em></> : null}</>
    : role === 'SUPER_ADMIN' ? 'Platform overview across every hospital' : 'Your health, in one place';

  const apptSpark = report.data?.appointmentsByDay.map((p) => p.value);
  const revSpark = report.data?.revenueByDay.map((p) => p.value);

  return (
    <>
      <Hero title={`${greeting()}, ${first || 'there'}`} sub={heroSub} cover={hospital ? branding?.coverData : null}>
        {role === 'ADMIN' && <><Link className="btn light" to="/reports"><Icon name="file" size={16} /> View reports</Link><Link className="btn ghost-light" to="/branding"><Icon name="palette" size={16} /> Brand your app</Link></>}
        {role === 'FRONT_DESK' && <><Link className="btn light" to="/patients"><Icon name="plus" size={16} /> Register patient</Link><Link className="btn ghost-light" to="/appointments">Book appointment</Link></>}
        {role === 'DOCTOR' && <Link className="btn light" to="/appointments"><Icon name="stethoscope" size={16} /> Open my queue</Link>}
        {role === 'LAB_TECH' && <Link className="btn light" to="/lab"><Icon name="flask" size={16} /> Open lab queue</Link>}
        {role === 'PATIENT' && <Link className="btn light" to="/my"><Icon name="heart" size={16} /> Open my health record</Link>}
        {role === 'SUPER_ADMIN' && <><Link className="btn light" to="/hospitals"><Icon name="hospital" size={16} /> Manage hospitals</Link><Link className="btn ghost-light" to="/insights">View insights</Link></>}
      </Hero>

      <Status loading={dash.loading} error={dash.error} />

      {s && role === 'SUPER_ADMIN' && (
        <>
          <div className="grid cols-4">
            <StatCard icon="hospital" label="Hospitals" value={s.hospitals ?? 0} tone="brand" delay={60} />
            <StatCard icon="users" label="Unique people" value={s.people ?? 0} tone="violet" delay={120} />
            <StatCard icon="heart" label="Hospital patient records" value={s.patientRecords ?? 0} tone="rose" delay={180} />
            <StatCard icon="calendar" label="Appointments (all time)" value={s.appointments ?? 0} tone="amber" delay={240} />
          </div>
          <h2 className="section">Hospitals on the platform</h2>
          <div className="grid cols-3">
            {hospitals.data?.hospitals.map((h, i) => (
              <div key={h.id} className="card hosp rise" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="hosp-top">
                  <HospitalMark name={h.name} size={46} />
                  <div><strong>{h.name}</strong><small>{h.city} · {h.code} · {h.country}</small></div>
                  <Badge tone={h.active ? 'ok' : 'bad'}>{h.active ? 'Active' : 'Disabled'}</Badge>
                </div>
                <div className="hosp-stats">
                  <div><b>{h.userCount}</b><span>Users</span></div>
                  <div><b>{h.patientCount}</b><span>Patients</span></div>
                  <div><b>{h.appointmentCount}</b><span>Visits</span></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {s && role === 'PATIENT' && (
        <>
          <div className="grid cols-4">
            <StatCard icon="hospital" label="Hospitals" value={s.hospitals ?? 0} tone="brand" delay={60} />
            <StatCard icon="calendar" label="Upcoming appointments" value={s.upcoming ?? 0} tone="violet" delay={120} />
          </div>
          <div className="grid cols-2 mt">
            <div className="card rise">
              <h2>Upcoming appointments</h2>
              {(() => {
                const up = (record.data?.appointments ?? []).filter((a) => (a.status === 'BOOKED' || a.status === 'CHECKED_IN') && new Date(a.scheduledAt) >= new Date());
                if (!up.length) return <Empty icon="calendar" title="Nothing booked" text="Your next visit will appear here." />;
                return (
                  <ul className="timeline">
                    {up.slice(0, 4).map((a) => (
                      <li key={a.id}>
                        <div className="tl-time"><b>{new Date(a.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</b><span>{day(a.scheduledAt)}</span></div>
                        <div className="tl-body"><strong>{a.hospitalName}</strong><span>{a.doctorName}{a.reason ? ` · ${a.reason}` : ''}</span></div>
                        <Badge tone={TONE[a.status]}>{a.status.replace('_', ' ')}</Badge>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
            <div className="card rise" style={{ animationDelay: '80ms' }}>
              <h2>Latest lab results</h2>
              {(() => {
                const ls = (record.data?.labs ?? []).filter((l) => l.status === 'COMPLETED').slice(0, 4);
                if (!ls.length) return <Empty icon="flask" title="No results yet" text="Lab results show up here once ready." />;
                return (
                  <ul className="timeline">
                    {ls.map((l) => (
                      <li key={l.id}>
                        <span className="tl-dot ok"><Icon name="check" size={14} /></span>
                        <div className="tl-body"><strong>{l.test}</strong><span>{l.hospitalName}{l.result ? ` · ${l.result}` : ''}</span></div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {s && role === 'LAB_TECH' && (
        <>
          <div className="grid cols-4">
            <StatCard icon="flask" label="Pending orders" value={s.pending ?? 0} tone="amber" delay={60} />
            <StatCard icon="check" label="Completed today" value={s.doneToday ?? 0} tone="green" delay={120} />
          </div>
          <div className="card mt rise">
            <div className="between"><h2>Next in the queue</h2><Link className="btn ghost sm" to="/lab">Open queue</Link></div>
            {labs.data && labs.data.pending.length === 0 && <Empty icon="check" title="All caught up" text="No pending lab orders." />}
            <ul className="timeline">
              {labs.data?.pending.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <span className="tl-dot"><Icon name="flask" size={14} /></span>
                  <div className="tl-body"><strong>{l.test}</strong><span>{l.patientName} · {l.mrn}</span></div>
                  <span className="muted">{day(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {s && role === 'DOCTOR' && (
        <>
          <div className="grid cols-4">
            <StatCard icon="calendar" label="Appointments today" value={s.today ?? 0} tone="brand" delay={60} />
            <StatCard icon="clock" label="Checked in, waiting" value={s.waiting ?? 0} tone="amber" delay={120} />
            <StatCard icon="check" label="Consultations completed" value={s.completed ?? 0} tone="green" delay={180} />
          </div>
          <div className="card mt rise">
            <div className="between"><h2>Your queue</h2><Link className="btn ghost sm" to="/appointments">See all</Link></div>
            <UpNext rows={appts.data?.appointments ?? []} doctor />
          </div>
        </>
      )}

      {s && (role === 'ADMIN' || role === 'FRONT_DESK') && (
        <>
          <div className="grid cols-5">
            <StatCard icon="calendar" label="Appointments today" value={s.today ?? 0} tone="brand" spark={apptSpark} delay={40} />
            <StatCard icon="heart" label="Registered patients" value={s.patients ?? 0} tone="rose" delay={100} />
            <StatCard icon="stethoscope" label="Active doctors" value={s.doctors ?? 0} tone="violet" delay={160} />
            <StatCard icon="receipt" label="Unpaid invoices" value={s.unpaidInvoices ?? 0} tone="amber" delay={220} />
            <StatCard icon="wallet" label="Collected revenue" value={s.revenue ?? 0} format={(n) => money(n, cur)} tone="green" spark={revSpark} delay={280} />
          </div>

          {role === 'ADMIN' && report.data && (
            <div className="grid cols-2 mt">
              <div className="card rise">
                <div className="between"><h2>Appointments</h2><span className="muted">Last 14 days</span></div>
                <AreaChart data={report.data.appointmentsByDay.map((p) => ({ label: shortDay(p.date), value: p.value }))} />
              </div>
              <div className="card rise" style={{ animationDelay: '80ms' }}>
                <div className="between"><h2>Collected revenue</h2><span className="muted">Last 14 days</span></div>
                <AreaChart data={report.data.revenueByDay.map((p) => ({ label: shortDay(p.date), value: p.value }))} color="#10b981" format={(n) => money(n, cur)} />
              </div>
            </div>
          )}

          <div className="grid cols-2-1 mt">
            <div className="card rise">
              <div className="between"><h2>Up next</h2><Link className="btn ghost sm" to="/appointments">All appointments</Link></div>
              <UpNext rows={appts.data?.appointments ?? []} doctor={false} />
            </div>
            <div className="card rise" style={{ animationDelay: '80ms' }}>
              <h2>Quick actions</h2>
              <Quick items={[
                { to: '/patients', icon: 'plus', label: 'Register a patient', text: 'Links existing people by phone' },
                { to: '/appointments', icon: 'calendar', label: 'Book an appointment', text: 'Pick a doctor and time' },
                { to: '/billing', icon: 'receipt', label: 'Collect payment', text: 'Mark invoices as paid' },
                ...(role === 'ADMIN' ? [{ to: '/reports', icon: 'file' as const, label: 'Open reports', text: 'Trends, revenue, doctors' }] : []),
              ]} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
