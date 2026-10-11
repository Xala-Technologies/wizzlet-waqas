import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import { fulfillWebhook } from '../../convex/payments/stripeNode';
import { applyChargeRefund } from '../../convex/payments/stripeDb';
import { computeCreatorBalanceBreakdown } from '../../convex/lib/payoutBalance';

const stripe = vi.hoisted(() => ({
  event: {} as Record<string, unknown>, charges: vi.fn(), invoices: vi.fn(),
  invoicePayments: vi.fn(), sessions: vi.fn(), refunds: vi.fn(),
}));
vi.mock('stripe', () => ({ default: class {
  charges = { retrieve: stripe.charges };
  invoices = { retrieve: stripe.invoices };
  invoicePayments = { list: stripe.invoicePayments };
  checkout = { sessions: { list: stripe.sessions } };
  refunds = { list: stripe.refunds };
  webhooks = { constructEvent: () => stripe.event };
} }));
vi.mock('@convex-dev/auth/server', () => ({ getAuthUserId: async () => 'user1' }));
vi.mock('../../convex/lib/notify', () => ({ notifyAdmins: vi.fn(), previewBody: (s: string) => s }));

function invoke<T>(fn: unknown, ctx: unknown, args: Record<string, unknown>): Promise<T> {
  return (fn as { _handler: (ctx: unknown, args: unknown) => Promise<T> })._handler(ctx, args);
}
// Array async iterables model Stripe's auto-pagination, including later pages.
function pages(rows: unknown[]) { return { async *[Symbol.asyncIterator]() { yield* rows; } }; }
beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'isolated-test-key');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'isolated-webhook-key');
  vi.clearAllMocks();
  stripe.charges.mockResolvedValue({ id: 'ch_1', payment_intent: 'pi_1' });
  stripe.invoicePayments.mockReturnValue(pages([{ invoice: 'in_initial' }]));
  stripe.invoices.mockResolvedValue({ id: 'in_initial', billing_reason: 'subscription_create',
    parent: { subscription_details: { subscription: 'sub_1' } } });
  stripe.sessions.mockReturnValue(pages([{ id: 'cs_wrong', invoice: 'in_other' }, { id: 'cs_1', invoice: 'in_initial' }]));
  stripe.refunds.mockReturnValue(pages([{ id: 're_1', amount: 100, status: 'succeeded' }]));
});
afterEach(() => vi.unstubAllEnvs());

function webhookContext(ok = true) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  return { calls, runQuery: vi.fn(async () => null), runMutation: vi.fn(async (ref: Parameters<typeof getFunctionName>[0], args: Record<string, unknown>) => {
    calls.push({ name: getFunctionName(ref), args }); return { ok, duplicate: false };
  }) };
}
const deliver = (ctx: unknown) => invoke(fulfillWebhook, ctx, { signature: 'fixture', payload: 'fixture' });
function refundEvent() {
  stripe.event = { id: 'evt_refund', type: 'charge.refunded', livemode: false, data: { object: {
    id: 'ch_1', payment_intent: 'pi_1', amount: 300, amount_refunded: 100,
  } } };
}

describe('refund and dispute webhook attribution', () => {
  it('resolves a modern charge to the exact initial checkout, without selecting another invoice', async () => {
    refundEvent(); const ctx = webhookContext();
    expect(await deliver(ctx)).toEqual({ success: true });
    expect(ctx.calls.find(c => c.name.endsWith(':applyChargeRefund'))?.args).toMatchObject({
      chargeId: 'ch_1', paymentIntentId: 'pi_1', invoiceId: 'in_initial', checkoutSessionId: 'cs_1', refundId: 're_1', amountCents: 100,
    });
  });
  it('attributes a renewal refund to its invoice, never to an initial checkout', async () => {
    refundEvent(); stripe.invoices.mockResolvedValue({ id: 'in_initial', billing_reason: 'subscription_cycle' });
    const ctx = webhookContext(); await deliver(ctx);
    expect(ctx.calls.find(c => c.name.endsWith(':applyChargeRefund'))?.args.invoiceId).toBe('in_initial');
    expect(stripe.sessions).not.toHaveBeenCalled();
  });
  it('resolves a direct payment checkout without an invoice', async () => {
    refundEvent(); stripe.invoicePayments.mockReturnValue(pages([]));
    stripe.sessions.mockReturnValue(pages([{ id: 'cs_direct', payment_intent: 'pi_1' }]));
    const ctx = webhookContext(); await deliver(ctx);
    expect(ctx.calls.find(c => c.name.endsWith(':applyChargeRefund'))?.args.checkoutSessionId).toBe('cs_direct');
  });
  it('refuses ambiguous invoice attribution without acknowledging the event', async () => {
    refundEvent(); stripe.invoicePayments.mockReturnValue(pages([{ invoice: 'in_1' }, { invoice: 'in_2' }]));
    const ctx = webhookContext();
    expect(await deliver(ctx)).toEqual({ success: false, error: 'AMBIGUOUS_CHARGE_INVOICE' });
    expect(ctx.calls).toHaveLength(0);
  });
  it('records a pending refund only after refund.updated reports success', async () => {
    refundEvent(); stripe.refunds.mockReturnValue(pages([{ id: 're_1', amount: 100, status: 'pending' }]));
    const ctx = webhookContext(); await deliver(ctx);
    expect(ctx.calls.filter(c => c.name.endsWith(':applyChargeRefund'))).toHaveLength(0);
    stripe.event = { id: 'evt_refund_update', type: 'refund.updated', data: { object: { id: 're_1', charge: 'ch_1' } } };
    stripe.refunds.mockReturnValue(pages([{ id: 're_1', amount: 100, status: 'succeeded' }]));
    await deliver(ctx);
    expect(ctx.calls.filter(c => c.name.endsWith(':applyChargeRefund'))).toHaveLength(1);
  });
  it('applies every successful refund with a stable identity, including later pages, and skips failed refunds', async () => {
    refundEvent(); stripe.refunds.mockReturnValue(pages([
      { id: 're_2', amount: 80, status: 'succeeded' }, { id: 're_failed', amount: 50, status: 'failed' },
      { id: 're_1', amount: 100, status: 'succeeded' },
    ]));
    const ctx = webhookContext(); await deliver(ctx);
    expect(ctx.calls.filter(c => c.name.endsWith(':applyChargeRefund')).map(c => c.args.refundId)).toEqual(['re_2', 're_1']);
  });
  it('retrieves the charge and attributes a dispute to the original checkout', async () => {
    stripe.event = { id: 'evt_dispute', type: 'charge.dispute.created', data: { object: { id: 'dp_1', charge: 'ch_1', amount: 300 } } };
    const ctx = webhookContext(); await deliver(ctx);
    expect(stripe.charges).toHaveBeenCalledWith('ch_1');
    expect(ctx.calls.find(c => c.name.endsWith(':applyChargeRefund'))?.args).toMatchObject({ checkoutSessionId: 'cs_1', refundId: 'dp_1', kind: 'dispute' });
  });
  it.each(['charge.refunded', 'charge.dispute.created'])('leaves an unmatched %s unacknowledged for retry', async type => {
    refundEvent();
    if (type.includes('dispute')) stripe.event = { id: 'evt_dispute', type, data: { object: { id: 'dp_1', charge: 'ch_1', amount: 300 } } };
    const ctx = webhookContext(false);
    expect(await deliver(ctx)).toMatchObject({ success: false });
    expect(ctx.calls.some(c => c.name.endsWith(':recordWebhookReceipt'))).toBe(false);
  });
});

type Row = Record<string, unknown>;
function ledgerFixture() {
  const rows: Row[] = [{ _id: 'pay1', creatorId: 'creator1', amountCents: 3, platformFeeCents: 1,
    creatorEarningsCents: 2, commercialRef: 'checkout:cs_1', checkoutSessionId: 'cs_1', status: 'settled',
    type: 'subscription_charge', paymentMode: 'test', balanceState: 'available', availableAt: 0 }];
  const ctx = { db: {
    query: (table: string) => ({ withIndex: (_index: string, build: (q: unknown) => unknown) => {
      const predicates: Array<[string, unknown]> = [];
      const q = { eq: (field: string, value: unknown) => { predicates.push([field, value]); return q; } };
      build(q);
      const found = () => table === 'paymentEvents' ? rows.filter(row => predicates.every(([k, v]) => row[k] === v)) : [];
      return { unique: async () => found()[0] ?? null, take: async () => found(), collect: async () => found() };
    } }),
    insert: vi.fn(async (_table: string, row: Row) => { rows.push({ _id: `pay${rows.length + 1}`, ...row }); }),
    patch: vi.fn(async (id: string, patch: Row) => Object.assign(rows.find(r => r._id === id)!, patch)),
    get: vi.fn(async () => ({ displayName: 'Fixture creator' })),
  } };
  const refund = (id: string, amount: number) => invoke(applyChargeRefund, ctx, {
    chargeId: 'ch_1', refundId: id, amountCents: amount, checkoutSessionId: 'cs_1', kind: 'refund', paymentMode: 'test',
  });
  const balance = () => computeCreatorBalanceBreakdown(rows as Parameters<typeof computeCreatorBalanceBreakdown>[0], 0, Date.now());
  return { rows, ctx, refund, balance };
}
describe('refund ledger and resulting payout balance', () => {
  it('fully refunds an unpaid creator balance to zero without false debt', async () => {
    const f = ledgerFixture(); await f.refund('re_full', 3);
    expect(f.balance()).toMatchObject({ availableCents: 0, pendingCents: 0, debtCents: 0, payoutBlocked: false });
  });
  it('allocates cents cumulatively across partial refunds without over-clawing back earnings', async () => {
    const f = ledgerFixture(); await f.refund('re_1', 1); await f.refund('re_2', 1); await f.refund('re_3', 1);
    expect(f.rows.reduce((sum, r) => sum + Number(r.creatorEarningsCents), 0)).toBe(0);
    expect(f.rows.reduce((sum, r) => sum + Number(r.platformFeeCents), 0)).toBe(0);
    expect(f.balance().debtCents).toBe(0);
  });
  it('deduplicates the same refund across webhook deliveries', async () => {
    const f = ledgerFixture(); await f.refund('re_1', 1); await f.refund('re_1', 1);
    expect(f.rows).toHaveLength(2);
  });
  it('fails closed before writing when related refund history exceeds the scan limit', async () => {
    const f = ledgerFixture();
    for (let i = 0; i < 5001; i++) f.rows.push({ relatedCommercialRef: 'checkout:cs_1', amountCents: 0, creatorEarningsCents: 0, type: 'refund', status: 'settled' });
    await expect(f.refund('re_limit', 1)).rejects.toThrow('REFUND_HISTORY_LIMIT_EXCEEDED');
    expect(f.ctx.db.insert).not.toHaveBeenCalled();
  });
  it('does not double subtract historical reversed credits with a matching refund entry', () => {
    const f = ledgerFixture(); f.rows[0].balanceState = 'reversed';
    f.rows.push({ creatorId: 'creator1', creatorEarningsCents: -2, status: 'settled', type: 'refund', relatedCommercialRef: 'checkout:cs_1' });
    expect(f.balance()).toMatchObject({ availableCents: 0, debtCents: 0 });
  });
  it('recognizes debt when the refunded earnings have already been paid out', async () => {
    const f = ledgerFixture(); await f.refund('re_full', 3);
    expect(computeCreatorBalanceBreakdown(f.rows as Parameters<typeof computeCreatorBalanceBreakdown>[0], 2, Date.now()))
      .toMatchObject({ availableCents: 0, debtCents: 2, payoutBlocked: true });
  });
  it('makes a positive recovery adjustment available and reduces existing debt', async () => {
    const f = ledgerFixture(); await f.refund('re_full', 3);
    f.rows.push({ creatorId: 'creator1', creatorEarningsCents: 3, status: 'settled', type: 'adjustment' });
    expect(computeCreatorBalanceBreakdown(f.rows as Parameters<typeof computeCreatorBalanceBreakdown>[0], 2, Date.now()))
      .toMatchObject({ availableCents: 1, debtCents: 0, payoutBlocked: false });
  });
});
