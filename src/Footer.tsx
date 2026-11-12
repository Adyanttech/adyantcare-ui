import { Icon } from './icons';
import { Logo } from './Logo';

const SITE = 'https://www.adyanttech.com';

export default function Footer({ variant = 'app' }: { variant?: 'app' | 'auth' }) {
  const year = new Date().getFullYear();

  if (variant === 'app') {
    return (
      <footer className="foot">
        <span>© {year} Adyant Technologies LLC · AdyantCare</span>
        <span className="foot-links">
          <a href={SITE} target="_blank" rel="noreferrer">Adyant Technologies</a>
          <span><Icon name="shieldcheck" size={14} /> Privacy-first by design</span>
          <span>Made in Atlanta · Hyderabad</span>
        </span>
      </footer>
    );
  }

  return (
    <footer className="foot-auth">
      <div className="foot-auth-grid">
        <div className="foot-brand">
          <Logo size={34} tone="light" />
          <p>Modern hospital management for clinics and multi-specialty hospitals. One platform, every role, your own brand.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <ul>
            <li>Appointments and queues</li>
            <li>Consultations and prescriptions</li>
            <li>Lab and diagnostics</li>
            <li>Billing and reports</li>
          </ul>
        </div>
        <div>
          <h4>Trust</h4>
          <ul>
            <li>Role-based access</li>
            <li>Hospital-level data isolation</li>
            <li>Activity audit trail</li>
            <li>Encrypted in transit</li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href={SITE} target="_blank" rel="noreferrer">Adyant Technologies <Icon name="arrowright" size={13} /></a></li>
            <li>Atlanta, Georgia · Hyderabad, India</li>
          </ul>
        </div>
      </div>
      <div className="foot-auth-bar">
        <span>© {year} Adyant Technologies LLC. All rights reserved.</span>
        <span>AdyantCare is a product of Adyant Technologies.</span>
      </div>
    </footer>
  );
}
