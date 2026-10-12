import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import { ProtectedRoute } from './ProtectedRoute';
import type { AppRole } from '@/lib/roles';

const fixture = vi.hoisted(() => ({
  auth: { user: { id: 'test-user' } as { id: string } | null, role: 'subscriber' as AppRole,
    roles: ['subscriber'] as AppRole[], loading: false, roleLoading: false, signingOut: false, switchRole: vi.fn() },
  mfa: { required: false },
  creator: null as object | null,
  creatorRequests: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => fixture.auth }));
vi.mock('convex/react', () => ({ useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
  if (args === 'skip') return undefined;
  if (getFunctionName(ref) === 'mfa:status') return fixture.mfa;
  fixture.creatorRequests(); return fixture.creator;
} }));

function Destination() { const location = useLocation(); return <output data-testid="destination">{location.pathname}{location.search}</output>; }
function show(path: string, roles: AppRole[]) {
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path={path.split('?')[0]} element={<ProtectedRoute allowedRoles={roles}><h1>Protected content</h1></ProtectedRoute>} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>);
}
beforeEach(() => {
  fixture.auth = { user: { id: 'test-user' }, role: 'subscriber', roles: ['subscriber'], loading: false, roleLoading: false, signingOut: false, switchRole: vi.fn() };
  fixture.mfa = { required: false };
  fixture.creator = null; fixture.creatorRequests.mockClear();
});
afterEach(cleanup);

describe('protected journey role matrix (isolated identities)', () => {
  it('sends an anonymous deep link to login with its query intact', async () => {
    fixture.auth.user = null;
    fixture.auth.roles = [];
    show('/admin/reports?range=month', ['admin']);
    const destination = (await screen.findByTestId('destination')).textContent!;
    expect(new URL(destination, 'http://localhost').searchParams.get('returnTo')).toBe('/admin/reports?range=month');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('denies a member the admin workspace', async () => {
    show('/admin', ['admin']);
    expect(await screen.findByTestId('destination')).toHaveTextContent('/dashboard');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('allows an account with the server-held admin role', async () => {
    fixture.auth.role = 'admin'; fixture.auth.roles = ['admin'];
    show('/admin', ['admin']);
    expect(await screen.findByRole('heading', { name: 'Protected content' })).toBeVisible();
  });
  it('routes a new creator to onboarding', async () => {
    fixture.auth.role = 'creator'; fixture.auth.roles = ['creator'];
    show('/creator/products', ['creator']);
    expect(await screen.findByTestId('destination')).toHaveTextContent('/creator/onboarding');
  });
  it('does not request protected creator data while MFA is pending', async () => {
    fixture.auth.role = 'creator'; fixture.auth.roles = ['creator']; fixture.mfa.required = true;
    show('/creator/products', ['creator']);
    expect(await screen.findByTestId('destination')).toHaveTextContent('/mfa');
    expect(fixture.creatorRequests).not.toHaveBeenCalled();
  });
  it('requires MFA even when the account has the correct role', async () => {
    fixture.auth.role = 'admin'; fixture.auth.roles = ['admin']; fixture.mfa.required = true;
    show('/admin', ['admin']);
    expect(await screen.findByTestId('destination')).toHaveTextContent('/mfa');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
