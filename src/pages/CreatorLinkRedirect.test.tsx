import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreatorLinkRedirect from './CreatorLinkRedirect';

const fixture = vi.hoisted(() => ({ query: vi.fn(), click: vi.fn(), store: vi.fn(), replace: vi.fn() }));
vi.mock('convex/react', () => ({ useConvex: () => client, useMutation: () => fixture.click }));
vi.mock('@/lib/creatorLinkHandoff', () => ({ sanitizeCreatorLinkId: (id: string) => id, storeCreatorLinkId: fixture.store }));
const client = { query: fixture.query };
const originalLocation = window.location;
beforeEach(() => {
  vi.resetAllMocks();
  fixture.click.mockResolvedValue(null);
  Object.defineProperty(window, 'location', { configurable: true, value: { replace: fixture.replace } });
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});
function show() {
  render(<MemoryRouter initialEntries={['/go/fixturelink123']}><Routes><Route path="/go/:linkId" element={<CreatorLinkRedirect />} /></Routes></MemoryRouter>);
}
it.each(['javascript:void(0)', 'not-a-url', 'data:text/plain,hello'])('blocks a legacy destination %s before navigation or attribution', async (url) => {
  fixture.query.mockResolvedValue({ name: 'Legacy', url }); show();
  expect(await screen.findByRole('heading', { name: 'Tracking link unavailable' })).toBeInTheDocument();
  expect(fixture.replace).not.toHaveBeenCalled();
  expect(fixture.click).not.toHaveBeenCalled();
  expect(fixture.store).not.toHaveBeenCalled();
});
it('preserves valid tracking and navigation even when click recording fails', async () => {
  fixture.query.mockResolvedValue({ name: 'Valid', url: 'https://example.com/path?q=1' });
  fixture.click.mockRejectedValue(new Error('Offline')); show();
  await waitFor(() => expect(fixture.replace).toHaveBeenCalledWith('https://example.com/path?q=1'));
  expect(fixture.store).toHaveBeenCalledWith('fixturelink123');
  expect(fixture.click).toHaveBeenCalledTimes(1);
});
