import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

const tabs = [
  { label: 'Broadcast', href: '/admin/creator-messaging', description: 'Message creators' },
  { label: 'Growth Inbox', href: '/admin/growth-manager-inbox', description: 'Coaching threads' },
] as const;

function formatBadge(n: number): string | undefined {
  if (n <= 0) return undefined;
  return n > 9 ? '9+' : String(n);
}

/** Shared Support workspace tabs — Broadcast vs Growth Inbox. */
export function AdminSupportTabs() {
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  const growthUnread = useQuery(
    api.support.mutations.unreadCountAdminGrowth,
    user ? {} : 'skip',
  );

  return (
    <div
      role="tablist"
      aria-label="Support sections"
      className="inline-flex gap-0.5 rounded-lg border border-border bg-muted/40 p-1"
    >
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const badge =
          tab.href === '/admin/growth-manager-inbox'
            ? formatBadge(growthUnread ?? 0)
            : undefined;
        return (
          <Link
            key={tab.href}
            to={tab.href}
            role="tab"
            aria-selected={active}
            title={tab.description}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-caption font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {badge && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-caption font-bold text-primary-foreground">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
