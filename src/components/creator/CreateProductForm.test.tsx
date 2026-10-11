import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateProductForm } from './CreateProductForm';
import type { Id } from '../../../convex/_generated/dataModel';

const state = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('convex/react', () => ({
  useConvex: () => ({}), useMutation: () => state.save,
  useQuery: (_ref: unknown, args: unknown) => args === 'skip' ? undefined : [],
}));
vi.mock('@/lib/upload', () => ({ uploadImageToConvex: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));
beforeEach(() => { state.save.mockReset().mockResolvedValue('product1'); });
afterEach(cleanup);

describe('product trial promises match supported checkout', () => {
  it.each([false, true])('does not advertise or silently add an unsupported trial (editing=%s)', async (editing) => {
    render(<CreateProductForm creatorId={'creator1' as Id<'creators'>} creatorName="Audit Creator"
      initial={editing ? { id: 'product1', name: 'Existing draft', description: 'Draft body', priceCents: 500,
        billingPeriod: 'monthly', isFeatured: false, isActive: false, isLimited: false, isClosed: false } : undefined}
      onCancel={() => {}} onSaved={() => {}} />);
    expect(screen.queryByText(/-day free trial/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].description).not.toContain('Free trial:');
  });
});
