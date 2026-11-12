import { useEffect, useId, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

// Dependency-free charts (inline SVG + CSS animation). Colours come from CSS variables so
// they follow the hospital's brand colour automatically.

export const PALETTE = ['var(--brand)', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#06b6d4', '#64748b'];

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Number that counts up when it appears.
export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reducedMotion()) { setShown(value); return; }
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const n = Math.round(shown);
  return <>{format ? format(n) : n.toLocaleString()}</>;
}

// Tiny trend line for stat cards.
export function Sparkline({ values, color = 'var(--brand)' }: { values: number[]; color?: string }) {
  const id = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const W = 100, H = 30, max = Math.max(1, ...values), min = Math.min(0, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 3 - ((v - min) / (max - min || 1)) * (H - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: color, stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#sp${id})`} />
      <path d={line} className="draw" pathLength={1} fill="none" style={{ stroke: color }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface Point { label: string; value: number }

// Smooth area chart with hover tooltip.
export function AreaChart({ data, color = 'var(--brand)', height = 200, format }: {
  data: Point[]; color?: string; height?: number; format?: (n: number) => string;
}) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const fmt = format ?? ((n: number) => n.toLocaleString());
  const W = 640, H = height, padL = 6, padR = 6, padT = 16, padB = 24;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  const line = pts.map(([px, py], i) => {
    if (i === 0) return `M${px.toFixed(1)},${py.toFixed(1)}`;
    const [qx, qy] = pts[i - 1]!;
    const mx = ((qx + px) / 2).toFixed(1);
    return `C${mx},${qy.toFixed(1)} ${mx},${py.toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ');
  const area = n ? `${line} L${x(n - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z` : '';
  const ticks = n ? [0, Math.floor((n - 1) / 2), n - 1] : [];
  const h = hover !== null ? data[hover] : null;

  const onMove = (e: ReactMouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1)))));
  };

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={`ar${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: color, stopOpacity: 0.32 }} />
            <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((g) => {
          const gy = padT + (g / 3) * (H - padT - padB);
          return <line key={g} x1={padL} x2={W - padR} y1={gy} y2={gy} className="gridline" />;
        })}
        {n > 0 && <path d={area} fill={`url(#ar${id})`} className="area-in" />}
        {n > 0 && <path d={line} className="draw" pathLength={1} fill="none" style={{ stroke: color }} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 6} className="axis" textAnchor={t === 0 ? 'start' : t === n - 1 ? 'end' : 'middle'}>{data[t]?.label}</text>
        ))}
        {hover !== null && h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} className="hoverline" />
            <circle cx={x(hover)} cy={y(h.value)} r="5" className="hoverdot" style={{ stroke: color }} />
          </g>
        )}
        <rect x="0" y="0" width={W} height={H} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && h && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{fmt(h.value)}</b><span>{h.label}</span>
        </div>
      )}
    </div>
  );
}

// Donut with legend.
export function Donut({ rows, center, size = 168 }: { rows: Point[]; center?: ReactNode; size?: number }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const R = 54, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="donut">
      <div className="donut-svg" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Breakdown chart">
          <circle cx="70" cy="70" r={R} fill="none" className="donut-track" strokeWidth="16" />
          {total > 0 && rows.map((r, i) => {
            const len = (r.value / total) * C;
            const seg = (
              <circle key={r.label} cx="70" cy="70" r={R} fill="none" strokeWidth="16" strokeLinecap="butt"
                style={{ stroke: PALETTE[i % PALETTE.length] }}
                strokeDasharray={`${Math.max(0, len - 1.5)} ${C - Math.max(0, len - 1.5)}`}
                strokeDashoffset={-acc} transform="rotate(-90 70 70)" className="donut-seg" />
            );
            acc += len;
            return seg;
          })}
        </svg>
        <div className="donut-center">{center ?? <strong>{total.toLocaleString()}</strong>}</div>
      </div>
      <ul className="legend">
        {rows.map((r, i) => (
          <li key={r.label}>
            <i style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>{r.label}</span>
            <b>{r.value.toLocaleString()}</b>
            <em>{total ? Math.round((r.value / total) * 100) : 0}%</em>
          </li>
        ))}
        {rows.length === 0 && <li className="muted">No data yet.</li>}
      </ul>
    </div>
  );
}

// Vertical columns (for weekday or hour patterns).
export function Columns({ rows, height = 150 }: { rows: Point[]; height?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="columns" style={{ height }}>
      {rows.map((r, i) => (
        <div key={r.label} className="col" title={`${r.label}: ${r.value}`}>
          <span className="col-val">{r.value}</span>
          <div className="col-track">
            <div className="col-bar" style={{ height: `${Math.max(4, (r.value / max) * 100)}%`, animationDelay: `${i * 50}ms` }} />
          </div>
          <span className="col-label">{r.label}</span>
        </div>
      ))}
    </div>
  );
}
