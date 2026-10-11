import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mocks = vi.hoisted(() => ({
  me: { _id: 'user1', roles: ['admin'] as string[], email: 'test@example.invalid' },
  ensure: vi.fn().mockResolvedValue(null),
  convex: { query: vi.fn() },
}));
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useConvex: () => mocks.convex,
  useQuery: () => mocks.me,
  useMutation: () => mocks.ensure,
}));
vi.mock('@convex-dev/auth/react', () => ({ useAuthActions: () => ({ signOut: vi.fn() }) }));
vi.mock('@/lib/analytics', () => ({ resetAnalyticsUser: vi.fn() }));

function Consumer() {
  const auth = useAuth();
  return <><output data-testid="roles">{auth.roles.join(',') || 'none'}</output>
    <button onClick={() => auth.acceptAssignedRole('creator')}>Assigned creator</button></>;
}
function tree() { return <AuthProvider><Consumer /></AuthProvider>; }
beforeEach(() => {
  localStorage.clear();
  mocks.me = { _id: 'user1', roles: ['admin'], email: 'test@example.invalid' };
});
afterEach(cleanup);

describe('server role changes', () => {
  it('removes the last role when the server revokes it', async () => {
    const view = render(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('admin'));
    mocks.me = { ...mocks.me, roles: [] };
    view.rerender(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('none'));
    expect(localStorage.getItem('prizelet.activeRole')).toBeNull();
  });
  it('keeps a just-assigned role until the next server snapshot, then honors that snapshot', async () => {
    mocks.me = { ...mocks.me, roles: [] };
    const view = render(tree());
    fireEvent.click(screen.getByRole('button', { name: 'Assigned creator' }));
    expect(screen.getByTestId('roles')).toHaveTextContent('creator');
    mocks.me = { ...mocks.me, roles: ['creator'] };
    view.rerender(tree());
    expect(screen.getByTestId('roles')).toHaveTextContent('creator');
    mocks.me = { ...mocks.me, roles: [] };
    view.rerender(tree());
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('none'));
  });
});
