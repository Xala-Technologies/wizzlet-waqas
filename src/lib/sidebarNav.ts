import { cn } from '@/lib/utils';

/** Shared Sweeph sidebar nav item surface (creator + member). */
export function sidebarNavItemClass(active: boolean, dark: boolean): string {
  return cn(
    'group flex h-12 items-center gap-3.5 rounded-[var(--radius-md)] px-4 text-[15px] font-medium transition-colors duration-150',
    dark
      ? active
        ? 'bg-[var(--active-bg)] font-semibold text-[var(--active-text)]'
        : 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
      : active
        ? 'bg-[var(--active-bg)] font-semibold text-[var(--active-text)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]',
  );
}

export function sidebarNavIconClass(active: boolean, dark: boolean): string {
  return cn(
    'h-5 w-5 shrink-0',
    dark
      ? active
        ? 'text-[var(--brand-primary)]'
        : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
      : active
        ? 'text-[var(--brand-primary)]'
        : 'text-[var(--text-muted)] group-hover:text-[var(--brand-700)]',
  );
}

export function sidebarChildLinkClass(active: boolean, dark: boolean): string {
  return cn(
    'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors duration-150',
    dark
      ? active
        ? 'bg-white/[0.06] font-semibold text-[var(--active-text)]'
        : 'text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
      : active
        ? 'bg-[var(--active-bg)] font-semibold text-[var(--active-text)]'
        : 'text-[var(--text-muted)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]',
  );
}

export function sidebarChildDotClass(active: boolean): string {
  return cn(
    'h-1.5 w-1.5 shrink-0 rounded-full',
    active ? 'bg-[var(--brand-primary)]' : 'bg-transparent',
  );
}

export function sidebarFooterGhostClass(dark: boolean): string {
  return cn(
    'h-11 w-full justify-start gap-2.5 rounded-[var(--radius-md)] px-4 text-[15px] font-medium',
    dark
      ? 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]',
  );
}

export const SIDEBAR_BADGE_CLASS =
  'flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[12px] font-bold text-white';

/** Soft section label inside dashboard sidebars — hierarchy without redesign. */
export function sidebarNavGroupLabelClass(dark: boolean): string {
  return cn(
    'px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em]',
    'first:pt-1',
    dark ? 'text-[var(--text-muted)]' : 'text-muted-foreground/80',
  );
}
