import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { clayCard } from '@/lib/overviewClay';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { AdminPageHeader, adminSectionTitle } from '@/components/dashboard/AdminPageHeader';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  UserX,
  Inbox,
  FileWarning,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { scanTruncationNote } from '@/lib/adminTruncation';

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
    const items: AlertItem[] = [
      {
        id: 'failed-payments',
        title: 'Failed Payments',
        description: `${overview.failedPayments} subscriptions are past due or failed`,
        type: 'critical' as const, icon: CreditCard, count: overview.failedPayments,
        link: '/admin/transactions?status=failed', linkLabel: 'View Transactions',
      },
      {
        id: 'open-cases',
        title: 'Open Resolution Cases',
        description: `${overview.openCases} unresolved cases need an admin response`,
        type: 'critical' as const, icon: FileWarning, count: overview.openCases,
        link: '/admin/resolution-cases', linkLabel: 'View Cases',
      },
      {
        id: 'unread-messages',
        title: 'Unread Creator Messages',
        description: `${overview.unreadMessages} creator messages waiting for a reply`,
        type: 'warning' as const, icon: Inbox, count: overview.unreadMessages,
        link: '/admin/growth-manager-inbox', linkLabel: 'Open Inbox',
      },
      {
        id: 'pending-payouts',
        title: 'Pending Payouts',
        description: `$${overview.pendingPayoutTotal.toFixed(2)} awaiting processing (refunds claw back Pending then Available; debt blocks Monday auto-payouts)`,
        type: 'warning' as const, icon: Wallet, count: overview.pendingPayouts,
        link: '/admin/payouts', linkLabel: 'View Payouts',
      },
      {
        id: 'unpublished',
        title: 'Unpublished Creator Profiles',
        description: `${overview.unpublishedCreators} creator profiles are not live yet`,
        type: 'info' as const, icon: ShieldCheck, count: overview.unpublishedCreators,
        link: '/admin/creators', linkLabel: 'View Creators',
      },
      {
        id: 'inactive',
        title: 'Inactive Creators',
        description: `${overview.inactiveCreators} creators have 0 subscribers after 30+ days`,
        type: 'info' as const, icon: UserX, count: overview.inactiveCreators,
        link: '/admin/creators', linkLabel: 'View Creators',
      },
    ];
    return items.filter((a) => a.count > 0);
  }, [overview]);

  const criticalCount = alerts
    .filter((a) => a.type === 'critical')
    .reduce((sum, a) => sum + a.count, 0);
  const warningCount = alerts
    .filter((a) => a.type === 'warning')
    .reduce((sum, a) => sum + a.count, 0);
  const infoCount = alerts
    .filter((a) => a.type === 'info')
    .reduce((sum, a) => sum + a.count, 0);

  const severityKpis = useMemo(
    () => [
      {
        label: 'Critical items',
        value: String(criticalCount),
        icon: AlertTriangle,
        iconClassName: kpiIconTone.rose,
      },
      {
        label: 'Warning items',
        value: String(warningCount),
        icon: FileWarning,
        iconClassName: kpiIconTone.amber,
      },
      {
        label: 'Info items',
        value: String(infoCount),
        icon: Info,
        iconClassName: kpiIconTone.sky,
      },
    ],
    [criticalCount, warningCount, infoCount],
  );

  const truncation = scanTruncationNote(!!overview?.truncated, overview?.listLimit);

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader notice={truncation} />

      {overview === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <>
          <DashboardKpiStrip items={severityKpis} variant="clay" className="mb-6 sm:mb-8" />

          {alerts.length === 0 ? (
            <div className={cn(clayCard, 'p-12 text-center sm:p-6')}>
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-caption text-muted-foreground mt-1">No items need attention right now.</p>
            </div>
          ) : (
            <section className="space-y-3">
              <h2 className={cn(adminSectionTitle, 'sr-only')}>Active alerts</h2>
              {alerts.map((a) => (
                <div key={a.id} className={cn(clayCard, 'p-4 sm:p-6', typeStyles[a.type])}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <a.icon className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{a.title}</p>
                          <Badge variant="outline" className={`text-caption ${badgeStyles[a.type]}`}>{a.count}</Badge>
                        </div>
                        <p className="text-caption text-muted-foreground">{a.description}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="min-h-11 text-caption shrink-0">
                      <Link to={a.link}>{a.linkLabel} <ArrowRight className="ml-1.5 h-3 w-3" /></Link>
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminAlerts;
