import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Bell, CreditCard, UserX, Inbox, FileWarning, Wallet, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: 'critical' | 'warning' | 'info';
  icon: React.ElementType;
  count: number;
  link: string;
  linkLabel: string;
}

const typeStyles = {
  critical: 'border-destructive/30 bg-destructive/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  info: 'border-border bg-card',
};

const badgeStyles = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  info: 'bg-muted text-muted-foreground',
};

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { data: failedSubs },
        { data: openCases },
        { data: unreadMessages },
        { data: pendingPayouts },
        { data: unpublished },
        { data: creators },
        { data: recentPosts },
      ] = await Promise.all([
        supabase.from('subscriptions').select('id').in('status', ['past_due', 'failed']),
        supabase.from('resolution_cases').select('id').in('status', ['open', 'escalated']),
        supabase.from('support_messages').select('id').eq('sender_role', 'creator').eq('read', false),
        supabase.from('payouts').select('amount').in('status', ['pending', 'processing']),
        supabase.from('creators').select('id').eq('is_published', false),
        supabase.from('creators').select('id'),
        supabase.from('posts').select('creator_id').gte('created_at', thirtyDaysAgo),
      ]);

      const pendingTotal = (pendingPayouts ?? []).reduce((a, b) => a + Number(b.amount), 0);
      const activeCreatorIds = new Set((recentPosts ?? []).map(p => p.creator_id));
      const inactiveCount = (creators ?? []).filter(c => !activeCreatorIds.has(c.id)).length;

      const next: AlertItem[] = [
        {
          id: 'failed-payments',
          title: 'Failed Payments',
          description: `${failedSubs?.length ?? 0} subscriptions are past due or failed`,
          type: 'critical', icon: CreditCard, count: failedSubs?.length ?? 0,
          link: '/admin/transactions', linkLabel: 'View Transactions',
        },
        {
          id: 'open-cases',
          title: 'Open Resolution Cases',
          description: `${openCases?.length ?? 0} unresolved cases need an admin response`,
          type: 'critical', icon: FileWarning, count: openCases?.length ?? 0,
          link: '/admin/resolution-cases', linkLabel: 'View Cases',
        },
        {
          id: 'unread-messages',
          title: 'Unread Creator Messages',
          description: `${unreadMessages?.length ?? 0} creator messages waiting for a reply`,
          type: 'warning', icon: Inbox, count: unreadMessages?.length ?? 0,
          link: '/admin/growth-manager-inbox', linkLabel: 'Open Inbox',
        },
        {
          id: 'pending-payouts',
          title: 'Pending Payouts',
          description: `$${pendingTotal.toFixed(2)} awaiting processing`,
          type: 'warning', icon: Wallet, count: pendingPayouts?.length ?? 0,
          link: '/admin/payouts', linkLabel: 'View Payouts',
        },
        {
          id: 'unpublished',
          title: 'Unpublished Creator Profiles',
          description: `${unpublished?.length ?? 0} creator profiles are not live yet`,
          type: 'info', icon: ShieldCheck, count: unpublished?.length ?? 0,
          link: '/admin/creators', linkLabel: 'View Creators',
        },
        {
          id: 'inactive',
          title: 'Inactive Creators',
          description: `${inactiveCount} creators have not posted in 30+ days`,
          type: 'info', icon: UserX, count: inactiveCount,
          link: '/admin/creators', linkLabel: 'View Creators',
        },
      ].filter(a => a.count > 0) as AlertItem[];

      setAlerts(next);
      setLoading(false);
    };
    void load();
  }, []);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;

  return (
    <DashboardLayout type="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Alerts & Attention Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Items requiring your attention right now</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Critical</p>
              <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Warnings</p>
              <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Info</p>
              <p className="text-2xl font-bold text-muted-foreground">{infoCount}</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground mt-1">No alerts need your attention right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`rounded-xl border p-5 ${typeStyles[alert.type]}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <alert.icon className={`h-5 w-5 mt-0.5 ${alert.type === 'critical' ? 'text-destructive' : alert.type === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{alert.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${badgeStyles[alert.type]}`}>{alert.count}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <Link to={alert.link}>
                      <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
                        {alert.linkLabel} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminAlerts;
