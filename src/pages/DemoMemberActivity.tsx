import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Plus, Crown, XCircle, Heart, CheckCircle2 } from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore, DemoActivityEntry } from '@/components/demo/demoMemberStore';

const cfg: Record<DemoActivityEntry['type'], { icon: typeof Plus; color: string; bg: string; label: string }> = {
  save: { icon: Bookmark, color: 'text-primary', bg: 'bg-primary/10', label: 'Saved' },
  track: { icon: Plus, color: 'text-accent', bg: 'bg-accent/10', label: 'Tracked' },
  subscribe: { icon: Crown, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Subscribed' },
  unsubscribe: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' },
  like: { icon: Heart, color: 'text-primary', bg: 'bg-primary/10', label: 'Liked' },
  settle: { icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Settled' },
};

const DemoMemberActivity = () => {
  const { state } = useDemoMemberStore();
  const activity = [...state.activity].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <DemoMemberShell title="Activity" subtitle="Everything you've done across the platform">
      {activity.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No activity yet — save, track or subscribe to see it here.
        </div>
      ) : (
        <div className="space-y-2">
          {activity.map(a => {
            const c = cfg[a.type];
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} shrink-0`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">{c.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </DemoMemberShell>
  );
};

export default DemoMemberActivity;
