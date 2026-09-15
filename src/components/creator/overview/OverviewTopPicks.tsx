import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { sportVisual } from '@/lib/sportVisual';
import { cn } from '@/lib/utils';

export type TopPickRow = {
  id: string;
  label: string;
  winRateLabel: string;
  profitLabel: string;
  /** Sport key or free-text used for icon (e.g. NBA, NFL) */
  sport?: string;
};

export function OverviewTopPicks({ rows }: { rows: TopPickRow[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-foreground">
          Top Performing Picks
        </h2>
        <Link
          to="/creator/performance-tracker"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Tracker <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <Target className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-bold text-foreground">No settled picks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Win rate by pick appears after results settle.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => {
            const visual = sportVisual(row.sport || row.label);
            return (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-xl border border-border/80 px-3 py-2.5"
              >
                <span
                  className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base',
                    visual.chipClass,
                  )}
                  aria-hidden
                >
                  {visual.emoji}
                  <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-extrabold text-background">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{row.label}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{row.winRateLabel}</p>
                </div>
                <span className="shrink-0 text-sm font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {row.profitLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
