import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OverviewSubscriber = {
  id: string;
  name: string;
  whenLabel: string;
  tierLabel: string;
  tierTone?: 'vip' | 'monthly' | 'free' | 'default';
};

const tierClass: Record<NonNullable<OverviewSubscriber['tierTone']>, string> = {
  vip: 'bg-primary/10 text-primary border-primary/20',
  monthly: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400',
  free: 'bg-muted text-muted-foreground border-border',
  default: 'bg-muted text-muted-foreground border-border',
};

export function OverviewRecentSubscribers({ rows }: { rows: OverviewSubscriber[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-foreground">
          Recent Subscribers
        </h2>
        <Link
          to="/creator/subscribers"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          All <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-bold text-foreground">No subscribers yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Publish your profile to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const initial = row.name.charAt(0).toUpperCase();
            return (
              <li key={row.id} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
                  aria-hidden
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.whenLabel}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    tierClass[row.tierTone ?? 'default'],
                  )}
                >
                  {row.tierLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
