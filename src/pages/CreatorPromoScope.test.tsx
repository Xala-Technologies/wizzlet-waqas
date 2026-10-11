import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import CreatorPromoCodes from './CreatorPromoCodes';

const data = vi.hoisted(() => ({ promos: [], creator: { id: 'creator1' } }));
vi.mock('convex/react', () => ({ useQuery: () => data.promos, useMutation: () => vi.fn() }));
vi.mock('@/hooks/useCreatorProfile', () => ({ useCreatorProfile: () => ({ creator: data.creator, loading: false }) }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => children }));
afterEach(cleanup);

it('does not offer a product scope that the saved promotion cannot enforce', () => {
  render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorPromoCodes /></MemoryRouter>);
  fireEvent.click(screen.getAllByRole('button', { name: 'Create Promo Code' })[0]);
  const dialog = within(screen.getByRole('dialog'));
  const scope = dialog.getAllByRole('combobox')[0];
  expect(scope).toHaveTextContent('All products');
  expect(scope).toBeDisabled();
});
