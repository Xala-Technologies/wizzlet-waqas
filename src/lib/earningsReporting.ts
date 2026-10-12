type Month = { month: string; revenueCents: number; grossCents: number };
type Payout = { status: string; amountCents: number; processedAt?: number; createdAt: number };

/** Monthly net paid amounts, actual creator earnings, and completed payouts. */
export function earningsSeries(months: Month[], payouts: Payout[]) {
  const rows = new Map(months.map(m => [m.month, { revenue: m.grossCents / 100, net: m.revenueCents / 100, payouts: 0 }]));
  for (const payout of payouts) {
    if (payout.status !== 'paid' && payout.status !== 'completed') continue;
    const month = new Date(payout.processedAt ?? payout.createdAt).toISOString().slice(0, 7);
    const row = rows.get(month) ?? { revenue: 0, net: 0, payouts: 0 };
    row.payouts += payout.amountCents / 100;
    rows.set(month, row);
  }
  return [...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8)
    .map(([month, row]) => ({ label: month, ...row, payouts: Math.round(row.payouts * 100) / 100 }));
}

export function chargesByType(payments: { amountCents: number; status: string; type: string }[]) {
  const totals = new Map<string, number>();
  for (const p of payments) {
    if (!['settled', 'paid'].includes(p.status) || p.amountCents <= 0 || ['adjustment', 'refund', 'dispute'].includes(p.type)) continue;
    const type = ['subscription_charge', 'renewal'].includes(p.type) ? 'Subscriptions'
      : p.type === 'tip' ? 'Tips' : p.type.includes('purchase') ? 'One-time purchases' : 'Other';
    totals.set(type, (totals.get(type) ?? 0) + p.amountCents);
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  const colors = ['hsl(239 84% 55%)', 'hsl(160 60% 40%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)'];
  return [...totals.entries()].map(([name, cents], i) => ({ name, cents, value: Math.round(cents / total * 1000) / 10, color: colors[i] }));
}

/** Failed/pending refunds are attempts, not completed reversals. */
export function transactionStatus(payment: { status: string; type: string; amountCents: number }): 'failed' | 'pending' | 'chargeback' | 'refunded' | 'succeeded' {
  if (payment.status === 'failed') return 'failed';
  if (payment.status === 'chargeback') return 'chargeback';
  if (payment.status === 'refunded') return 'refunded';
  if (!['settled', 'paid', 'succeeded'].includes(payment.status)) return 'pending';
  if (['Chargeback', 'dispute'].includes(payment.type)) return 'chargeback';
  if (['Refund', 'refund'].includes(payment.type) || payment.amountCents < 0) return 'refunded';
  return 'succeeded';
}
