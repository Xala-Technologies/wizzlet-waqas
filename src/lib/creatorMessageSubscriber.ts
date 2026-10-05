/** Creator Messages CRM / header labels for subscriber threads. */

export type SubStatus = 'active' | 'cancelled' | 'trial';

export function mapPlan(amountCents: number | undefined): string {
  if (amountCents == null) return '—';
  if (amountCents >= 5000) return 'VIP';
  if (amountCents >= 2500) return 'Premium';
  return 'Monthly';
}

export function mapStatus(status: string | undefined): SubStatus {
  if (status === 'active') return 'active';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'trial';
}

/**
 * Prefer the newest subscription row; if any row is active, keep that.
 * Callers should pass rows newest-first (createdAt desc).
 */
export function pickSubscriberDetailRow<T extends { status: string }>(
  rows: T[],
): T | undefined {
  if (rows.length === 0) return undefined;
  const active = rows.find((r) => r.status === 'active');
  if (active) return active;
  return rows[0];
}

/** Chat subtitle / CRM plan line — never imply an active paid plan when canceled. */
export function subscriptionPlanHeadline(
  plan: string,
  status: SubStatus | 'support',
): string {
  if (status === 'support') return '—';
  if (status === 'cancelled') {
    return plan !== '—' ? `Canceled · was ${plan}` : 'Canceled';
  }
  if (status === 'trial') {
    return plan !== '—' ? `${plan} · Trial` : 'Trial';
  }
  return plan;
}
