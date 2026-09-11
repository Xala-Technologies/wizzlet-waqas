import { cn } from '@/lib/utils';

/** Shared solid segmented-control track (matches TabsList). */
export const segmentedTrackClassName =
  'inline-flex h-11 min-h-11 flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1 text-muted-foreground';

/** Shared solid segmented-control item (matches TabsTrigger). */
export function segmentedItemClassName(active: boolean): string {
  return cn(
    'inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-support font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    active
      ? 'bg-background text-foreground'
      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
  );
}
