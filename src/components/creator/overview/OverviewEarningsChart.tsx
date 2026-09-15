import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { earningsMonthLabel } from '@/lib/sportVisual';
import { cn } from '@/lib/utils';

export type EarningsBar = {
  label: string;
  valueCents: number;
};

export function OverviewEarningsChart({
  totalLabel,
  bars,
}: {
  totalLabel: string;
  bars: EarningsBar[];
}) {
  const max = Math.max(...bars.map((b) => b.valueCents), 1);
  const hasData = bars.length > 0 && bars.some((b) => b.valueCents > 0);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Earnings Snapshot
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Net from recorded payments</p>
        </div>
        <Link
          to="/creator/earnings"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
        {totalLabel}
      </p>

      {!hasData ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No payment history to chart yet.
          </p>
        </div>
      ) : (
        <div className="relative mt-6 flex min-h-[11rem] flex-1 flex-col">
          {/* Chart plot area — fixed height so bar % heights resolve correctly */}
          <div className="relative flex min-h-0 flex-1 items-end gap-2 px-0.5 pb-1 pt-2 sm:gap-2.5">
            {/* Subtle horizontal guides like the mockup */}
            <div
              className="pointer-events-none absolute inset-x-0 top-2 bottom-1 flex flex-col justify-between"
              aria-hidden
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-border/50" />
              ))}
            </div>

            {bars.map((bar) => {
              const pct = Math.max(
                bar.valueCents > 0 ? 12 : 4,
                Math.round((bar.valueCents / max) * 100),
              );
              const dollars = (bar.valueCents / 100).toFixed(0);
              const label = earningsMonthLabel(bar.label);
              return (
                <div
                  key={bar.label}
                  className="group relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div
                    className={cn(
                      'w-full max-w-[2.75rem] rounded-t-lg transition-all duration-300',
                      'bg-gradient-to-t from-primary to-violet-400',
                      'shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.45)]',
                      'group-hover:brightness-110',
                    )}
                    style={{ height: `${pct}%` }}
                    title={`$${dollars}`}
                    role="img"
                    aria-label={`${label}: $${dollars}`}
                  />
                  {/* Hover value chip */}
                  <span
                    className={cn(
                      'pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 -translate-y-full',
                      'rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background',
                      'opacity-0 transition-opacity group-hover:opacity-100',
                    )}
                  >
                    ${dollars}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2 sm:gap-2.5">
            {bars.map((bar) => (
              <span
                key={`lbl-${bar.label}`}
                className="min-w-0 flex-1 truncate text-center text-[11px] font-bold text-muted-foreground"
              >
                {earningsMonthLabel(bar.label)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
