import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type DashboardKpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Prefer tones from `@/lib/kpiIconTones` (violet / emerald / sky / amber…). */
  iconClassName?: string;
  /** Honest period delta only — omit when unknown. */
  trendLabel?: string;
  trendPositive?: boolean;
  /** Optional in-app route — makes the whole KPI card clickable. */
  href?: string;
};

/**
 * Colorful KPI cards used across creator (and shared) dashboards.
 * Visual source of truth: Creator Overview.
 */
export function DashboardKpiStrip({
  items,
  className,
}: {
  items: DashboardKpi[];
  className?: string;
}) {
  const cols =
    items.length <= 2
      ? 'sm:grid-cols-2'
      : items.length === 3
        ? 'sm:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className={cn('grid grid-cols-1 gap-3', cols, className)}>
      {items.map((item) => {
        const cardClassName = cn(
          'rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5',
          item.href && 'transition-colors hover:border-primary/40',
        );
        const body = (
          <>
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
                      : item.trendPositive === false
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-muted text-muted-foreground',
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
          </>
        );

        if (item.href) {
          return (
            <Link key={item.label} to={item.href} className={cardClassName}>
              {body}
            </Link>
          );
        }

        return (
          <div key={item.label} className={cardClassName}>
            {body}
          </div>
        );
      })}
    </section>
  );
}
