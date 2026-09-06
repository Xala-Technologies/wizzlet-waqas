import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, UserX, Inbox, FileWarning, Wallet, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [nowMs] = useState(() => Date.now());
  const overview = useQuery(api.admin.snapshots.alertsOverview, { nowMs });

  const alerts = useMemo((): AlertItem[] => {
    if (!overview) return [];
    return [
      {
        id: 'failed-payments',
        title: 'Failed Payments',
        description: `${overview.failedPayments} subscriptions are past due or failed`,
        type: 'critical', icon: CreditCard, count: overview.failedPayments,
        link: '/admin/transactions', linkLabel: 'View Transactions',
      },
      {
        id: 'open-cases',
        title: 'Open Resolution Cases',
        description: `${overview.openCases} unresolved cases need an admin response`,
        type: 'critical', icon: FileWarning, count: overview.openCases,
        link: '/admin/resolution-cases', linkLabel: 'View Cases',
      },
      {
        id: 'unread-messages',
        title: 'Unread Creator Messages',
        description: `${overview.unreadMessages} creator messages waiting for a reply`,
        type: 'warning', icon: Inbox, count: overview.unreadMessages,
        link: '/admin/growth-manager-inbox', linkLabel: 'Open Inbox',
      },
      {
        id: 'pending-payouts',
        title: 'Pending Payouts',
        description: `$${overview.pendingPayoutTotal.toFixed(2)} awaiting processing`,
        type: 'warning', icon: Wallet, count: overview.pendingPayouts,
        link: '/admin/payouts', linkLabel: 'View Payouts',
      },
      {
        id: 'unpublished',
        title: 'Unpublished Creator Profiles',
        description: `${overview.unpublishedCreators} creator profiles are not live yet`,
        type: 'info', icon: ShieldCheck, count: overview.unpublishedCreators,
        link: '/admin/creators', linkLabel: 'View Creators',
      },
      {
        id: 'inactive',
        title: 'Inactive Creators',
        description: `${overview.inactiveCreators} creators have 0 subscribers after 30+ days`,
        type: 'info', icon: UserX, count: overview.inactiveCreators,
        link: '/admin/creators', linkLabel: 'View Creators',
      },
    ].filter((a) => a.count > 0);
  }, [overview]);

  const criticalCount = alerts.filter((a) => a.type === 'critical').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;
  const infoCount = alerts.filter((a) => a.type === 'info').length;

  return (
    <DashboardLayout type="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Alerts & Attention Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Items requiring your attention right now</p>
        {overview?.truncated && (
          <p className="text-amber-600 text-xs mt-2">
            Showing up to {overview.listLimit.toLocaleString()} rows per table — counts may be incomplete at this scale.
          </p>
        )}
      </div>

      {overview === undefined ? (
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
              <p className="text-2xl font-bold">{infoCount}</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground mt-1">No items need attention right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className={`rounded-xl border p-5 ${typeStyles[a.type]}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <a.icon className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{a.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${badgeStyles[a.type]}`}>{a.count}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0">
                      <Link to={a.link}>{a.linkLabel} <ArrowRight className="ml-1.5 h-3 w-3" /></Link>
                    </Button>
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
