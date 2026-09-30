import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { clayCardInteractive, clayFillFromIconTone } from '@/lib/overviewClay';

export type DashboardKpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Prefer tones from `@/lib/kpiIconTones` (violet / emerald / sky / amber…). */
  iconClassName?: string;
  /** Honest period delta only — omit when unknown. */
  trendLabel?: string;
  trendPositive?: boolean;
  /** Optional muted caption under the trend pill (e.g. "vs. previous month"). */
  trendCaption?: string;
  /** Optional in-app route — makes the whole KPI card clickable. */
  href?: string;
};

/**
 * Colorful KPI cards used across creator (and shared) dashboards.
 * `variant="clay"` matches Creator Overview medium claymorphism.
 */
export function DashboardKpiStrip({
  items,
  className,
  variant = 'default',
}: {
  items: DashboardKpi[];
  className?: string;
  variant?: 'default' | 'clay';
}) {
  const clay = variant === 'clay';
  const cols =
    items.length <= 2
      ? 'sm:grid-cols-2'
      : items.length === 3
        ? 'sm:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className={cn('grid grid-cols-1', clay ? 'gap-4' : 'gap-3', cols, className)}>
      {items.map((item) => {
        const cardClassName = clay
          ? cn(
              clayCardInteractive,
              'p-5 sm:p-6',
              clayFillFromIconTone(item.iconClassName),
            )
          : cn(
              'rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5',
              item.href && 'transition-colors hover:border-primary/40',
            );
        const body = (
          <>
            <div className={cn('flex items-start justify-between gap-2', clay ? 'mb-4' : 'mb-3')}>
              <div
                className={cn(
                  'flex items-center justify-center',
                  clay
                    ? 'h-11 w-11 rounded-xl shadow-[inset_0_-2px_4px_rgba(8,24,47,0.06),inset_0_2px_4px_rgba(255,255,255,0.55)] dark:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.28),inset_0_2px_4px_rgba(255,255,255,0.04)]'
                    : 'h-10 w-10 rounded-xl',
                  item.iconClassName ?? 'bg-primary/10 text-primary',
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              {item.trendLabel ? (
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={cn(
                      'text-[11px] font-bold',
                      clay ? 'clay-chip px-2.5 py-1' : 'rounded-full px-2 py-0.5',
                      item.trendPositive
                        ? clay
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : item.trendPositive === false
                          ? clay
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : clay
                            ? 'bg-white/70 text-muted-foreground dark:bg-white/5'
                            : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.trendLabel}
                  </span>
                  {item.trendCaption ? (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {item.trendCaption}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
              {item.value}
            </p>
            <p
              className={cn(
                'text-sm font-semibold text-muted-foreground',
                clay ? 'mt-1.5' : 'mt-1',
              )}
            >
              {item.label}
            </p>
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
