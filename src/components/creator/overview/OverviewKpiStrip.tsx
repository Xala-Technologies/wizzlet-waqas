import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OverviewKpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
  /** Honest period delta only — omit when unknown. */
  trendLabel?: string;
  trendPositive?: boolean;
};

export function OverviewKpiStrip({ items }: { items: OverviewKpi[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                item.iconClassName ?? 'bg-primary/10 text-primary',
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden />
            </div>
            {item.trendLabel ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  item.trendPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                )}
              >
                {item.trendLabel}
              </span>
            ) : null}
          </div>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
            {item.value}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
