import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Earnings Snapshot
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">From recorded payments</p>
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

      {bars.length === 0 || bars.every((b) => b.valueCents <= 0) ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No payment history to chart yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex min-h-[9rem] flex-1 items-end gap-1.5 sm:gap-2">
          {bars.map((bar) => {
            const pct = Math.max(8, Math.round((bar.valueCents / max) * 100));
            return (
              <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all"
                  style={{ height: `${pct}%`, minHeight: bar.valueCents > 0 ? 12 : 4 }}
                  title={`$${(bar.valueCents / 100).toFixed(0)}`}
                />
                <span className="truncate text-[10px] font-semibold text-muted-foreground">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
