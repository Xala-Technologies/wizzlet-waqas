import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const crons = readFileSync(resolve(__dirname, '../../convex/crons.ts'), 'utf8');
const batch = readFileSync(resolve(__dirname, '../../convex/payouts/batch.ts'), 'utf8');
const stripeNode = readFileSync(
  resolve(__dirname, '../../convex/payments/stripeNode.ts'),
  'utf8',
);
const stripeDb = readFileSync(
  resolve(__dirname, '../../convex/payments/stripeDb.ts'),
  'utf8',
);

describe('Monday Connect payouts surface', () => {
  it('registers weekly Monday 09:00 UTC cron for Connect payouts', () => {
    expect(crons).toMatch(/dayOfWeek:\s*"monday"/);
    expect(crons).toMatch(/hourUTC:\s*9/);
    expect(crons).toContain('runWeeklyConnectPayouts');
  });

  it('gates auto batch on featureFlags.autoPayoutsEnabled', () => {
    expect(batch).toContain('isAutoPayoutsEnabled');
    expect(batch).toContain('weekBatchKey');
    const defaults = readFileSync(
      resolve(__dirname, '../../convex/lib/payoutDefaults.ts'),
      'utf8',
    );
    expect(defaults).toContain('autoPayoutsEnabled');
  });

  it('handles refunds, disputes, and Connect account.updated webhooks', () => {
    expect(stripeNode).toContain('charge.refunded');
    expect(stripeNode).toContain('charge.dispute.created');
    expect(stripeNode).toContain('account.updated');
    expect(stripeDb).toContain('applyChargeRefund');
    expect(stripeDb).toContain('persistConnectStatusByStripeAccountId');
  });

  it('guards Transfers when platform available balance is empty', () => {
    expect(stripeNode).toContain('STRIPE_INSUFFICIENT_BALANCE');
    expect(stripeNode).toMatch(/hasAvailable/);
  });
});
