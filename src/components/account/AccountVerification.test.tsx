import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Mfa from '@/pages/Mfa';
import { EmailChangeOtpDialog } from './EmailChangeOtpDialog';

const fixture = vi.hoisted(() => ({ verify: vi.fn(), signOut: vi.fn(), error: vi.fn(), success: vi.fn(), close: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: fixture.error, success: fixture.success, message: vi.fn() } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'fixture' }, roles: ['subscriber'], role: 'subscriber',
  loading: false, roleLoading: false, signingOut: false, signOut: fixture.signOut }) }));
vi.mock('convex/react', () => ({
  useMutation: () => fixture.verify, useAction: () => vi.fn(),
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'mfa:status' ? { required: true } : [
    { category: 'email_change', status: 'open', requestedEmail: 'next@example.invalid' },
  ],
}));
vi.mock('@/components/auth/AuthShell', () => ({ AuthShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <input aria-label="Verification code" value={value} onChange={e => onChange(e.target.value)} />,
  InputOTPGroup: () => null, InputOTPSlot: () => null,
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function mfaPage() {
  render(<MemoryRouter initialEntries={['/mfa']}><Routes>
    <Route path="/mfa" element={<Mfa />} /><Route path="*" element={<div>Protected destination</div>} />
  </Routes></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '000000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}
describe('verification error responses never appear successful', () => {
  it.each([
    ['INVALID_CODE', 'That code is not valid. Try the current authenticator code.'],
    ['MFA_RATE_LIMITED', 'Too many attempts. Wait five minutes before trying again.'],
  ])('keeps the MFA challenge visible on %s', async (error, message) => {
    fixture.verify.mockResolvedValue({ error }); mfaPage();
    await waitFor(() => expect(fixture.error).toHaveBeenCalledWith(message));
    expect(screen.queryByText('Protected destination')).not.toBeInTheDocument();
  });
  it('moves forward only after successful MFA verification', async () => {
    fixture.verify.mockResolvedValue({ usedBackupCode: false }); mfaPage();
    expect(await screen.findByText('Protected destination')).toBeInTheDocument();
  });
  it('keeps email verification open and does not sign out on a rejected code', async () => {
    fixture.verify.mockResolvedValue({ status: 'invalid', error: 'OTP_INVALID' });
    render(<EmailChangeOtpDialog open onOpenChange={fixture.close} />);
    fireEvent.change(await screen.findByLabelText('Verification code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and update' }));
    await waitFor(() => expect(fixture.error).toHaveBeenCalledWith('That code is incorrect'));
    expect(fixture.success).not.toHaveBeenCalled(); expect(fixture.signOut).not.toHaveBeenCalled(); expect(fixture.close).not.toHaveBeenCalled();
  });
});
