import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreatorSettings from './CreatorSettings';

const f = vi.hoisted(() => ({
  creator: { _id: 'creator1', username: 'qa-creator', displayName: 'QA', isPublished: false },
  mutate: vi.fn(), password: vi.fn(), error: vi.fn(), message: vi.fn(),
}));
vi.mock('convex/react', () => ({
  useConvex: () => ({}), useMutation: () => f.mutate, useAction: () => f.password,
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name === 'creators/queries:myCreator') return f.creator;
    if (name === 'users/queries:me') return { _id: 'user1', email: 'qa@example.invalid' };
    if (name === 'users/queries:hasPasswordAccount') return true;
    return undefined;
  },
}));
vi.mock('sonner', () => ({ toast: { message: f.message, error: f.error, success: vi.fn() } }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/account/EmailChangeOtpDialog', () => ({ EmailChangeOtpDialog: () => null }));
vi.mock('@/components/account/TotpManageCard', () => ({ TotpManageCard: () => null }));
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); f.creator.isPublished = false; });
afterEach(cleanup);
function view(tab: string) { return <MemoryRouter initialEntries={[`/creator/settings?tab=${tab}`]}><CreatorSettings /></MemoryRouter>; }

it.each([false, true])('uses saved public visibility (%s)', published => {
  f.creator.isPublished = published; render(view('advanced'));
  expect(screen.getByRole('switch', { name: 'Public Profile' })).toHaveAttribute('aria-checked', String(published));
});
it('persists visibility, prevents duplicate changes, and reports failure without a false state', async () => {
  f.creator.isPublished = true;
  let reject!: (e: Error) => void;
  f.mutate.mockImplementationOnce(() => new Promise((_, r) => { reject = r; }));
  render(view('advanced'));
  const control = screen.getByRole('switch', { name: 'Public Profile' });
  fireEvent.click(control); fireEvent.click(control);
  expect(f.mutate).toHaveBeenCalledExactlyOnceWith({ creatorId: 'creator1', isPublished: false });
  expect(control).toBeDisabled(); expect(control).toBeChecked();
  await act(async () => reject(new Error('Offline')));
  expect(control).toBeChecked(); expect(control).toBeEnabled();
  expect(f.error).toHaveBeenCalledWith('Could not update profile visibility. Please try again.');
  f.mutate.mockResolvedValue(null); fireEvent.click(control);
  await waitFor(() => expect(f.mutate).toHaveBeenCalledTimes(2));
});
it('does not publish from a demo switch', () => {
  render(view('advanced&demo=1'));
  fireEvent.click(screen.getByRole('switch', { name: 'Public Profile' }));
  expect(f.mutate).not.toHaveBeenCalled();
  expect(f.message).toHaveBeenCalledWith('Sample preview — visibility not saved');
});
it('does not invent live sessions or enabled login protection', () => {
  render(view('security'));
  expect(screen.getByRole('button', { name: 'View Sessions' })).toBeDisabled();
  expect(screen.queryByText('Mobile Safari')).not.toBeInTheDocument();
  expect(screen.getByText('Session history and remote sign-out are not available yet.')).toBeInTheDocument();
  const alerts = screen.getByRole('switch', { name: 'Login Alerts' });
  expect(alerts).not.toBeChecked(); expect(alerts).toBeDisabled();
  expect(alerts).toHaveAccessibleDescription('Login alert delivery is not available yet.');
});
it('keeps example session details inside explicit demo mode', () => {
  render(view('security&demo=1'));
  fireEvent.click(screen.getByRole('button', { name: 'View Sessions' }));
  expect(screen.getByText('Mobile Safari')).toBeInTheDocument();
  expect(screen.getByText(/Sample preview data/)).toBeInTheDocument();
});
it('opens a real password form and clears cancelled values without a request', async () => {
  render(view('security'));
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'synthetic-only' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  expect(screen.getByLabelText('Current password')).toHaveValue('');
  expect(f.password).not.toHaveBeenCalled();
});
it.each(['', '&demo=1'])('the general password shortcut opens security and preserves demo isolation (%s)', suffix => {
  render(view(`general${suffix}`));
  fireEvent.click(screen.getByRole('button', { name: 'Change password', exact: true }));
  expect(screen.getByRole('heading', { name: 'Security', exact: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Change Password', exact: true }));
  expect(screen.getByRole('dialog', { name: 'Change password' })).toBeInTheDocument();
  if (suffix) expect(screen.getByText(/Sample preview data/)).toBeInTheDocument();
  expect(f.password).not.toHaveBeenCalled();
});
it('explains unavailable advanced actions without a false export confirmation', () => {
  render(view('advanced'));
  for (const name of ['Connect Domain', 'Edit Terms', 'Edit Policy', 'Customize', 'Export Data']) {
    expect(screen.getByRole('button', { name, exact: true })).toBeDisabled();
  }
  expect(screen.getByRole('link', { name: 'Request account deletion' })).toHaveAttribute('href', '/creator/support');
  fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));
  expect(f.message).not.toHaveBeenCalled();
});
it.each(['notifications', 'security', 'advanced'])('%s help opens existing support', tab => {
  render(view(tab));
  expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/creator/support');
});
it('disables live notification previews and labels the frequency control', () => {
  render(view('notifications'));
  for (const control of [...screen.getAllByRole('switch'), ...screen.getAllByRole('checkbox')]) expect(control).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Notification Frequency' })).toBeDisabled();
});
it('disables demo email sub-controls semantically when email previews are switched off', () => {
  render(view('notifications&demo=1'));
  fireEvent.click(screen.getByRole('switch', { name: 'Email Notifications' }));
  for (const control of screen.getAllByRole('checkbox')) expect(control).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Notification Frequency' })).toBeEnabled();
});
