import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { AdminPageHeader } from '@/components/dashboard/AdminPageHeader';
import { OverviewQuickActions } from '@/components/creator/overview/OverviewQuickActions';
import { clayCard } from '@/lib/overviewClay';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { scanTruncationNote } from '@/lib/adminTruncation';
import { cn } from '@/lib/utils';
import {
  Users,
  Crown,
  DollarSign,
  CreditCard,
  Loader2,
  TrendingUp,
  Activity,
  UserPlus,
  Percent,
  FileWarning,
  Bell,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: 14,
  color: 'hsl(var(--foreground))',
};

const AdminDashboardInner = () => {
  const stats = useQuery(api.admin.queries.dashboardStats);

  const kpiItems = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: 'Active sub volume (MRR)',
        value: `$${(stats.totalRevenueCents / 100).toFixed(0)}`,
        icon: DollarSign,
        iconClassName: kpiIconTone.emerald,
        href: '/admin/finance',
      },
      {
        label: 'Platform fee revenue',
        value: `$${(stats.platformFeesCents / 100).toFixed(0)}`,
        icon: Percent,
        iconClassName: kpiIconTone.violet,
        href: '/admin/fees',
      },
      {
        label: 'Creator paid out',
        value: `$${(stats.paidOutCents / 100).toFixed(0)}`,
        icon: TrendingUp,
        iconClassName: kpiIconTone.sky,
        href: '/admin/payouts',
      },
      {
        label: 'Creators',
        value: stats.creatorCount.toString(),
        icon: Crown,
        iconClassName: kpiIconTone.amber,
        href: '/admin/creators',
      },
      {
        label: 'Accounts',
        value: stats.userCount.toString(),
        icon: Users,
        iconClassName: kpiIconTone.cyan,
        href: '/admin/users',
      },
      {
        label: 'Active subscriptions',
        value: stats.activeSubscriptionCount.toString(),
        icon: CreditCard,
        iconClassName: kpiIconTone.teal,
        href: '/admin/customers',
      },
      {
        label: 'Open resolution cases',
        value: stats.openCases.toString(),
        icon: FileWarning,
        iconClassName: kpiIconTone.rose,
        href: '/admin/resolution-cases',
      },
    ];
  }, [stats]);

  const nextActions = useMemo(() => {
    if (!stats) return [];
    const actions = [];
    if (stats.openCases > 0) {
      actions.push({
        label: `${stats.openCases} open resolution case${stats.openCases === 1 ? '' : 's'}`,
        href: '/admin/resolution-cases',
        icon: FileWarning,
      });
    }
    actions.push(
      { label: 'Review ops alerts', href: '/admin/alerts', icon: Bell },
      { label: 'Review payout ledger', href: '/admin/payouts', icon: Wallet },
    );
    return actions;
  }, [stats]);

  if (stats === undefined) {
    return (
      <DashboardLayout type="admin" mainClassName="bg-clay-page">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const truncation = scanTruncationNote(stats.truncated, stats.listLimit);
  const monthlyRevenue = stats.monthly;
  const creatorGrowth = stats.monthly;
  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader notice={truncation} />

      {nextActions.length > 0 ? (
        <div className="mb-6">
          <OverviewQuickActions actions={nextActions} />
        </div>
      ) : null}

      <DashboardKpiStrip items={kpiItems} variant="clay" className="mb-6 sm:mb-8" />

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <section className={cn(clayCard, 'min-w-0 p-4 sm:p-6')}>
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Monthly Revenue
          </h2>
          <div className="h-56 min-w-0 w-full">
            {monthlyRevenue.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No subscription data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className={cn(clayCard, 'min-w-0 p-4 sm:p-6')}>
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Monthly Platform Fees
          </h2>
          <div className="h-56 min-w-0 w-full">
            {monthlyRevenue.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No fee data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="fees"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <section className={cn(clayCard, 'min-w-0 p-4 sm:p-6')}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden />
            Creator & customer growth
          </h2>
          <div className="h-56 min-w-0 w-full">
            {creatorGrowth.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No growth data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={creatorGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="creators"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="customers"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className={cn(clayCard, 'p-4 sm:p-6')}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
            Recent subscriptions
          </h2>
          {stats.recentSubs.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentSubs.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl px-2.5 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="font-semibold text-foreground">{s.userName}</p>
                    <p className="text-caption text-muted-foreground">
                      {s.creatorName} · {format(s.createdAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="font-extrabold tabular-nums">
                    ${(s.amountCents / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <section className={cn(clayCard, 'p-4 sm:p-6')}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
            <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden />
            Recent creators
          </h2>
          {stats.recentCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.recentCreators.map((c, i) => (
                <li
                  key={i}
                  className="flex justify-between rounded-2xl px-2.5 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="font-semibold text-foreground">{c.name}</span>
                  <span className="text-muted-foreground">{format(c.date, 'MMM d')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={cn(clayCard, 'p-4 sm:p-6')}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            Recent customers
          </h2>
          {stats.recentCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.recentCustomers.map((u, i) => (
                <li
                  key={i}
                  className="flex justify-between rounded-2xl px-2.5 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <p className="text-caption text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-muted-foreground">{format(u.date, 'MMM d')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

const AdminDashboard = () => <AdminDashboardInner />;

export default AdminDashboard;
