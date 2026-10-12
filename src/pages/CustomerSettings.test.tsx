import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CustomerSettings from './CustomerSettings';

const fixture = vi.hoisted(() => ({
  user: { id: 'member', email: 'member@example.invalid' },
  me: { _id: 'member', fullName: 'Saved Member', phone: '12345' },
  update: vi.fn(), password: vi.fn(), error: vi.fn(), success: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.user }) }));
vi.mock('@/lib/stripe', () => ({ openCustomerPortal: vi.fn() }));
vi.mock('convex/react', () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name === 'users/queries:me') return fixture.me;
    if (name === 'users/queries:hasPasswordAccount') return true;
    return [];
  },
  useMutation: () => fixture.update,
  useAction: () => fixture.password,
}));
vi.mock('sonner', () => ({ toast: { error: fixture.error, success: fixture.success, message: vi.fn() } }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/account/TotpManageCard', () => ({ TotpManageCard: () => null }));
vi.mock('@/components/account/EmailChangeOtpDialog', () => ({ EmailChangeOtpDialog: () => null }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function show() { render(<MemoryRouter initialEntries={['/?demo=0']}><CustomerSettings /></MemoryRouter>); }
function editName() {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Unsaved Member' } });
}
function passwordForm(current = 'old-synthetic', next = 'new-synthetic', confirmation = next) {
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByPlaceholderText('Current password'), { target: { value: current } });
  fireEvent.change(within(dialog).getByPlaceholderText('New password (min 8 characters)'), { target: { value: next } });
  fireEvent.change(within(dialog).getByPlaceholderText('Confirm new password'), { target: { value: confirmation } });
  return dialog;
}

it('Cancel discards profile edits without making a request', () => {
  show(); editName();
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '999' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByLabelText('Full Name')).toHaveValue('Saved Member');
  expect(screen.getByLabelText('Phone Number')).toHaveValue('12345');
  expect(fixture.update).not.toHaveBeenCalled();
});

it('a failed profile save retains edits, blocks duplicate requests, and permits retry', async () => {
  let reject!: (e: Error) => void;
  fixture.update.mockImplementationOnce(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
  show(); editName();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(fixture.update).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await act(async () => reject(new Error('Offline')));
  expect(screen.getByLabelText('Full Name')).toHaveValue('Unsaved Member');
  expect(fixture.error).toHaveBeenCalledWith('Could not save your profile');
  fixture.update.mockResolvedValue(undefined);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByRole('button', { name: 'Edit' });
  expect(fixture.update).toHaveBeenCalledTimes(2);
  // A new edit/cancel cycle restores the last successful local value, even before query refresh.
  editName();
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Another draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByLabelText('Full Name')).toHaveValue('Unsaved Member');
});

it.each(['Cancel', 'Escape'])('%s clears the password draft without a request', async (close) => {
  show(); const dialog = passwordForm();
  if (close === 'Cancel') fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  else fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  for (const input of screen.getByRole('dialog').querySelectorAll('input')) expect(input).toHaveValue('');
  expect(fixture.password).not.toHaveBeenCalled();
});

it.each([
  ['', 'new-synthetic', 'new-synthetic', 'Enter your current password'],
  ['old-synthetic', 'short', 'short', 'Password must be at least 8 characters'],
  ['old-synthetic', 'new-synthetic', 'different', 'New password and confirmation do not match'],
  ['old-synthetic', 'old-synthetic', 'old-synthetic', 'Choose a new password different from your current one'],
])('rejects invalid password input (%s, %s)', (current, next, confirmation, message) => {
  show(); const dialog = passwordForm(current, next, confirmation);
  fireEvent.submit(dialog.querySelector('form')!);
  expect(fixture.error).toHaveBeenCalledWith(message);
  expect(fixture.password).not.toHaveBeenCalled();
});

it('password failure retains the draft, prevents duplicate saves, and permits a retry', async () => {
  let reject!: (e: Error) => void;
  fixture.password.mockImplementationOnce(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
  show(); const dialog = passwordForm();
  fireEvent.submit(dialog.querySelector('form')!);
  fireEvent.submit(dialog.querySelector('form')!);
  expect(fixture.password).toHaveBeenCalledTimes(1);
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await act(async () => reject(new Error('INVALID_CURRENT_PASSWORD')));
  expect(fixture.error).toHaveBeenCalledWith('Current password is incorrect');
  expect(within(dialog).getByPlaceholderText('New password (min 8 characters)')).toHaveValue('new-synthetic');
  fixture.password.mockResolvedValue(undefined);
  fireEvent.submit(dialog.querySelector('form')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(fixture.password).toHaveBeenCalledTimes(2);
});
