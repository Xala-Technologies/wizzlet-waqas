import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Gem, Package, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kpiIconTone } from '@/lib/kpiIconTones';

export type OverviewTopProduct = {
  id: string;
  name: string;
  subscribersLabel: string;
  revenueLabel: string;
  growthLabel: string;
  growthPositive?: boolean;
  icon?: 'crown' | 'gem' | 'star' | 'package';
};

const iconMap = {
  crown: Crown,
  gem: Gem,
  star: Star,
  package: Package,
} as const;

const iconTones = [
  kpiIconTone.violet,
  kpiIconTone.emerald,
  kpiIconTone.sky,
  kpiIconTone.amber,
] as const;

export function OverviewTopProducts({ rows }: { rows: OverviewTopProduct[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-foreground">Top Products</h2>
        <Link
          to="/creator/products"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <Package className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-bold text-foreground">No products yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a product to start tracking top performers.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => {
            const Icon = iconMap[row.icon ?? 'package'];
            return (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-xl border border-border/80 px-3 py-2.5"
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    iconTones[i % iconTones.length],
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{row.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {row.subscribersLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-extrabold tabular-nums text-foreground">
                    {row.revenueLabel}
                  </p>
                  <p
                    className={cn(
                      'text-xs font-bold',
                      row.growthPositive === false
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {row.growthLabel}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
