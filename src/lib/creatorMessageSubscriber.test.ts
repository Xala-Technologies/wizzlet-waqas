import { describe, expect, it } from 'vitest';
import {
  mapPlan,
  mapStatus,
  pickSubscriberDetailRow,
  subscriptionPlanHeadline,
} from './creatorMessageSubscriber';

describe('creatorMessageSubscriber labels', () => {
  it('maps plan tiers from amount', () => {
    expect(mapPlan(undefined)).toBe('—');
    expect(mapPlan(999)).toBe('Monthly');
    expect(mapPlan(2999)).toBe('Premium');
    expect(mapPlan(5000)).toBe('VIP');
  });

  it('maps subscription statuses', () => {
    expect(mapStatus('active')).toBe('active');
    expect(mapStatus('cancelled')).toBe('cancelled');
    expect(mapStatus('canceled')).toBe('cancelled');
    expect(mapStatus('trialing')).toBe('trial');
  });

  it('prefers active row then newest when picking detail', () => {
    expect(
      pickSubscriberDetailRow([
        { status: 'cancelled', id: 'new' },
        { status: 'active', id: 'old-active' },
      ])?.id,
    ).toBe('old-active');
    expect(
      pickSubscriberDetailRow([
        { status: 'cancelled', id: 'newest' },
        { status: 'cancelled', id: 'older' },
      ])?.id,
    ).toBe('newest');
  });

  it('does not headline canceled members as Premium alone', () => {
    expect(subscriptionPlanHeadline('Premium', 'cancelled')).toBe(
      'Canceled · was Premium',
    );
    expect(subscriptionPlanHeadline('Premium', 'active')).toBe('Premium');
    expect(subscriptionPlanHeadline('Monthly', 'trial')).toBe('Monthly · Trial');
  });
});
