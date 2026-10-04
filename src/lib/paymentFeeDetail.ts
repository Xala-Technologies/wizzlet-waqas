export type PaymentFeeDetail = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  status: 'succeeded' | 'refunded' | 'chargeback' | 'failed' | 'settled' | string;
  dateMs: number;
  paymentRef: string | null;
  productName: string;
  typeLabel: string;
  amountCents: number;
  platformFeeCents: number;
  creatorEarningsCents: number;
  feePercentage: number;
};

export function moneyExact(cents: number): string {
  const abs = Math.abs(cents);
  const formatted = (abs / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function feePercentFromCents(amountCents: number, platformFeeCents: number): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  return Math.round((platformFeeCents / amountCents) * 1000) / 10;
}

export function splitAtPercent(amountCents: number, percent: number) {
  const platformFeeCents = Math.round((amountCents * percent) / 100);
  return {
    platformFeeCents,
    creatorEarningsCents: amountCents - platformFeeCents,
  };
}

export function paymentTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('renew')) return 'Renewal';
  if (t.includes('refund')) return 'Refund';
  if (t.includes('chargeback')) return 'Chargeback';
  if (t.includes('tip')) return 'Tip';
  if (t.includes('one') || t.includes('purchase')) return 'One-time purchase';
  if (t.includes('subscription') || t.includes('charge')) return 'Subscription';
  return type.replaceAll('_', ' ');
}

export function paymentStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'succeeded' || s === 'settled' || s === 'paid') return 'Succeeded';
  if (s === 'refunded') return 'Refunded';
  if (s === 'chargeback') return 'Chargeback';
  if (s === 'failed') return 'Failed';
  return status;
}

export function isRefundablePayment(
  status: string,
  amountCents: number,
  typeLabel?: string,
): boolean {
  if (amountCents <= 0) return false;
  const s = status.toLowerCase();
  if (s === 'refunded' || s === 'chargeback' || s === 'failed') return false;
  const t = (typeLabel ?? '').toLowerCase();
  if (t.includes('refund') || t.includes('chargeback')) return false;
  return s === 'succeeded' || s === 'settled' || s === 'paid';
}

export const BILLING_EXAMPLE_GROSS_CENTS = 5299;
