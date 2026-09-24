import { cn } from '@/lib/utils';

/** Shared desktop dashboard sidebar width (admin / creator / member / demos). */
export const DASHBOARD_SIDEBAR_WIDTH_CLASS = 'w-[var(--sidebar-width)]';

/**
 * Shared main-content width for all dashboard shells.
 * Wide canvas so KPIs, tables, and feeds breathe on large screens.
 */
export const DASHBOARD_CONTENT_CLASS =
  'mx-auto w-full min-w-0 max-w-[var(--content-max)]';

/** Shared horizontal padding for dashboard top bars + page bodies. */
export const DASHBOARD_GUTTER_CLASS = 'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12';

type SidebarVariant = 'light' | 'dark';

/**
 * Desktop aside shell — Sweeph navy for dark chrome (not slate/black),
 * white card surface for light chrome.
 */
export function dashboardSidebarAsideClassName(
  mobile: boolean,
  extra?: string,
  variant: SidebarVariant = 'light',
): string {
  if (mobile) {
    return cn(
      'flex h-full min-h-0 w-full flex-col',
      variant === 'dark'
        ? 'bg-[var(--bg-sidebar)] text-[var(--text-primary)] dark:bg-[var(--bg-sidebar)]'
        : 'bg-card text-foreground',
      variant === 'dark' && '[color-scheme:dark]',
      extra,
    );
  }
  return cn(
    'hidden md:flex h-full shrink-0 flex-col',
    DASHBOARD_SIDEBAR_WIDTH_CLASS,
    variant === 'dark'
      ? 'border-r border-[var(--border-subtle)] bg-[#082735] text-[#F8FAFC]'
      : 'border-r border-border bg-[var(--bg-sidebar)] text-foreground',
    extra,
  );
}
