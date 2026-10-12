import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mocks = vi.hoisted(() => ({
  me: { _id: 'user1', roles: ['admin'], email: 'test@example.invalid' } as { _id: string; roles: string[]; email: string } | null | undefined,
  authenticated: true,
  signOut: vi.fn().mockResolvedValue(undefined),
  ensure: vi.fn().mockResolvedValue(null),
  convex: { query: vi.fn() },
}));
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: mocks.authenticated }),
  useConvex: () => mocks.convex,
  useQuery: () => mocks.me,
  useMutation: () => mocks.ensure,
}));
vi.mock('@convex-dev/auth/react', () => ({ useAuthActions: () => ({ signOut: mocks.signOut }) }));
vi.mock('@/lib/analytics', () => ({ resetAnalyticsUser: vi.fn() }));

function Consumer() {
  const auth = useAuth();
  return <><output data-testid="roles">{auth.roles.join(',') || 'none'}</output>
    <button onClick={() => auth.acceptAssignedRole('creator')}>Assigned creator</button></>;
}
function tree() { return <AuthProvider><Consumer /></AuthProvider>; }
beforeEach(() => {
  localStorage.clear();
  mocks.authenticated = true;
  mocks.signOut.mockClear();
  mocks.me = { _id: 'user1', roles: ['admin'], email: 'test@example.invalid' };
});
afterEach(cleanup);

describe('server role changes', () => {
  it('removes the last role when the server revokes it', async () => {
    const view = render(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('admin'));
    mocks.me = { ...mocks.me!, roles: [] };
    view.rerender(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('none'));
    expect(localStorage.getItem('prizelet.activeRole')).toBeNull();
  });
  it('keeps a just-assigned role until the next server snapshot, then honors that snapshot', async () => {
    mocks.me = { ...mocks.me!, roles: [] };
    const view = render(tree());
    fireEvent.click(screen.getByRole('button', { name: 'Assigned creator' }));
    expect(screen.getByTestId('roles')).toHaveTextContent('creator');
    mocks.me = { ...mocks.me!, roles: ['creator'] };
    view.rerender(tree());
    expect(screen.getByTestId('roles')).toHaveTextContent('creator');
    mocks.me = { ...mocks.me!, roles: [] };
    view.rerender(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('none'));
  });
  it('clears a revoked SDK session once so the next login cannot reuse it', async () => {
    const view = render(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('admin'));
    mocks.me = null;
    view.rerender(tree());
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('roles')).toHaveTextContent('none');
    expect(localStorage.getItem('prizelet.activeRole')).toBeNull();
    view.rerender(tree());
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
  it('does not log out while the profile is still loading or MFA is pending', () => {
    mocks.me = undefined;
    const view = render(tree());
    expect(mocks.signOut).not.toHaveBeenCalled();
    mocks.me = { _id: 'user1', roles: ['creator'], email: 'test@example.invalid' };
    view.rerender(tree());
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
