import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Mfa from './Mfa';

const f = vi.hoisted(() => ({ signOut: vi.fn(), verify: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'member' }, role: 'subscriber', roles: ['subscriber'], loading: false, roleLoading: false, signingOut: false, signOut: f.signOut }) }));
vi.mock('convex/react', () => ({ useQuery: () => ({ required: true }), useMutation: () => f.verify }));
vi.mock('sonner', () => ({ toast: { error: f.error, message: vi.fn() } }));
vi.mock('@/components/auth/AuthShell', () => ({ AuthShell: ({ children, footer }: { children: ReactNode; footer: ReactNode }) => <>{children}{footer}</> }));

function Destination() { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; }
function show(path = '/mfa?returnTo=%2Fdashboard%2Fsettings') {
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/mfa" element={<Mfa />} /><Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>);
}
beforeEach(() => {
  vi.resetAllMocks(); f.signOut.mockResolvedValue(undefined);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('ends the pending MFA session before showing sign-in, preserving the destination', async () => {
  let finish!: () => void;
  f.signOut.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in again' }));
  expect(f.signOut).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('/login', { exact: false })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Signing out');
  await act(async () => finish());
  expect(await screen.findByText('/login?returnTo=%2Fdashboard%2Fsettings')).toBeInTheDocument();
});
it('allows retry when ending the pending session fails', async () => {
  f.signOut.mockRejectedValueOnce(new Error('offline'));
  show('/mfa');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in again' }));
  await waitFor(() => expect(f.error).toHaveBeenCalledWith('Could not sign out. Please try again.'));
  fireEvent.click(screen.getByRole('button', { name: 'Sign in again' }));
  expect(await screen.findByText('/login')).toBeInTheDocument();
  expect(f.signOut).toHaveBeenCalledTimes(2);
});
it('does not allow account switching while verification is pending', async () => {
  f.verify.mockReturnValue(new Promise(() => {}));
  show();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('button', { name: 'Sign in again' })).toBeDisabled();
  expect(f.signOut).not.toHaveBeenCalled();
});
it('labels authenticator and backup inputs and clears the code on mode changes', () => {
  show();
  fireEvent.change(screen.getByRole('textbox', { name: 'Authenticator code' }), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Use a backup code' }));
  expect(screen.getByRole('textbox', { name: 'Backup code' })).toHaveValue('');
  fireEvent.change(screen.getByRole('textbox', { name: 'Backup code' }), { target: { value: 'ABCD-EFGH' } });
  fireEvent.click(screen.getByRole('button', { name: 'Use authenticator code instead' }));
  expect(screen.getByRole('textbox', { name: 'Authenticator code' })).toHaveValue('');
});
