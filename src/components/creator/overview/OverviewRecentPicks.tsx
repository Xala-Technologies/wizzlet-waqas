import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { sportVisual } from '@/lib/sportVisual';
import { cn } from '@/lib/utils';

export type OverviewPickRow = {
  id: string;
  dateLabel: string;
  event: string;
  sport: string;
  result: 'win' | 'loss' | 'push' | 'pending';
  profitLabel: string;
  profitPositive?: boolean;
};

const resultStyle: Record<OverviewPickRow['result'], string> = {
  win: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
  loss: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
  push: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400',
};

export function OverviewRecentPicks({ rows }: { rows: OverviewPickRow[] }) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-foreground">Recent Picks</h2>
        <Link
          to="/creator/performance-tracker"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm font-bold text-foreground">No picks logged yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Track picks in Play performance to populate this table.
          </p>
          <Link
            to="/creator/performance-tracker"
            className="mt-4 text-sm font-bold text-primary hover:underline"
          >
            Open tracker
          </Link>
        </div>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-bold">Date</th>
                <th className="px-2 py-2 font-bold">Match</th>
                <th className="px-2 py-2 font-bold">Result</th>
                <th className="px-2 py-2 text-right font-bold">Profit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const visual = sportVisual(row.sport);
                return (
                  <tr key={row.id} className="border-b border-border/70 last:border-0">
                    <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                      {row.dateLabel}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base',
                            visual.chipClass,
                          )}
                          aria-hidden
                          title={row.sport}
                        >
                          {visual.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug text-foreground">{row.event}</p>
                          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                            {row.sport}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                          resultStyle[row.result],
                        )}
                      >
                        {row.result}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-2 py-3 text-right font-bold tabular-nums',
                        row.profitPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : row.result === 'loss'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-foreground',
                      )}
                    >
                      {row.profitLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
