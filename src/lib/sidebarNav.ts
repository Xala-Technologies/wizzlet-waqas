import { cn } from '@/lib/utils';

/** Shared Sweeph sidebar nav item surface (creator + member). */
export function sidebarNavItemClass(active: boolean, dark: boolean): string {
  return cn(
    'group flex h-12 items-center gap-3.5 rounded-[var(--radius-md)] px-4 text-[15px] font-medium transition-colors duration-150',
    dark
      ? active
        ? 'bg-[#075D60] font-semibold text-[#25E4D2]'
        : 'text-[#AFC1CA] hover:bg-white/[0.06] hover:text-[#F8FAFC]'
      : active
        ? 'bg-[var(--active-bg)] font-semibold text-[var(--active-text)]'
        : 'text-foreground hover:bg-muted/70',
  );
}

export function sidebarNavIconClass(active: boolean, dark: boolean): string {
  return cn(
    'h-5 w-5 shrink-0',
    dark
      ? active
        ? 'text-[#25E4D2]'
        : 'text-[#9FB4BE] group-hover:text-[#D6E5EB]'
      : active
        ? 'text-[var(--active-text)]'
        : 'text-muted-foreground group-hover:text-foreground',
  );
}

export function sidebarChildLinkClass(active: boolean, dark: boolean): string {
  return cn(
    'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors duration-150',
    dark
      ? active
        ? 'bg-white/[0.06] font-semibold text-[#25E4D2]'
        : 'text-[#8197A3] hover:bg-white/[0.06] hover:text-[#F8FAFC]'
      : active
        ? 'bg-[var(--active-bg)] font-semibold text-[var(--active-text)]'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  );
}

export function sidebarChildDotClass(active: boolean): string {
  return cn('h-1.5 w-1.5 shrink-0 rounded-full', active ? 'bg-[#25E4D2]' : 'bg-transparent');
}

export function sidebarFooterGhostClass(dark: boolean): string {
  return cn(
    'h-11 w-full justify-start gap-2.5 rounded-[var(--radius-md)] px-4 text-[15px] font-medium',
    dark
      ? 'text-[#AFC1CA] hover:bg-white/[0.06] hover:text-[#F8FAFC]'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );
}

export const SIDEBAR_BADGE_CLASS =
  'flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#FF3158] px-1.5 text-[12px] font-bold text-white';
