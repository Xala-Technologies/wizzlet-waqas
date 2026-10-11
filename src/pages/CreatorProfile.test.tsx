import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import CreatorProfile from './CreatorProfile';

const fixture = vi.hoisted(() => ({ creator: { _id: 'creator1', username: 'audit', displayName: 'Audit Creator',
  bio: 'Test profile', createdAt: 1700000000000, verificationStatus: 'none', monthlyPriceCents: undefined as number | undefined }, empty: [] }));
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: false }), useMutation: () => vi.fn(),
  useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
    if (args === 'skip') return undefined;
    const name = getFunctionName(ref);
    if (name.endsWith(':getByUsername')) return fixture.creator;
    if (name.endsWith(':countActiveByCreator')) return 0;
    return fixture.empty;
  },
}));
vi.mock('@/components/Seo', () => ({ Seo: () => null }));
vi.mock('@/components/landing/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/data/payments', () => ({ createCheckoutSession: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackPageView: vi.fn(), trackPostView: vi.fn(), trackSubscribeClick: vi.fn() }));
beforeEach(() => { fixture.creator.verificationStatus = 'none'; fixture.creator.monthlyPriceCents = undefined; });
afterEach(cleanup);
function show() {
  render(<MemoryRouter initialEntries={['/audit?demo=0']}><Routes>
    <Route path="/:username" element={<CreatorProfile />} />
  </Routes></MemoryRouter>);
}
describe('live creator profile claims', () => {
  it('quotes the same fallback price as checkout for a creator without a product', () => {
    show();
    expect(screen.getByRole('button', { name: 'Subscribe $9.99 / month' })).toBeVisible();
  });
  it('does not label an unverified creator as verified', () => {
    show();
    expect(screen.queryByLabelText('Verified')).not.toBeInTheDocument();
  });
  it('preserves an explicit price and the verified status', () => {
    fixture.creator.monthlyPriceCents = 2500; fixture.creator.verificationStatus = 'verified';
    show();
    expect(screen.getByRole('button', { name: 'Subscribe $25.00 / month' })).toBeVisible();
    expect(screen.getByLabelText('Verified')).toBeInTheDocument();
  });
});
