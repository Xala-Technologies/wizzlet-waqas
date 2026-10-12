import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import { confirmCheckoutSession, fulfillWebhook } from '../../convex/payments/stripeNode';
import { applyInvoicePaid } from '../../convex/payments/stripeDb';

const stripe = vi.hoisted(() => ({ retrieve: vi.fn(), event: {} as Record<string, unknown> }));
vi.mock('stripe', () => ({ default: class {
  checkout = { sessions: { retrieve: stripe.retrieve } };
  webhooks = { constructEvent: () => stripe.event };
} }));
vi.mock('@convex-dev/auth/server', () => ({ getAuthUserId: async () => 'user1' }));
function invoke<T>(fn: unknown, ctx: unknown, args: Record<string, unknown>): Promise<T> {
  return (fn as { _handler: (ctx: unknown, args: unknown) => Promise<T> })._handler(ctx, args);
}
beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'isolated-test-key');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'isolated-webhook-key');
  stripe.retrieve.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('Stripe ledger and webhook regressions (isolated adapters)', () => {
  it('records zero revenue for a checkout with a 100% discount', async () => {
    stripe.retrieve.mockResolvedValue({ id: 'cs_free', status: 'complete', payment_status: 'no_payment_required', amount_total: 0,
      metadata: { userId: 'user1', creatorId: 'creator1', amountCents: '10000' } });
    const ctx = { runQuery: vi.fn(async (ref: Parameters<typeof getFunctionName>[0]) => {
      expect(getFunctionName(ref)).toBe('session:currentUserId'); return 'user1';
    }), runMutation: vi.fn(async () => ({ ok: true, duplicate: false })) };
    await invoke(confirmCheckoutSession, ctx, { sessionId: 'cs_free' });
    expect(ctx.runMutation).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ amountCents: 0 }));
  });

  it('records zero revenue and earnings for a zero-dollar renewal invoice', async () => {
    const sub = { _id: 'sub1', userId: 'user1', creatorId: 'creator1', status: 'active', amountCents: 10000 };
    const ctx = {
      db: {
        query: () => ({ withIndex: () => ({ first: async () => sub, unique: async () => null }) }),
        get: vi.fn(async () => ({ _id: 'creator1', createdAt: Date.now() })),
        patch: vi.fn(), insert: vi.fn(async () => 'event1'),
      },
      scheduler: { runAfter: vi.fn() },
    };
    await invoke(applyInvoicePaid, ctx, { stripeSubscriptionId: 'stripe-sub', invoiceId: 'in_free', amountCents: 0 });
    expect(ctx.db.insert).toHaveBeenCalledWith('paymentEvents', expect.objectContaining({ amountCents: 0, creatorEarningsCents: 0, platformFeeCents: 0 }));
  });

  it('does not fulfill a completed checkout while delayed payment is still unpaid', async () => {
    stripe.retrieve.mockResolvedValue({ id: 'cs_pending', status: 'complete', payment_status: 'unpaid', amount_total: 1000,
      metadata: { userId: 'user1', creatorId: 'creator1' } });
    const ctx = { runQuery: vi.fn(async (ref: Parameters<typeof getFunctionName>[0]) => {
      expect(getFunctionName(ref)).toBe('session:currentUserId'); return 'user1';
    }), runMutation: vi.fn(async () => ({ ok: true, duplicate: false })) };
    await expect(invoke(confirmCheckoutSession, ctx, { sessionId: 'cs_pending' })).rejects.toThrow('PAYMENT_PENDING');
    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it('waits for the asynchronous payment success event before granting checkout access', async () => {
    const session = { id: 'cs_async', status: 'complete', payment_status: 'unpaid', amount_total: 1000,
      metadata: { userId: 'user1', creatorId: 'creator1' } };
    stripe.event = { id: 'evt_pending', type: 'checkout.session.completed', data: { object: session } };
    const calls: string[] = [];
    const ctx = { runQuery: vi.fn(async () => null), runMutation: vi.fn(async (ref: Parameters<typeof getFunctionName>[0]) => {
      calls.push(getFunctionName(ref)); return { ok: true, duplicate: false };
    }) };
    await invoke(fulfillWebhook, ctx, { signature: 'fixture', payload: 'fixture' });
    expect(calls.filter((name) => name.endsWith(':fulfillCheckout'))).toHaveLength(0);
    stripe.event = { id: 'evt_paid', type: 'checkout.session.async_payment_succeeded', data: { object: { ...session, payment_status: 'paid' } } };
    await invoke(fulfillWebhook, ctx, { signature: 'fixture', payload: 'fixture' });
    expect(calls.filter((name) => name.endsWith(':fulfillCheckout'))).toHaveLength(1);
  });

  it.each(['invoice.paid', 'invoice.payment_failed'])('handles modern %s subscription references', async (type) => {
    stripe.event = { id: 'evt_modern', type, livemode: false, data: { object: {
      id: 'in_modern', billing_reason: 'subscription_cycle', amount_paid: 500,
      parent: { type: 'subscription_details', subscription_details: { subscription: 'sub_modern' } },
    } } };
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const ctx = {
      runQuery: vi.fn(async () => null),
      runMutation: vi.fn(async (ref: Parameters<typeof getFunctionName>[0], args: Record<string, unknown>) => {
        calls.push({ name: getFunctionName(ref), args }); return { ok: true, duplicate: false };
      }),
    };
    await invoke(fulfillWebhook, ctx, { signature: 'fixture', payload: 'fixture' });
    const target = type === 'invoice.paid' ? 'applyInvoicePaid' : 'applyInvoicePaymentFailed';
    expect(calls.find((call) => call.name.endsWith(`:${target}`))?.args.stripeSubscriptionId).toBe('sub_modern');
  });

  it('reads cancellation period end from subscription items in modern Stripe payloads', async () => {
    stripe.event = { id: 'evt_period', type: 'customer.subscription.updated', data: { object: {
      id: 'sub_modern', status: 'active', cancel_at_period_end: true,
      items: { data: [{ current_period_end: 1800000000 }] },
    } } };
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const ctx = { runQuery: vi.fn(async () => null), runMutation: vi.fn(async (ref: Parameters<typeof getFunctionName>[0], args: Record<string, unknown>) => {
      calls.push({ name: getFunctionName(ref), args }); return { ok: true, duplicate: false };
    }) };
    await invoke(fulfillWebhook, ctx, { signature: 'fixture', payload: 'fixture' });
    expect(calls.find((call) => call.name.endsWith(':applySubscriptionUpdated'))?.args.currentPeriodEnd).toBe(1800000000000);
  });

  it('retries a delivery after a transient fulfillment failure instead of swallowing it', async () => {
    stripe.event = { id: 'evt_retry', type: 'invoice.paid', data: { object: {
      id: 'in_retry', subscription: 'sub_legacy', billing_reason: 'subscription_cycle', amount_paid: 500,
    } } };
    let receipt: { processingState: string } | null = null;
    let attempts = 0;
    const ctx = {
      runQuery: vi.fn(async () => receipt),
      runMutation: vi.fn(async (ref: Parameters<typeof getFunctionName>[0], args: Record<string, unknown>) => {
        const name = getFunctionName(ref);
        if (name.endsWith(':recordWebhookReceipt')) {
          const duplicate = receipt?.processingState === 'processed';
          if (!duplicate) receipt = { processingState: String(args.processingState) };
          return { duplicate };
        }
        if (name.endsWith(':applyInvoicePaid') && ++attempts === 1) throw new Error('TRANSIENT_DB_FAILURE');
        return { ok: true };
      }),
    };
    const args = { signature: 'fixture', payload: 'fixture' };
    expect(await invoke(fulfillWebhook, ctx, args)).toEqual({ success: false, error: 'TRANSIENT_DB_FAILURE' });
    expect(await invoke(fulfillWebhook, ctx, args)).toEqual({ success: true });
    expect(attempts).toBe(2);
    // A successfully processed delivery is still idempotent on a third replay.
    expect(await invoke(fulfillWebhook, ctx, args)).toEqual({ success: true });
    expect(attempts).toBe(2);
  });

  it('does not acknowledge an invoice that arrived before its subscription exists', async () => {
    stripe.event = { id: 'evt_early', type: 'invoice.payment_failed', data: { object: { id: 'in_early', subscription: 'sub_early' } } };
    const receipts: unknown[] = [];
    const ctx = {
      runQuery: vi.fn(async () => null),
      runMutation: vi.fn(async (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
        if (getFunctionName(ref).endsWith(':recordWebhookReceipt')) receipts.push(args);
        return { ok: false, reason: 'NOT_FOUND' };
      }),
    };
    expect(await invoke(fulfillWebhook, ctx, { signature: 'fixture', payload: 'fixture' })).toEqual({ success: false, error: 'NOT_FOUND' });
    expect(receipts).toEqual([]);
  });
});
