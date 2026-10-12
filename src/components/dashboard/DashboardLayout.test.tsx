import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardLayout } from './DashboardLayout';
import { Seo } from '@/components/Seo';

// Keep the real layout and router; isolate backend subscriptions and unrelated chrome.
vi.mock('./CreatorSidebar', () => ({ CreatorSidebar: () => null }));
vi.mock('./MemberSidebar', () => ({ MemberSidebar: () => null }));
vi.mock('./AdminSidebar', () => ({ AdminSidebar: () => null }));
vi.mock('./CreatorTopBar', () => ({ CreatorTopBar: () => null }));
vi.mock('./MemberTopBar', () => ({ MemberTopBar: () => null }));
vi.mock('./AdminTopBar', () => ({ AdminTopBar: () => null }));
vi.mock('./MobileTopBar', () => ({ MobileTopBar: () => null }));
vi.mock('./UnreadMessageWatcher', () => ({ UnreadMessageWatcher: () => null }));
vi.mock('./SupportChatWidget', () => ({ SupportChatWidget: () => null }));
vi.mock('./AdminQueryBoundary', () => ({ AdminQueryBoundary: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/contexts/SupportChatContext', () => ({ SupportChatProvider: ({ children }: { children: ReactNode }) => children }));

beforeEach(() => { document.title = 'Sign in — Sweeph'; });
afterEach(cleanup);

describe('dashboard document metadata', () => {
  it.each([
    ['admin', '/admin', '/admin/customers', 'Overview', 'Customers'],
    ['member', '/dashboard', '/dashboard/saved', 'Home', 'Saved'],
    ['creator', '/creator/settings', '/creator/settings?tab=security', 'Settings', 'Security'],
    ['creator', '/creator/earnings', '/creator/earnings#tax-docs', 'Finance', 'Tax Documents'],
  ] as const)('updates %s titles across route changes', (type, from, to, initial, next) => {
    render(<MemoryRouter initialEntries={[from]}><DashboardLayout type={type}>
      <Link to={to}>Next page</Link>
    </DashboardLayout></MemoryRouter>);
    expect(document.title).toBe(`${initial} — Sweeph`);
    fireEvent.click(screen.getByRole('link', { name: 'Next page' }));
    expect(document.title).toBe(`${next} — Sweeph`);
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  it('hands metadata back to a public page after leaving the dashboard', () => {
    render(<MemoryRouter initialEntries={['/admin']}><Routes>
      <Route path="/admin" element={<DashboardLayout type="admin"><Link to="/">Home</Link></DashboardLayout>} />
      <Route path="/" element={<Seo title="Home — Sweeph" description="Public home" />} />
    </Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(document.title).toBe('Home — Sweeph');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  });

  it('updates a detail title after data loads and removes it when leaving the detail', () => {
    const view = render(<MemoryRouter initialEntries={['/dashboard/manage-subscription']}>
      <DashboardLayout type="member">Loading</DashboardLayout>
    </MemoryRouter>);
    expect(document.title).toBe('Manage Subscription — Sweeph');
    view.rerender(<MemoryRouter><DashboardLayout type="member" documentTitle="Manage Test Creator — Sweeph">
      Subscription details
    </DashboardLayout></MemoryRouter>);
    expect(document.title).toBe('Manage Test Creator — Sweeph');
    view.rerender(<MemoryRouter><DashboardLayout type="member">Subscription not found</DashboardLayout></MemoryRouter>);
    expect(document.title).toBe('Manage Subscription — Sweeph');
  });
});
