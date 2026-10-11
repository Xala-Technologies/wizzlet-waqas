import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import SubscriptionSuccess from './SubscriptionSuccess';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  auth: { isLoading: false, isAuthenticated: true },
  subscriptions: [] as unknown[],
}));
vi.mock('@/lib/stripe', () => ({ PAYMENTS_MODE: 'stripe', confirmStripeCheckoutSession: mocks.confirm }));
vi.mock('@convex-dev/auth/react', () => ({ useAuthActions: () => ({ signIn: vi.fn() }) }));
vi.mock('convex/react', () => ({
  useConvexAuth: () => mocks.auth,
  useAction: () => vi.fn(),
  useMutation: () => vi.fn(),
  useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
    if (args === 'skip') return undefined;
    return getFunctionName(ref) === 'subscriptions/mutations:mySubscriptionsDetailed'
      ? mocks.subscriptions : { includesDiscord: false };
  },
}));

function show(path = '/subscription/success') {
  return render(<MemoryRouter initialEntries={[path]}><SubscriptionSuccess /></MemoryRouter>);
}

beforeEach(() => {
  mocks.confirm.mockReset().mockResolvedValue(false);
  mocks.auth = { isLoading: false, isAuthenticated: true };
  mocks.subscriptions = [];
});
afterEach(cleanup);

describe('checkout return evidence', () => {
  it('does not claim payment or access for a bare success URL', () => {
    show();
    expect(screen.getByRole('heading').textContent).not.toMatch(/^Subscription (confirmed|successful)/);
    expect(screen.queryByText(/You're subscribed/)).not.toBeInTheDocument();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('does not turn a failed confirmation into success', async () => {
    show('/subscription/success?session_id=cs_failed&creator=alice');
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith('cs_failed'));
    await waitFor(() => expect(screen.queryByText('Confirming subscription…')).not.toBeInTheDocument());
    expect(screen.getByRole('heading').textContent).not.toMatch(/^Subscription (confirmed|successful)/);
  });

  it('waits for authentication to settle before confirming a session', async () => {
    mocks.auth = { isLoading: true, isAuthenticated: false };
    const view = show('/subscription/success?session_id=cs_valid');
    expect(mocks.confirm).not.toHaveBeenCalled();
    mocks.auth = { isLoading: false, isAuthenticated: true };
    mocks.confirm.mockResolvedValue(true);
    view.rerender(<MemoryRouter initialEntries={['/subscription/success?session_id=cs_valid']}><SubscriptionSuccess /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Subscription confirmed' });
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it('preserves the checkout session when asking an anonymous user to log in', () => {
    mocks.auth = { isLoading: false, isAuthenticated: false };
    show('/subscription/success?session_id=cs_valid&creator=alice');
    const href = screen.getByRole('link', { name: /sign in/i }).getAttribute('href')!;
    expect(new URL(href, 'http://localhost').searchParams.get('returnTo')).toBe('/subscription/success?session_id=cs_valid&creator=alice');
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('confirms an existing paid subscription without a new Stripe session', () => {
    mocks.subscriptions = [{ status: 'active', creator: { username: 'alice' } }];
    show('/subscription/success?creator=alice');
    expect(screen.getByRole('heading', { name: 'Subscription confirmed' })).toBeInTheDocument();
  });

  it('rejects a forged sandbox return for an unpaid subscription', () => {
    mocks.subscriptions = [{ status: 'past_due', creator: { username: 'alice' } }];
    show('/subscription/success?creator=alice&sandbox=1');
    expect(screen.getByRole('heading').textContent).not.toMatch(/^Subscription (confirmed|successful)/);
  });
});
