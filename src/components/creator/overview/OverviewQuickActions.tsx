import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function OverviewQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 text-base font-extrabold tracking-tight text-foreground">Quick Actions</h2>
      <ul className="space-y-1">
        {actions.map((a) => (
          <li key={a.href + a.label}>
            <Link
              to={a.href}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
