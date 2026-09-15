import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type OverviewSubscriber = {
  id: string;
  name: string;
  whenLabel: string;
  tierLabel: string;
  tierTone?: 'vip' | 'monthly' | 'free' | 'default';
  /** Auth user image or profile photo when available */
  avatarUrl?: string | null;
};

const tierClass: Record<NonNullable<OverviewSubscriber['tierTone']>, string> = {
  vip: 'bg-primary/10 text-primary border-primary/20',
  monthly: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400',
  free: 'bg-muted text-muted-foreground border-border',
  default: 'bg-muted text-muted-foreground border-border',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

export function OverviewRecentSubscribers({ rows }: { rows: OverviewSubscriber[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-foreground">
          Recent Subscribers
        </h2>
        <Link
          to="/creator/subscribers"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          All <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-bold text-foreground">No subscribers yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Publish your profile to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                  {initials(row.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.whenLabel}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                  tierClass[row.tierTone ?? 'default'],
                )}
              >
                {row.tierLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
