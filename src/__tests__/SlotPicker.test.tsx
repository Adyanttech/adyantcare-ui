import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SlotPicker, { dayLabel, groupByDay, timeLabel } from '../SlotPicker';
import { setDisplayZone } from '../ui';
import type { Slot } from '../types';

const slot = (id: string, startsAt: string): Slot => ({
  id, doctorId: 'd1', doctorName: 'Dr. Meera', startsAt, endsAt: startsAt, status: 'OPEN', patientName: null, mrn: null, appointmentId: null,
});

// 04:30Z is 10:00 in India (UTC+5:30) and 23:30 the evening before in New York (UTC-5 in November)
const A = slot('a', '2026-11-21T04:30:00Z');
const B = slot('b', '2026-11-21T05:00:00Z');
const C = slot('c', '2026-11-23T04:30:00Z');

describe('timeLabel and dayLabel', () => {
  it('use the zone given', () => {
    expect(timeLabel(A.startsAt, 'Asia/Kolkata')).toMatch(/10:00/);
    expect(timeLabel(A.startsAt, 'America/New_York')).toMatch(/11:30/);
    expect(dayLabel(A.startsAt, 'Asia/Kolkata')).toMatch(/21/);
    expect(dayLabel(A.startsAt, 'America/New_York')).toMatch(/20/);
  });
  it('fall back to the display zone set for the signed-in hospital', () => {
    setDisplayZone('Asia/Kolkata');
    expect(timeLabel(A.startsAt)).toMatch(/10:00/);
  });
  it('a zone passed in wins over the display zone', () => {
    setDisplayZone('Asia/Kolkata');
    expect(timeLabel(A.startsAt, 'America/New_York')).toMatch(/11:30/);
  });
});

describe('groupByDay', () => {
  it('puts slots on the same day under one heading and starts a new one for the next day', () => {
    const groups = groupByDay([A, B, C], 'Asia/Kolkata');
    expect(groups.map((g) => g.items.map((s) => s.id))).toEqual([['a', 'b'], ['c']]);
  });
  it('groups by the hospital calendar day, not the browser day', () => {
    const lateEvening = slot('x', '2026-11-20T18:00:00Z');   // 23:30 on the 20th in India
    const afterMidnight = slot('y', '2026-11-20T18:45:00Z');  // 00:15 on the 21st in India
    expect(groupByDay([lateEvening, afterMidnight], 'Asia/Kolkata')).toHaveLength(2);
    expect(groupByDay([lateEvening, afterMidnight], 'America/New_York')).toHaveLength(1);
  });
  it('returns nothing for no slots', () => {
    expect(groupByDay([], 'Asia/Kolkata')).toEqual([]);
  });
});

describe('<SlotPicker>', () => {
  it('shows a heading per day and a button per time', () => {
    render(<SlotPicker slots={[A, B, C]} value="" onChange={() => {}} empty="none" timeZone="Asia/Kolkata" />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /10:00/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /10:30/ })).toBeInTheDocument();
    expect(screen.getByText(dayLabel(A.startsAt, 'Asia/Kolkata'))).toBeInTheDocument();
    expect(screen.getByText(dayLabel(C.startsAt, 'Asia/Kolkata'))).toBeInTheDocument();
  });

  it('shows the times in the zone it is given', () => {
    render(<SlotPicker slots={[A]} value="" onChange={() => {}} empty="none" timeZone="America/New_York" />);
    expect(screen.getByRole('button')).toHaveTextContent(/11:30/);
  });

  it('marks the chosen time', () => {
    render(<SlotPicker slots={[A, B]} value="b" onChange={() => {}} empty="none" timeZone="Asia/Kolkata" />);
    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveAttribute('aria-pressed', 'false');
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveClass('on');
  });

  it('reports the slot that was clicked', async () => {
    const onChange = vi.fn();
    render(<SlotPicker slots={[A, B]} value="" onChange={onChange} empty="none" timeZone="Asia/Kolkata" />);
    await userEvent.click(screen.getByRole('button', { name: /10:30/ }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('buttons never submit a surrounding form', () => {
    render(<form><SlotPicker slots={[A]} value="" onChange={() => {}} empty="none" timeZone="Asia/Kolkata" /></form>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('shows the empty message when there are no slots', () => {
    render(<SlotPicker slots={[]} value="" onChange={() => {}} empty="No open times in the next 30 days." />);
    expect(screen.getByText('No open times in the next 30 days.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps each day in its own group', () => {
    const { container } = render(<SlotPicker slots={[A, B, C]} value="" onChange={() => {}} empty="none" timeZone="Asia/Kolkata" />);
    const grids = container.querySelectorAll('.slotgrid');
    expect(grids).toHaveLength(2);
    expect(within(grids[0] as HTMLElement).getAllByRole('button')).toHaveLength(2);
    expect(within(grids[1] as HTMLElement).getAllByRole('button')).toHaveLength(1);
  });
});
