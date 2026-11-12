import { useId } from 'react';

// AdyantCare logo: a rounded "A" whose crossbar is a heartbeat line, with a small coral spark.
export function LogoMark({ size = 36 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="AdyantCare">
      <defs>
        <linearGradient id={`lg${id}`} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22d3c5" />
          <stop offset=".55" stopColor="#0891b2" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#lg${id})`} />
      <path d="M17 47 32 14 47 47" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 36h4l3-7 5 14 3-7h3" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47.5" cy="15.5" r="4.2" fill="#ff7a59" />
    </svg>
  );
}

// Mark + wordmark. tone="light" is for dark backgrounds.
export function Logo({ size = 36, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  return (
    <span className={`logo ${tone}`}>
      <LogoMark size={size} />
      <span className="logo-word" style={{ fontSize: Math.round(size * 0.58) }}>
        Adyant<b>Care</b>
      </span>
    </span>
  );
}

// A hospital's own mark: its logo if it uploaded one, otherwise initials on a branded tile.
export function HospitalMark({ name, logo, size = 40 }: { name: string; logo?: string | null; size?: number }) {
  if (logo) {
    return <img className="hmark img" src={logo} alt={`${name} logo`} width={size} height={size} style={{ width: size, height: size }} />;
  }
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return (
    <span className="hmark" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-label={name}>
      {initials || 'H'}
    </span>
  );
}
