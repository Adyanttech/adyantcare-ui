import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Reminders from '../pages/Reminders';
import { api } from '../api';
import { renderPage, respond } from '../test/utils';

vi.mock('../api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } }));

const DEFAULT = 'Hi {patient}, reminder: {doctor} at {hospital} on {date} at {time}.';
const settings = (over = {}) => ({
  enabled: true, dayBeforeEnabled: true, dayBeforeHours: 24, shortEnabled: true, shortHours: 3,
  template: DEFAULT, defaultTemplate: DEFAULT, jobEnabled: true, ...over,
});

function setup(s = settings(), items: unknown[] = []) {
  const table = { '/reminders/settings': s, '/reminders/log': { items } };
  vi.mocked(api.get).mockImplementation(async (p: string) => respond(table, p) as never);
  vi.mocked(api.put).mockImplementation(async (_p: string, body: unknown) => ({ ...s, ...(body as object), template: (body as { template: string }).template || DEFAULT, defaultTemplate: DEFAULT }) as never);
  return renderPage(<Reminders />);
}

beforeEach(() => vi.clearAllMocks());

describe('<Reminders>', () => {
  it('loads the settings into the form', async () => {
    setup();
    expect(await screen.findByLabelText(/Send appointment reminders/)).toBeChecked();
    expect(screen.getByLabelText('Message')).toHaveValue(DEFAULT);
  });

  it('warns when the server job is off, and not when it is on', async () => {
    const { unmount } = setup(settings({ jobEnabled: false }));
    expect(await screen.findByText(/reminder job is switched off/)).toBeInTheDocument();
    unmount();
    setup();
    await screen.findByLabelText('Message');
    expect(screen.queryByText(/reminder job is switched off/)).not.toBeInTheDocument();
  });

  it('previews the message with sample values', async () => {
    setup();
    await screen.findByLabelText('Message');
    expect(screen.getByLabelText('Message preview')).toHaveTextContent('Hi Ravi, reminder: Dr. Meera Iyer at Your hospital on Mon, 16 Nov at 10:30 AM.');
  });

  it('blocks saving an unknown placeholder', async () => {
    setup();
    const box = await screen.findByLabelText('Message');
    fireEvent.change(box, { target: { value: 'Hello {nurse}' } });
    expect(screen.getByRole('alert')).toHaveTextContent('{nurse}');
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  });

  it('blocks saving when the short reminder is not closer than the early one', async () => {
    setup(settings({ dayBeforeHours: 12, shortHours: 6 }));
    await screen.findByLabelText('Message');
    expect(screen.queryByText(/must be closer to the visit/)).not.toBeInTheDocument();
    const early = screen.getAllByRole('combobox')[0];
    fireEvent.change(early, { target: { value: '12' } });
    const short = screen.getAllByRole('combobox')[1];
    expect(short).toHaveValue('6');
  });

  it('shows the closeness error when the saved values clash', async () => {
    setup(settings({ dayBeforeHours: 3, shortHours: 6 }));
    expect(await screen.findByText(/must be closer to the visit/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  });

  it('saves the changed settings and sends an empty template when it is the standard one', async () => {
    setup();
    await screen.findByLabelText('Message');
    await userEvent.click(screen.getByLabelText(/Short-notice reminder/));
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put).toHaveBeenCalledWith('/reminders/settings', expect.objectContaining({ shortEnabled: false, dayBeforeHours: 24, template: '' }));
    expect(await screen.findByText('Reminder settings saved')).toBeInTheDocument();
  });

  it('sends a custom template as typed', async () => {
    setup();
    const box = await screen.findByLabelText('Message');
    fireEvent.change(box, { target: { value: 'See you {patient} at {time}' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/reminders/settings', expect.objectContaining({ template: 'See you {patient} at {time}' })));
  });

  it('restores the standard message', async () => {
    setup(settings({ template: 'Custom {patient}' }));
    const box = await screen.findByLabelText('Message');
    expect(box).toHaveValue('Custom {patient}');
    await userEvent.click(screen.getByRole('button', { name: 'Use the standard message' }));
    expect(box).toHaveValue(DEFAULT);
  });

  it('disables the detail fields when reminders are switched off', async () => {
    setup(settings({ enabled: false }));
    await screen.findByLabelText('Message');
    expect(screen.getByLabelText('Message')).toBeDisabled();
    expect(screen.getByLabelText(/Early reminder/)).toBeDisabled();
  });

  it('shows the log and an empty state', async () => {
    setup(settings(), [{ id: 'r1', appointmentAt: '2026-11-21T04:30:00Z', patientName: 'Ravi Kumar', mrn: 'SUN-1', kind: 'DAY_BEFORE', status: 'SENT', sentAt: '2026-11-20T04:30:00Z', error: null },
      { id: 'r2', appointmentAt: '2026-11-21T04:30:00Z', patientName: 'Sunita', mrn: 'SUN-2', kind: 'SHORT_NOTICE', status: 'FAILED', sentAt: null, error: 'Gateway down' }]);
    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Day before')).toBeInTheDocument();
    expect(screen.getByText('Short notice')).toBeInTheDocument();
    expect(screen.getByText('SENT')).toHaveClass('ok');
    expect(screen.getByText('FAILED')).toHaveClass('bad');
    expect(screen.getByText('Gateway down')).toBeInTheDocument();
  });

  it('says so when nothing was sent', async () => {
    setup();
    expect(await screen.findByText('No reminders sent yet.')).toBeInTheDocument();
  });
});
