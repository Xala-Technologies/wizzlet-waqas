import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PasswordChangeButton } from './PasswordChangeButton';

const f = vi.hoisted(() => ({ account: true as boolean | undefined, action: vi.fn(), success: vi.fn(), message: vi.fn() }));
vi.mock('convex/react', () => ({ useQuery: () => f.account, useAction: () => f.action }));
vi.mock('sonner', () => ({ toast: { success: f.success, message: f.message, error: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); f.account = true; localStorage.clear(); sessionStorage.clear(); });
afterEach(cleanup);

it('waits for password-account status before offering the form', () => {
  f.account = undefined; render(<PasswordChangeButton />);
  expect(screen.getByRole('button', { name: 'Change Password' })).toBeDisabled();
});
it('explains provider-only accounts without offering an unusable password form', () => {
  f.account = false; render(<PasswordChangeButton />);
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  expect(screen.getByText(/no Sweeph password to change/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
  expect(f.action).not.toHaveBeenCalled();
});
it('submits only to the existing action, closes on success, and retains no credentials in storage', async () => {
  f.action.mockResolvedValue({ ok: true }); render(<PasswordChangeButton />);
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old-synthetic' } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-synthetic' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-synthetic' } });
  fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(f.action).toHaveBeenCalledExactlyOnceWith({ currentPassword: 'old-synthetic', newPassword: 'new-synthetic' });
  expect(f.success).toHaveBeenCalledWith('Password updated — please sign in again');
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  for (const input of screen.getByRole('dialog').querySelectorAll('input')) expect(input).toHaveValue('');
  expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
});
it('never sends credential changes in demo mode', async () => {
  render(<PasswordChangeButton demo />);
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(f.action).not.toHaveBeenCalled();
  expect(f.message).toHaveBeenCalledWith('Sample preview — password changes need a live account.');
});
