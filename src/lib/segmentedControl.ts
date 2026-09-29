import { cn } from '@/lib/utils';

/** Shared solid segmented-control track (matches TabsList). */
export const segmentedTrackClassName =
  'inline-flex min-h-11 flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1 text-muted-foreground';

/** Shared solid segmented-control item (matches TabsTrigger). */
export function segmentedItemClassName(active: boolean): string {
  return cn(
    'inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-support font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    active
      ? 'bg-primary/10 text-foreground'
      : 'text-foreground hover:bg-muted',
  );
}

/**
 * Discovery filter chips — DubClub-style pills under a full-width search.
 * Active = solid foreground; idle = white + thin border; icons sit left of label.
 */
export const filterBarTrackClassName =
  'flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function filterBarItemClassName(active: boolean): string {
  return cn(
    'inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5',
    'text-sm font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    active
      ? 'border border-foreground bg-foreground text-background'
      : 'border border-border bg-card text-foreground hover:border-foreground/35',
  );
}
