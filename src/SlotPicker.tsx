import { getDisplayZone } from './ui';
import type { Slot } from './types';

export const timeLabel = (iso: string, zone?: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: zone ?? getDisplayZone() });
export const dayLabel = (iso: string, zone?: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: zone ?? getDisplayZone() });

// yyyy-mm-dd of the slot's day in the given zone, used to group slots under one heading
const dayKey = (iso: string, zone?: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: zone ?? getDisplayZone(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

/** Slots (already in time order) grouped by local calendar day. */
export function groupByDay(slots: Slot[], zone?: string) {
  const groups: { key: string; label: string; items: Slot[] }[] = [];
  for (const s of slots) {
    const key = dayKey(s.startsAt, zone);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(s);
    else groups.push({ key, label: dayLabel(s.startsAt, zone), items: [s] });
  }
  return groups;
}

/** Pick one open time, grouped by day. */
export default function SlotPicker({ slots, value, onChange, empty, timeZone }: {
  slots: Slot[]; value: string; onChange: (id: string) => void; empty: string; timeZone?: string;
}) {
  const groups = groupByDay(slots, timeZone);
  if (groups.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="slotdays">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="slotday-h">{g.label}</div>
          <div className="slotgrid">
            {g.items.map((s) => (
              <button key={s.id} type="button" className={`slot ${value === s.id ? 'on' : ''}`} aria-pressed={value === s.id} onClick={() => onChange(s.id)}>
                {timeLabel(s.startsAt, timeZone)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
