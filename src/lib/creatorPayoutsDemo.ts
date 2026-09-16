/**
 * Sample Payouts data for design review when the creator has no payout history yet.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export const CREATOR_PAYOUTS_DEMO_KPIS = {
  earned: 12_480,
  available: 4160,
  pending: 1200,
  paidOut: 8320,
  minimumPayout: 50,
} as const;

export type DemoPayoutRow = {
  id: string;
  amount: number;
  status: string;
  method: string;
  created_at: number;
  processed_at: number | null;
};

export const CREATOR_PAYOUTS_DEMO_HISTORY: DemoPayoutRow[] = [
  {
    id: 'demo-po-1',
    amount: 2400,
    status: 'completed',
    method: 'bank_transfer',
    created_at: daysAgo(12),
    processed_at: daysAgo(10),
  },
  {
    id: 'demo-po-2',
    amount: 1850,
    status: 'completed',
    method: 'paypal',
    created_at: daysAgo(28),
    processed_at: daysAgo(26),
  },
  {
    id: 'demo-po-3',
    amount: 1200,
    status: 'pending',
    method: 'bank_transfer',
    created_at: daysAgo(2),
    processed_at: null,
  },
];

export function shouldUseCreatorPayoutsDemo(opts: {
  historyCount: number;
  available: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.historyCount === 0 && opts.available <= 0;
}
