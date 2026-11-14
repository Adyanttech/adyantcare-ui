import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Avatar, Badge, ContactField, NationalIdField, PhoneField, Status, ToastProvider, dt, day, getDisplayZone, money,
  setDisplayZone, shortDay, startOfToday, todayIn, todayWindow, useAction, whoBody, zoneForCurrency,
} from '../ui';

describe('time zones', () => {
  it('maps a hospital currency to its time zone', () => {
    expect(zoneForCurrency('INR')).toBe('Asia/Kolkata');
    expect(zoneForCurrency('USD')).toBe('America/New_York');
    expect(zoneForCurrency('EUR')).toBeUndefined();
    expect(zoneForCurrency(null)).toBeUndefined();
    expect(zoneForCurrency(undefined)).toBeUndefined();
  });

  it('remembers the display zone that was set', () => {
    expect(getDisplayZone()).toBeUndefined();
    setDisplayZone('Asia/Kolkata');
    expect(getDisplayZone()).toBe('Asia/Kolkata');
  });

  it('shows date and time in the hospital zone, not the browser zone', () => {
    const instant = '2026-11-21T04:30:00Z';   // 10:00 in India, 23:30 the evening before in New York
    setDisplayZone('Asia/Kolkata');
    expect(dt(instant)).toMatch(/10:00/);
    expect(day(instant)).toMatch(/21/);
    setDisplayZone('America/New_York');
    expect(dt(instant)).toMatch(/11:30/);
    expect(day(instant)).toMatch(/20/);
  });

  it('todayIn gives yyyy-mm-dd', () => {
    expect(todayIn('Asia/Kolkata')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayIn()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('todayIn follows the zone: just after midnight UTC it is already tomorrow in India but still yesterday in New York', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T20:00:00Z'));   // 01:30 on the 21st in India, 15:00 on the 20th in New York
    expect(todayIn('Asia/Kolkata')).toBe('2026-11-21');
    expect(todayIn('America/New_York')).toBe('2026-11-20');
  });
});

describe('formatting helpers', () => {
  it('formats rupees and dollars with no decimals', () => {
    expect(money(1200, 'INR')).toMatch(/₹\s?1,200$/);
    expect(money(1200, 'USD')).toBe('$1,200');
    expect(money(1234567, 'INR')).toMatch(/12,34,567/);   // Indian digit grouping
  });
  it('treats a missing amount as zero', () => {
    expect(money(0)).toMatch(/0$/);
    expect(money(Number.NaN, 'USD')).toBe('$0');
  });
  it('shortDay shows day and month', () => {
    expect(shortDay('2026-11-21')).toMatch(/21/);
  });
  it('startOfToday is local midnight', () => {
    const d = startOfToday();
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });
  it('todayWindow spans exactly one day', () => {
    const q = new URLSearchParams(todayWindow());
    const from = new Date(q.get('from')!).getTime();
    const to = new Date(q.get('to')!).getTime();
    expect(to - from).toBeGreaterThanOrEqual(23 * 3_600_000);
    expect(to - from).toBeLessThanOrEqual(25 * 3_600_000);   // a daylight saving change makes a day 23 or 25 hours
  });
});

describe('whoBody', () => {
  it('uses the trimmed email when signing in by email', () => {
    expect(whoBody('email', 'IN', '9000000001', '  a@b.com ')).toEqual({ email: 'a@b.com' });
  });
  it('uses country and phone when signing in by mobile', () => {
    expect(whoBody('mobile', 'US', '4045550101', 'ignored@x.com')).toEqual({ country: 'US', phone: '4045550101' });
  });
});

describe('small components', () => {
  it('Avatar shows initials without the title', () => {
    const { rerender } = render(<Avatar name="Dr. Meera Iyer" />);
    expect(screen.getByText('MI')).toBeInTheDocument();
    rerender(<Avatar name="Ravi" />);
    expect(screen.getByText('R')).toBeInTheDocument();
    rerender(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('Badge shows its text with the tone class', () => {
    render(<Badge tone="ok">Done</Badge>);
    expect(screen.getByText('Done')).toHaveClass('badge', 'ok');
  });

  it('Status shows a busy placeholder while loading', () => {
    render(<Status loading error="" />);
    expect(screen.getByLabelText('Loading')).toHaveAttribute('aria-busy', 'true');
  });
  it('Status shows an error message', () => {
    render(<Status loading={false} error="Cannot reach the server." />);
    expect(screen.getByText('Cannot reach the server.')).toBeInTheDocument();
  });
  it('Status shows nothing when all is well', () => {
    const { container } = render(<Status loading={false} error="" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('NationalIdField', () => {
  it('asks for an Aadhaar in India', () => {
    render(<NationalIdField country="IN" value="" setValue={() => {}} />);
    expect(screen.getByLabelText(/Aadhaar number/)).toHaveAttribute('placeholder', '12 digits');
    expect(screen.getByText(/Only the last 4 digits are kept/)).toBeInTheDocument();
  });
  it('asks for an SSN in the US', () => {
    render(<NationalIdField country="US" value="" setValue={() => {}} />);
    expect(screen.getByLabelText(/Social Security Number/)).toHaveAttribute('placeholder', '9 digits');
  });
  it('reports what is typed', async () => {
    const setValue = vi.fn();
    render(<NationalIdField country="IN" value="" setValue={setValue} />);
    await userEvent.type(screen.getByLabelText(/Aadhaar number/), '7');
    expect(setValue).toHaveBeenCalledWith('7');
  });
  it('is required', () => {
    render(<NationalIdField country="IN" value="" setValue={() => {}} />);
    expect(screen.getByLabelText(/Aadhaar number/)).toBeRequired();
  });
});

describe('PhoneField', () => {
  it('offers India and the United States and reports a change', async () => {
    const setCountry = vi.fn();
    render(<PhoneField country="IN" setCountry={setCountry} phone="" setPhone={() => {}} />);
    expect(screen.getByRole('option', { name: 'India (+91)' })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Country code'), 'US');
    expect(setCountry).toHaveBeenCalledWith('US');
  });
});

describe('ContactField', () => {
  function Harness() {
    const [method, setMethod] = useState<'mobile' | 'email'>('mobile');
    const [country, setCountry] = useState<'IN' | 'US'>('IN');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    return <ContactField method={method} setMethod={setMethod} country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} email={email} setEmail={setEmail} />;
  }

  it('starts on mobile and switches to email and back', async () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: /Mobile/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText('10-digit number')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Email/ }));
    expect(screen.getByRole('tab', { name: /Email/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText('you@hospital.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('10-digit number')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Mobile/ }));
    expect(screen.getByPlaceholderText('10-digit number')).toBeInTheDocument();
  });

  it('keeps what was typed in each field', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByPlaceholderText('10-digit number'), '9000000001');
    expect(screen.getByPlaceholderText('10-digit number')).toHaveValue('9000000001');
    await userEvent.click(screen.getByRole('tab', { name: /Email/ }));
    await userEvent.type(screen.getByPlaceholderText('you@hospital.com'), 'a@b.com');
    await userEvent.click(screen.getByRole('tab', { name: /Mobile/ }));
    expect(screen.getByPlaceholderText('10-digit number')).toHaveValue('9000000001');
  });
});

describe('useAction and toasts', () => {
  function Button({ fn, message }: { fn: () => Promise<string>; message?: string }) {
    const act = useAction();
    const [result, setResult] = useState('idle');
    return <button onClick={async () => setResult(String(await act(fn, message)))}>{`run:${result}`}</button>;
  }

  it('shows the success message and returns the result', async () => {
    render(<ToastProvider><Button fn={async () => 'done'} message="Saved" /></ToastProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('run:done');
  });

  it('shows no toast on success when there is no message', async () => {
    render(<ToastProvider><Button fn={async () => 'quiet'} /></ToastProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('run:quiet')).toBeInTheDocument();
    expect(document.querySelector('.toast')).toBeNull();
  });

  it('shows the error and returns null on failure', async () => {
    render(<ToastProvider><Button fn={async () => { throw new Error('That slot was just taken.'); }} message="Booked" /></ToastProvider>);
    await userEvent.click(screen.getByRole('button'));
    const toast = await screen.findByText('That slot was just taken.');
    expect(toast).toHaveClass('toast', 'bad');
    expect(screen.queryByText('Booked')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('run:null');
  });
});
