import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { clayCardInteractive, clayFillFromIconTone } from '@/lib/overviewClay';

export type OverviewKpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Prefer tones from `@/lib/kpiIconTones` (violet / emerald / sky / amber…). */
  iconClassName?: string;
  /** Honest period delta only — omit when unknown. */
  trendLabel?: string;
  trendPositive?: boolean;
  trendCaption?: string;
  href?: string;
};

/**
 * Claymorphic KPI strip — Creator Overview only.
 * Soft pastel fills + dual inset / outer clay shadows.
 */
export function OverviewKpiStrip({
  items,
  className,
}: {
  items: OverviewKpi[];
  className?: string;
}) {
  const cols =
    items.length <= 2
      ? 'sm:grid-cols-2'
      : items.length === 3
        ? 'sm:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className={cn('grid grid-cols-1 gap-4', cols, className)}>
      {items.map((item) => {
        const cardClassName = cn(
          clayCardInteractive,
          'p-5 sm:p-6',
          clayFillFromIconTone(item.iconClassName),
        );
        const body = (
          <>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl shadow-[inset_0_-2px_4px_rgba(8,24,47,0.06),inset_0_2px_4px_rgba(255,255,255,0.55)] dark:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.28),inset_0_2px_4px_rgba(255,255,255,0.04)]',
                  item.iconClassName ?? 'bg-primary/10 text-primary',
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              {item.trendLabel ? (
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={cn(
                      'clay-chip px-2.5 py-1 text-[11px] font-bold',
                      item.trendPositive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : item.trendPositive === false
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                          : 'bg-white/70 text-muted-foreground dark:bg-white/5',
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
            <p className="mt-1.5 text-sm font-semibold text-muted-foreground">{item.label}</p>
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
