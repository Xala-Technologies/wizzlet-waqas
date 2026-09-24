import {
  CreditCard,
  Eye,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { kpiIconTone } from '@/lib/kpiIconTones';

export type OverviewActivityTone = 'subscriber' | 'payment' | 'message' | 'milestone';

export type OverviewActivityRow = {
  id: string;
  title: string;
  whenLabel: string;
  amountLabel?: string;
  unread?: boolean;
  tone: OverviewActivityTone;
};

const toneIcon: Record<OverviewActivityTone, typeof UserPlus> = {
  subscriber: UserPlus,
  payment: CreditCard,
  message: MessageSquare,
  milestone: Eye,
};

const toneClass: Record<OverviewActivityTone, string> = {
  subscriber: kpiIconTone.emerald,
  payment: kpiIconTone.violet,
  message: kpiIconTone.sky,
  milestone: kpiIconTone.amber,
};

export function OverviewRecentActivity({ rows }: { rows: OverviewActivityRow[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
        Recent Activity
      </h2>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-bold text-foreground">No activity yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Subscriber and payment events will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const Icon = toneIcon[row.tone];
            return (
              <li key={row.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    toneClass[row.tone],
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {row.unread ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card"
                      aria-label="Unread"
                    />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.whenLabel}</p>
                </div>
                {row.amountLabel ? (
                  <span className="shrink-0 text-sm font-extrabold tabular-nums text-foreground">
                    {row.amountLabel}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
