import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { clayCard } from '@/lib/overviewClay';

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const ACTION_TONES = [
  kpiIconTone.violet,
  kpiIconTone.emerald,
  kpiIconTone.sky,
  kpiIconTone.amber,
] as const;

export function OverviewQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className={cn(clayCard, 'p-5 sm:p-6')}>
      <h2 className="mb-3 text-base font-extrabold tracking-tight text-foreground">Quick Actions</h2>
      <ul className="space-y-2">
        {actions.map((a, i) => (
          <li key={a.href + a.label}>
            <Link
              to={a.href}
              className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl shadow-[inset_0_-1px_3px_rgba(8,24,47,0.06),inset_0_1px_3px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_-1px_3px_rgba(0,0,0,0.28),inset_0_1px_3px_rgba(255,255,255,0.04)]',
                  ACTION_TONES[i % ACTION_TONES.length],
                )}
              >
                <a.icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex-1">{a.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
