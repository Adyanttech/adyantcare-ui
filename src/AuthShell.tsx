import type { ReactNode } from 'react';
import Footer from './Footer';
import { Icon, type IconName } from './icons';
import { Logo } from './Logo';

const FEATURES: [IconName, string, string][] = [
  ['phone', 'Mobile or email sign-in', 'No usernames to remember. Sign in with a mobile number or email, by password or one-time code.'],
  ['palette', 'Your hospital, your brand', 'Your logo, banner and colours appear the moment your team signs in.'],
  ['chart', 'Insights that matter', 'Live dashboards and reports for admins, doctors, lab and front desk.'],
];

// The floating "holographic" login panel with live-looking widgets around it.
function HoloVisual() {
  return (
    <div className="holo" aria-hidden="true">
      <div className="holo-glow" />
      <div className="holo-frame">
        <div className="holo-shield">
          <svg viewBox="0 0 64 72" width="84" height="94">
            <defs>
              <linearGradient id="hs" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7ef0e4" />
                <stop offset="1" stopColor="#7aa2ff" />
              </linearGradient>
            </defs>
            <path d="M32 4 58 14v20c0 17-11 28-26 34C17 62 6 51 6 34V14z" fill="rgba(255,255,255,.08)" stroke="url(#hs)" strokeWidth="2.5" />
            <rect x="21" y="32" width="22" height="18" rx="4" fill="none" stroke="#fff" strokeWidth="3" />
            <path d="M25 32v-5a7 7 0 0 1 14 0v5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="41" r="2.6" fill="#7ef0e4" />
          </svg>
        </div>
        <div className="holo-line w1" />
        <div className="holo-line w2"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="holo-btn">LOGIN</div>
        <svg className="holo-ecg" viewBox="0 0 300 40" preserveAspectRatio="none">
          <path d="M0 22h70l12-16 14 32 12-16h40l10-10 10 20 8-10h124" fill="none" stroke="#7ef0e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="float-card f1">
        <span className="fc-icon"><Icon name="calendar" size={16} /></span>
        <div><small>Appointments today</small><b>128</b></div>
        <span className="fc-up"><Icon name="trendup" size={13} /> 12%</span>
      </div>
      <div className="float-card f2">
        <span className="fc-icon green"><Icon name="check" size={16} /></span>
        <div><small>Lab results ready</small><b>24</b></div>
      </div>
      <div className="float-card f3">
        <span className="fc-icon amber"><Icon name="heart" size={16} /></span>
        <div><small>Patients seen this week</small><b>1,284</b></div>
      </div>
    </div>
  );
}

// Shared look for the signed-out pages: animated aurora background, hero on the left, card on the right.
export default function AuthShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className="auth">
      <div className="auth-bg" aria-hidden="true">
        <i className="orb o1" /><i className="orb o2" /><i className="orb o3" />
        <div className="auth-grid" />
      </div>

      <header className="auth-top">
        <Logo size={38} tone="light" />
        <a className="auth-site" href="https://www.adyanttech.com" target="_blank" rel="noreferrer">adyanttech.com <Icon name="arrowright" size={14} /></a>
      </header>

      <div className={`auth-main ${compact ? 'compact' : ''}`}>
        {!compact && (
          <section className="auth-hero">
            <span className="eyebrow"><Icon name="sparkle" size={14} /> Hospital management, reimagined</span>
            <h1>One platform.<br /><em>Every hospital.</em><br />Every role.</h1>
            <p className="lead">Appointments, consultations, lab, billing and patient records in one secure workspace, branded for your hospital.</p>
            <HoloVisual />
            <ul className="features">
              {FEATURES.map(([icon, title, text]) => (
                <li key={title}>
                  <span><Icon name={icon} size={18} /></span>
                  <div><strong>{title}</strong><p>{text}</p></div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="auth-panel">{children}</section>
      </div>

      <Footer variant="auth" />
    </div>
  );
}
