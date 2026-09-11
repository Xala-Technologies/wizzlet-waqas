import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  DollarSign,
  Megaphone,
  Info,
  CheckCircle2,
  BellOff,
  Loader2,
  MessageSquare,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

const PAGE_SIZE = 25;

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  pick: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  post: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  price: { icon: DollarSign, color: 'text-muted-foreground', bg: 'bg-muted' },
  promo: { icon: Megaphone, color: 'text-muted-foreground', bg: 'bg-muted' },
  announcement: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' },
  subscription: { icon: DollarSign, color: 'text-muted-foreground', bg: 'bg-muted' },
  message: { icon: MessageSquare, color: 'text-muted-foreground', bg: 'bg-muted' },
  growth_message: { icon: Brain, color: 'text-muted-foreground', bg: 'bg-muted' },
  support_message: { icon: MessageSquare, color: 'text-muted-foreground', bg: 'bg-muted' },
  resolution_case: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  resolution_message: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  payout_request: { icon: DollarSign, color: 'text-muted-foreground', bg: 'bg-muted' },
};

type LayoutType = 'member' | 'creator' | 'admin';

function layoutFromPath(pathname: string): LayoutType {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/creator')) return 'creator';
  return 'member';
}

function emptyRecovery(layoutType: LayoutType): { primary: { to: string; label: string }; secondary?: { to: string; label: string } } {
  if (layoutType === 'creator') {
    return {
      primary: { to: '/creator', label: 'Go to dashboard' },
      secondary: { to: '/creator/messages', label: 'Open messages' },
    };
  }
  if (layoutType === 'admin') {
    return {
      primary: { to: '/admin', label: 'Go to admin' },
    };
  }
  return {
    primary: { to: '/dashboard', label: 'Go to Feed' },
    secondary: { to: '/dashboard/messages', label: 'Open messages' },
  };
}

/** In-app notification center — shared by member, creator, and admin dashboards. */
const CustomerNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const layoutType = layoutFromPath(pathname);
  const recovery = emptyRecovery(layoutType);
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.mutations.listMinePage,
    user ? {} : 'skip',
    { initialNumItems: PAGE_SIZE },
  );
  const unreadTotal = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');
  const markReadMutation = useMutation(api.notifications.mutations.markRead);
  const markAllReadMutation = useMutation(api.notifications.mutations.markAllRead);

  const loading = user
    ? status === 'LoadingFirstPage' || unreadTotal === undefined
    : false;

  const items: NotificationRow[] = useMemo(
    () =>
      results.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        description: n.description ?? null,
        link: n.link ?? null,
        read: n.read,
        created_at: new Date(n.createdAt).toISOString(),
      })),
    [results],
  );

  const unreadCount = unreadTotal ?? 0;

  const markRead = async (row: NotificationRow) => {
    if (openingId) return;
    setOpeningId(row.id);
    try {
      if (!row.read) {
        try {
          await markReadMutation({ notificationId: row.id as Id<'notifications'> });
        } catch {
          toast.error('Could not update notification');
          return;
        }
      }
      if (row.link) navigate(row.link);
    } finally {
      setOpeningId(null);
    }
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllReadMutation({});
    } catch {
      toast.error('Could not update notifications');
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type={layoutType}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type={layoutType}>
      <header className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-heading font-bold text-foreground flex items-center gap-2 flex-wrap">
            Notifications
            {unreadCount > 0 && (
              <Badge
                variant="outline"
                className="text-support bg-primary/10 text-primary border-primary/20"
              >
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Messages, billing updates, and platform announcements
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0 || markingAll}
        >
          {markingAll ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          Mark all read
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">You&apos;re all caught up</h3>
          <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
            New messages and updates will show up here when something needs your attention.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button className="min-h-11" asChild>
              <Link to={recovery.primary.to}>{recovery.primary.label}</Link>
            </Button>
            {recovery.secondary && (
              <Button variant="outline" className="min-h-11" asChild>
                <Link to={recovery.secondary.to}>{recovery.secondary.label}</Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const cfg = typeConfig[n.type] ?? typeConfig.announcement;
            const busy = openingId === n.id;
            return (
              <button
                key={n.id}
                type="button"
                disabled={!!openingId}
                onClick={() => void markRead(n)}
                className={`w-full min-h-11 text-left rounded-xl border bg-card p-4 flex items-start gap-3 transition-colors hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                  n.read ? 'border-border opacity-70' : 'border-border'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.bg} shrink-0 mt-0.5`}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-ui font-semibold text-foreground truncate">{n.title}</p>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />
                    )}
                  </div>
                  {n.description && (
                    <p className="text-support text-muted-foreground line-clamp-2">{n.description}</p>
                  )}
                  <p className="text-support text-muted-foreground mt-1">
                    {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            );
          })}
          {(status === 'CanLoadMore' || status === 'LoadingMore') && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={status === 'LoadingMore' || !!openingId}
                onClick={() => loadMore(PAGE_SIZE)}
              >
                {status === 'LoadingMore' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerNotifications;
