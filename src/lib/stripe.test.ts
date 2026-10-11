import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmStripeCheckoutSession, createCheckoutSession } from './stripe';

const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock('@/integrations/convex/client', () => ({ convex: { action: mocks.action } }));
vi.mock('@/config/publicEnv', () => ({ publicEnv: { stripeMode: 'stripe', sandboxCheckoutAllowed: false } }));
vi.mock('sonner', () => ({ toast: { loading: vi.fn(), error: vi.fn(), dismiss: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  mocks.action.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('window', { location: { href: '' } });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('checkout service', () => {
  it('honors an explicit unsuccessful confirmation response', async () => {
    mocks.action.mockResolvedValue({ ok: false });
    expect(await confirmStripeCheckoutSession('cs_pending')).toBe(false);
  });
  it('accepts a verified successful confirmation', async () => {
    mocks.action.mockResolvedValue({ ok: true });
    expect(await confirmStripeCheckoutSession('cs_paid')).toBe(true);
  });
  it('preserves the intended creator through reauthentication', async () => {
    mocks.action.mockRejectedValue(new Error('UNAUTHENTICATED'));
    await createCheckoutSession('creator123', 'alice');
    const login = new URL(window.location.href, 'http://localhost');
    expect(login.pathname).toBe('/login');
    expect(login.searchParams.get('returnTo')).toBe('/alice');
  });
});
