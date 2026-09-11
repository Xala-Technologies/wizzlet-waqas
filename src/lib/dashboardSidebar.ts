import { cn } from '@/lib/utils';

/** Shared desktop dashboard sidebar width (admin / creator / member / demos). */
export const DASHBOARD_SIDEBAR_WIDTH_CLASS = 'w-[248px]';

/** Desktop aside shell shared by all role sidebars. */
export function dashboardSidebarAsideClassName(mobile: boolean, extra?: string): string {
  if (mobile) {
    return cn('flex h-full min-h-0 w-full flex-col bg-card', extra);
  }
  return cn(
    'hidden md:flex h-full shrink-0 flex-col border-r border-border bg-card',
    DASHBOARD_SIDEBAR_WIDTH_CLASS,
    extra,
  );
}
