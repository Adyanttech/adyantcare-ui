import type { SVGProps } from 'react';

// Small hand-drawn icon set (24x24, stroke based). Use: <Icon name="calendar" />
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5',
  users: 'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1.5a4 4 0 0 0-3-3.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  user: 'M19 20v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V20M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  calendar: 'M7 3v3M17 3v3M4 9h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5zM8 13h2M12 13h2M8 16.5h2',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  flask: 'M9 3h6M10 3v6L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9',
  hospital: 'M4 21V6.5L12 3l8 3.5V21M2.5 21h19M12 8v6M9 11h6M10 21v-4h4v4',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  palette: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-.8-.5-1.3-.9-1.8-.4-.6-.1-1.7 1-1.7H17a4 4 0 0 0 4-4 8.5 8.5 0 0 0-9-8.5zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01',
  heart: 'M12 20s-7.5-4.6-9-9.5A5 5 0 0 1 12 7a5 5 0 0 1 9 3.5C19.5 15.4 12 20 12 20z',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5zM12 15v2.5',
  shield: 'M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6z',
  shieldcheck: 'M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6zM8.5 12l2.5 2.5L15.5 10',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  idcard: 'M3 5h18v14H3zM7 10h3M7 14h5M15 9.5a1.5 1.5 0 1 0 0 .01M13 15h4',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  key: 'M15 7a4 4 0 1 1-3.5 6L4 20.5V17h3v-2h2v-2l2.5-.5A4 4 0 0 1 15 7zM16.5 8.5h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4',
  stethoscope: 'M5 3v5a4 4 0 0 0 8 0V3M3.5 3h3M11.5 3h3M9 12v3a5 5 0 0 0 10 0v-2M19 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  trendup: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  trenddown: 'M3 7l6 6 4-4 8 8M15 17h6v-6',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.2 7.5C3.7 9.2 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8M9.9 9.9a3 3 0 0 0 4.2 4.2',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  printer: 'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  pill: 'M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7zM8.5 8.5l7 7',
  wallet: 'M3 7h15a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2zM3 7l11-3v3M16 14h2',
  arrowright: 'M5 12h14M13 6l6 6-6 6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>;

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
