import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SessionManagementCard } from './SessionManagementCard';

const f = vi.hoisted(() => ({ query: vi.fn(), revoke: vi.fn(), revokeAll: vi.fn(), signOut: vi.fn(), success: vi.fn(), message: vi.fn() }));
vi.mock('convex/react', () => ({ useConvex: () => f, useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref).endsWith(':revokeAll') ? f.revokeAll : f.revoke }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' }, signOut: f.signOut }) }));
vi.mock('sonner', () => ({ toast: { success: f.success, message: f.message } }));
const current = { id: 'current', createdAt: 1792238400000, expiresAt: 1794830400000, isCurrent: true };
const other = { ...current, id: 'other', createdAt: current.createdAt - 60000, isCurrent: false };
beforeEach(() => { vi.resetAllMocks(); f.query.mockResolvedValue({ sessions: [current, other], hasMore: false }); f.revoke.mockResolvedValue({ currentSessionRevoked: false }); f.revokeAll.mockResolvedValue(null); f.signOut.mockResolvedValue(undefined); });
afterEach(cleanup);
const view = (demo = false) => render(<MemoryRouter><SessionManagementCard demo={demo} /></MemoryRouter>);
async function open() { fireEvent.click(screen.getByRole('button', { name: 'View Sessions' })); await screen.findByRole('listitem', { name: 'Current session' }); }

it('loads only on request and identifies the current session without exposing credentials or fake devices', async () => {
  view(); expect(f.query).not.toHaveBeenCalled(); await open();
  expect(within(screen.getByRole('listitem', { name: 'Current session' })).queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.queryByText('Mobile Safari')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign out everywhere' })).toBeEnabled();
});
it('focuses Cancel before confirmation and cancelling does not revoke anything', async () => {
  view(); await open(); fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  const cancel = screen.getByRole('button', { name: 'Cancel' }); expect(cancel).toHaveFocus(); fireEvent.click(cancel);
  expect(f.revoke).not.toHaveBeenCalled(); expect(f.revokeAll).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Refresh sessions' })).toHaveFocus();
});
it('revokes the selected session, prevents double submit, and reloads authoritative data', async () => {
  let done!: (value: { currentSessionRevoked: boolean }) => void;
  f.revoke.mockImplementationOnce(() => new Promise(resolve => { done = resolve; }));
  view(); await open(); fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  const submit = screen.getByRole('button', { name: 'Sign out session' }); fireEvent.click(submit); fireEvent.click(submit);
  expect(f.revoke).toHaveBeenCalledExactlyOnceWith({ sessionId: 'other' }); expect(submit).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled(); expect(screen.getByRole('status')).toHaveTextContent('Signing out');
  f.query.mockResolvedValue({ sessions: [current], hasMore: false }); await act(async () => done({ currentSessionRevoked: false }));
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1)); expect(f.signOut).not.toHaveBeenCalled();
});
it('shows a retryable error without claiming success or removing the session', async () => {
  f.revoke.mockRejectedValueOnce(new Error('Offline')); view(); await open(); fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out session' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not sign out'); expect(f.success).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out session' })); await waitFor(() => expect(f.success).toHaveBeenCalledWith('Session signed out'));
});
it('refreshes an already-ended session instead of leaving a stale confirmation', async () => {
  f.revoke.mockRejectedValueOnce(new Error('SESSION_NOT_FOUND')); view(); await open(); fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  f.query.mockResolvedValue({ sessions: [current], hasMore: false }); fireEvent.click(screen.getByRole('button', { name: 'Sign out session' }));
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1)); expect(f.success).not.toHaveBeenCalled(); expect(f.message).toHaveBeenCalledOnce();
});
it('requires confirmation before signing out everywhere and clears local authentication only after success', async () => {
  view(); await open(); fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' })); expect(f.revokeAll).not.toHaveBeenCalled();
  expect(screen.getByText(/including this one/)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
  await waitFor(() => expect(f.signOut).toHaveBeenCalledOnce()); expect(f.revokeAll).toHaveBeenCalledExactlyOnceWith({});
});
it('keeps the current session when signing out everywhere fails', async () => {
  f.revokeAll.mockRejectedValueOnce(new Error('Offline')); view(); await open(); fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' })); await screen.findByRole('alert'); expect(f.signOut).not.toHaveBeenCalled(); expect(f.success).not.toHaveBeenCalled();
});
it('recovers from load failure using Try again', async () => {
  f.query.mockRejectedValueOnce(new Error('Endpoint unavailable')); view(); fireEvent.click(screen.getByRole('button', { name: 'View Sessions' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load sessions'); fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('listitem', { name: 'Current session' });
});
it('does not expose an empty success state when authentication expires', async () => {
  f.query.mockResolvedValueOnce(null); view(); fireEvent.click(screen.getByRole('button', { name: 'View Sessions' }));
  await screen.findByText('Your session is no longer available. Please sign in again.'); expect(screen.queryByRole('button', { name: 'Sign out everywhere' })).not.toBeInTheDocument();
});
it('explains truncation while still offering all-session revocation', async () => {
  f.query.mockResolvedValueOnce({ sessions: [current, other], hasMore: true }); view(); await open(); expect(screen.getByText(/including those not shown/)).toBeInTheDocument();
});
it('isolates demo mode from all backend calls', async () => {
  view(true); fireEvent.click(screen.getByRole('button', { name: 'View Sessions' })); await screen.findByText('Sample preview — sign-in management needs a live account.');
  expect(f.query).not.toHaveBeenCalled(); expect(f.revoke).not.toHaveBeenCalled(); expect(f.revokeAll).not.toHaveBeenCalled();
});
