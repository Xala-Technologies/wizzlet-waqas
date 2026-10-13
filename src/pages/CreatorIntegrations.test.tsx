import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreatorIntegrations from './CreatorIntegrations';

const f = vi.hoisted(() => ({
  connection: { connected: false } as Record<string, unknown>,
  bot: undefined as { configured: boolean } | undefined,
  roles: vi.fn(), mutation: vi.fn(), success: vi.fn(),
}));
vi.mock('convex/react', () => ({
  useMutation: () => f.mutation, useAction: () => f.roles,
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    switch (getFunctionName(ref)) {
      case 'creators/queries:myCreator': return { _id: 'creator1' };
      case 'discord/queries:connection': return f.connection;
      case 'discord/queries:botStatus': return f.bot;
      case 'products/mutations:listByCreator': return [];
    }
  },
}));
vi.mock('sonner', () => ({ toast: { success: f.success, message: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => children }));
beforeEach(() => { vi.clearAllMocks(); f.connection = { connected: false }; f.bot = { configured: false }; f.roles.mockResolvedValue([]); });
afterEach(cleanup);
function view(query = '') { return <MemoryRouter initialEntries={[`/creator/integrations?${query}`]}><CreatorIntegrations /></MemoryRouter>; }

it('disables connection while configuration is loading', () => {
  f.bot = undefined; render(view());
  expect(screen.getByRole('button', { name: 'Add to Discord' })).toBeDisabled();
  expect(screen.getByText('Checking Discord availability…')).toBeInTheDocument();
});
it('explains and disables connection when the bot is unavailable', () => {
  render(view());
  expect(screen.getByRole('button', { name: 'Add to Discord' })).toBeDisabled();
  expect(screen.getByText('Discord connections are currently unavailable.')).toBeInTheDocument();
  expect(f.mutation).not.toHaveBeenCalled();
});
it('enables connection once configuration arrives', () => {
  f.bot = undefined; const rendered = render(view());
  f.bot = { configured: true }; rendered.rerender(view());
  expect(screen.getByRole('button', { name: 'Add to Discord' })).toBeEnabled();
  expect(screen.queryByText(/Checking Discord availability/)).not.toBeInTheDocument();
});
it('does not claim connection success from a URL parameter alone', () => {
  render(view('discord=connected'));
  expect(f.success).not.toHaveBeenCalled();
});
it('confirms connection after the saved connection is available', async () => {
  const rendered = render(view('discord=connected'));
  f.connection = { connected: true, guildName: 'Fixture server', guildId: 'guild1', memberCount: 42 };
  rendered.rerender(view('discord=connected'));
  await waitFor(() => expect(f.success).toHaveBeenCalledWith('Discord server connected'));
  expect(f.roles).toHaveBeenCalled();
  expect(screen.getAllByText('Fixture server').length).toBeGreaterThan(0);
});
it('keeps explicit demo connection separate from real connection confirmation', () => {
  render(view('demo=1&discord=connected'));
  expect(screen.getByText(/Sample preview for design review/)).toBeInTheDocument();
  expect(f.success).not.toHaveBeenCalled();
  expect(f.roles).not.toHaveBeenCalled();
});
