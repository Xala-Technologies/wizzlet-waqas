import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare } from 'lucide-react';

export type OverviewMessage = {
  id: string;
  name: string;
  preview: string;
  whenLabel: string;
  unread?: number;
};

export function OverviewMessagesPanel({ rows }: { rows: OverviewMessage[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-foreground">Messages</h2>
        <Link
          to="/creator/messages"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Inbox <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-bold text-foreground">No messages yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Subscriber DMs show up here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const initial = row.name.charAt(0).toUpperCase();
            return (
              <li key={row.id}>
                <Link
                  to="/creator/messages"
                  className="flex items-start gap-3 rounded-xl p-1 transition-colors hover:bg-muted/50"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground"
                    aria-hidden
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{row.name}</p>
                      <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                        {row.whenLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.preview}</p>
                  </div>
                  {row.unread && row.unread > 0 ? (
                    <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {row.unread > 9 ? '9+' : row.unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
