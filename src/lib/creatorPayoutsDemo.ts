/**
 * Sample Payouts data aligned to the Prizelet Payouts mockup.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export const CREATOR_PAYOUTS_DEMO_KPIS = {
  available: 9_860,
  paidOut: 82_430,
  paidOutDelta: 28,
  nextPayoutLabel: 'Feb 7, 2025',
  nextPayoutRemaining: '2 days remaining',
  methodMasked: '**** 4582',
  methodLabel: 'Wise (USD)',
  scheduleLabel: 'Weekly (Fridays)',
  minimumPayout: 50,
  pending: 1_610,
  earned: 12_480,
} as const;

export type DemoPayoutRow = {
  id: string;
  amount: number;
  status: string;
  method: string;
  referenceId: string;
  created_at: number;
  processed_at: number | null;
};

const DEMO_AMOUNTS = [
  4320.5, 3890.0, 4125.75, 3650.0, 2980.25, 4550.0, 3210.5, 2780.0, 5100.0, 3455.75, 2900.0,
  3800.5, 4200.0, 2650.25, 3990.0, 3100.5, 2755.0, 4800.0, 3520.75, 2680.0, 4150.5, 3050.0,
  2890.25, 3725.0,
];

/** 24 rows so pagination matches the mockup (“Showing 1–10 of 24”). */
export const CREATOR_PAYOUTS_DEMO_HISTORY: DemoPayoutRow[] = DEMO_AMOUNTS.map((amount, i) => {
  const weekOffset = i * 7 + 3;
  return {
    id: `demo-po-${i + 1}`,
    amount,
    status: 'completed',
    method: 'Wise (USD)',
    referenceId: `po_${['7H2kL9m', '3Kp9Qx1', '8Nm2Rt4', '5Vb7Yw0', '1Cd4Ef6', '9Gh3Ij8', '2Kl5Mn0', '6Op1Qr3', '4St7Uv9', '0Wx2Yz5'][i % 10]}${i > 9 ? String(i) : ''}`,
    created_at: daysAgo(weekOffset),
    processed_at: daysAgo(weekOffset - 1),
  };
});

export const CREATOR_PAYOUTS_TIPS = [
  'Complete your identity verification.',
  'Use a supported payment method (e.g. Wise).',
  'Keep your tax information up to date.',
  'Meet the minimum payout amount.',
  'Allow 1–3 business days for processing.',
] as const;

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
