import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Megaphone, Info, CheckCircle2 } from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore } from '@/components/demo/demoMemberStore';

const typeConfig = {
  post: { icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
  price: { icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  promo: { icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  announcement: { icon: Info, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const DemoMemberNotifications = () => {
  const store = useDemoMemberStore();
  const notifications = [...store.state.notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const unreadCount = store.metrics.unread;

  return (
    <DemoMemberShell
      title="Notifications"
      subtitle="Stay updated on new posts, promos, and platform news"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={unreadCount === 0}
          onClick={() => { store.markAllRead(); toast.success('All marked as read'); }}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Mark all read
        </Button>
      }
    >
      {unreadCount > 0 && (
        <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 mb-4">{unreadCount} new</Badge>
      )}

      <div className="space-y-2">
        {notifications.map(n => {
          const cfg = typeConfig[n.type];
          return (
            <div
              key={n.id}
              onClick={() => store.markNotificationRead(n.id)}
              className={`rounded-xl border bg-card p-4 flex items-start gap-3 transition-colors hover:border-primary/20 cursor-pointer ${
                n.read ? 'border-border opacity-70' : 'border-primary/10'
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
                <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{n.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DemoMemberShell>
  );
};

export default DemoMemberNotifications;
