import { describe, expect, it } from 'vitest';
import { productRemoveMode } from '../../convex/lib/productRemove';

describe('productRemoveMode (J2 soft-archive)', () => {
  it('archives when a subscription is linked', () => {
    expect(productRemoveMode(true)).toBe('archive');
  });

  it('hard-deletes when no subscription history', () => {
    expect(productRemoveMode(false)).toBe('delete');
  });
});
