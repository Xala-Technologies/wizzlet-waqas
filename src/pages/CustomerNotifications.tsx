import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, DollarSign, Megaphone, Info, CheckCircle2, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

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
  pick: { icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
  post: { icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
  price: { icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  promo: { icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  announcement: { icon: Info, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const CustomerNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const itemsRaw = useQuery(api.notifications.mutations.listMine, user ? {} : 'skip');
  const markReadMutation = useMutation(api.notifications.mutations.markRead);
  const markAllReadMutation = useMutation(api.notifications.mutations.markAllRead);

  const loading = user ? itemsRaw === undefined : false;

  const items: NotificationRow[] = useMemo(
    () =>
      (itemsRaw ?? []).map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        description: n.description ?? null,
        link: n.link ?? null,
        read: n.read,
        created_at: new Date(n.createdAt).toISOString(),
      })),
    [itemsRaw],
  );

  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = async (row: NotificationRow) => {
    if (!row.read) {
      try {
        await markReadMutation({ notificationId: row.id as Id<'notifications'> });
      } catch {
        toast.error('Could not update notification');
        return;
      }
    }
    if (row.link) navigate(row.link);
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      await markAllReadMutation({});
      toast.success('All marked as read');
    } catch {
      toast.error('Could not update notifications');
    }
  };

  return (
    <DashboardLayout type="member">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Stay updated on new picks, promos, and platform news</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[72px] w-full rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">You're all caught up</h3>
          <p className="text-xs text-muted-foreground">New picks and platform updates will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const cfg = typeConfig[n.type] ?? typeConfig.announcement;
            return (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full text-left rounded-xl border bg-card p-4 flex items-start gap-3 transition-colors hover:border-primary/20 ${
                  n.read ? 'border-border opacity-70' : 'border-primary/10'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
                  <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  {n.description && <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerNotifications;
