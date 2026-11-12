import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useBranding } from './brand';
import Footer from './Footer';
import { Icon, type IconName } from './icons';
import { HospitalMark, Logo, LogoMark } from './Logo';
import { Avatar, todayLabel } from './ui';
import type { Role } from './types';

type NavItem = [path: string, label: string, icon: IconName];

const NAV: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [['/dashboard', 'Overview', 'home'], ['/hospitals', 'Hospitals', 'hospital'], ['/insights', 'Insights', 'chart']],
  ADMIN: [
    ['/dashboard', 'Overview', 'home'], ['/reports', 'Reports', 'file'], ['/patients', 'Patients', 'user'],
    ['/appointments', 'Appointments', 'calendar'], ['/billing', 'Billing', 'receipt'], ['/staff', 'Staff', 'users'],
    ['/branding', 'Branding', 'palette'],
  ],
  DOCTOR: [['/dashboard', 'Overview', 'home'], ['/appointments', 'My appointments', 'calendar']],
  FRONT_DESK: [['/dashboard', 'Overview', 'home'], ['/patients', 'Patients', 'user'], ['/appointments', 'Appointments', 'calendar'], ['/billing', 'Billing', 'receipt']],
  LAB_TECH: [['/dashboard', 'Overview', 'home'], ['/lab', 'Lab orders', 'flask']],
  PATIENT: [['/dashboard', 'Overview', 'home'], ['/my', 'My health record', 'heart']],
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Platform Admin', ADMIN: 'Hospital Admin', DOCTOR: 'Doctor',
  FRONT_DESK: 'Front Desk', LAB_TECH: 'Lab Technician', PATIENT: 'Patient',
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  if (!user) return null;
  const items = NAV[user.role] || [];
  const here = items.find(([to]) => loc.pathname === to || loc.pathname.startsWith(`${to}/`));
  const title = here?.[1] ?? (loc.pathname.startsWith('/consult') ? 'Consultation' : loc.pathname === '/change-password' ? 'Change password' : '');
  const hospital = user.hospital;

  return (
    <div className={`shell ${open ? 'drawer-open' : ''}`}>
      <aside className="side">
        <div className="side-brand">
          {hospital ? (
            <>
              <HospitalMark name={hospital.name} logo={branding?.logoData} size={42} />
              <div className="side-hospital">
                <strong>{hospital.name}</strong>
                <span>{hospital.city}</span>
              </div>
            </>
          ) : (
            <Logo size={38} tone="light" />
          )}
        </div>
        {!hospital && (
          <div className="side-tenant">{user.role === 'SUPER_ADMIN' ? 'All hospitals' : 'Patient portal'}</div>
        )}

        <nav className="side-nav">
          {items.map(([to, label, icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon name={icon} size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="spacer" />

        {hospital && (
          <div className="powered">
            <LogoMark size={18} />
            <span>Powered by <b>AdyantCare</b></span>
          </div>
        )}

        <div className="me">
          <div className="me-id">
            <Avatar name={user.name} size={38} />
            <div>
              <strong>{user.name}</strong>
              <small>{ROLE_LABEL[user.role]}</small>
            </div>
          </div>
          <div className="me-actions">
            <button onClick={() => nav('/change-password')}><Icon name="key" size={15} /> Change password</button>
            <button onClick={() => { logout(); nav('/login'); }}><Icon name="logout" size={15} /> Sign out</button>
          </div>
        </div>
      </aside>

      <div className="scrim" onClick={() => setOpen(false)} />

      <div className="content">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
            <Icon name={open ? 'x' : 'menu'} size={22} />
          </button>
          <div className="topbar-title">{title}</div>
          <div className="topbar-right">
            <span className="chip"><Icon name="calendar" size={14} /> {todayLabel()}</span>
            <span className="chip role">{ROLE_LABEL[user.role]}</span>
          </div>
        </header>
        <main className="main" key={loc.pathname}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
