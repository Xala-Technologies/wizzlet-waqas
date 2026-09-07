import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Broadcast', href: '/admin/creator-messaging' },
  { label: 'Growth Inbox', href: '/admin/growth-manager-inbox' },
] as const;

/** Shared Support workspace tabs (O3) — Broadcast vs Growth Inbox. */
export function AdminSupportTabs() {
  const pathname = useLocation().pathname;

  return (
    <div className="flex gap-1 mb-6 rounded-lg border border-border bg-muted/30 p-1 w-fit">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
