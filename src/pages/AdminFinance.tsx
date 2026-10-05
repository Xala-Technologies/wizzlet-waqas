import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import {
  AdminPageHeader,
  adminSectionTitle,
} from '@/components/dashboard/AdminPageHeader';
import { clayCard } from '@/lib/overviewClay';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Percent,
  TrendingUp,
  Wallet,
  Loader2,
  Crown,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { scanTruncationNote } from '@/lib/adminTruncation';

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: 14,
  color: 'hsl(var(--foreground))',
};

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminFinance = () => {
  const [nowMs] = useState(() => Date.now());
  const overview = useQuery(api.admin.snapshots.financeOverview, { nowMs });

  const primaryKpis = useMemo(() => {
    if (!overview) return [];
    const stats = overview;
    return [
      {
        label: 'Gross Revenue (all time)',
        value: fmt(stats.grossRevenue),
        icon: DollarSign,
        iconClassName: kpiIconTone.emerald,
      },
      {
        label: `Platform Fee Revenue · ${stats.effectiveRate.toFixed(1)}% effective`,
        value: fmt(stats.feeRevenue),
        icon: Percent,
        iconClassName: kpiIconTone.violet,
      },
      {
        label: `MRR · ${stats.activeCount} active subs`,
        value: fmt(stats.mrr),
        icon: TrendingUp,
        iconClassName: kpiIconTone.sky,
      },
      {
        label: 'Unpaid Creator Liability',
        value: fmt(stats.liability),
        icon: Wallet,
        iconClassName: kpiIconTone.amber,
      },
    ];
  }, [overview]);

  const secondaryKpis = useMemo(() => {
    if (!overview) return [];
    const stats = overview;
    return [
      {
        label: 'Fee MRR',
        value: fmt(stats.feeMrr),
        icon: Banknote,
        iconClassName: kpiIconTone.emerald,
      },
      {
        label: 'Creator Earnings',
        value: fmt(stats.creatorEarnings),
        icon: CircleDollarSign,
        iconClassName: kpiIconTone.cyan,
      },
      {
        label: 'Paid Out',
        value: fmt(stats.paidOut),
        icon: TrendingUp,
        iconClassName: kpiIconTone.teal,
      },
      {
        label: 'Payouts In Progress',
        value: fmt(stats.inFlight),
        icon: Wallet,
        iconClassName: kpiIconTone.amber,
      },
    ];
  }, [overview]);

  if (overview === undefined) {
    return (
      <DashboardLayout type="admin" mainClassName="bg-clay-page">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = overview;
  const truncation = scanTruncationNote(stats.truncated, stats.listLimit);

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader
        notice={truncation}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-9 text-caption">
              <Link to="/admin/payouts">Payouts</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 text-caption">
              <Link to="/admin/reports">Export</Link>
            </Button>
          </>
        }
      />

      <DashboardKpiStrip items={primaryKpis} variant="clay" className="mb-4" />
      <DashboardKpiStrip items={secondaryKpis} variant="clay" className="mb-6 sm:mb-8" />

      <section className={cn(clayCard, 'mb-6 min-w-0 p-4 sm:mb-8 sm:p-6')}>
        <h2 className={cn(adminSectionTitle, 'mb-4')}>Revenue Split — Last 12 Months</h2>
        <div className="h-72 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthly}>
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
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number, name: string) => [`$${Number(value).toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Gross revenue"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="fees"
                name="Platform fees"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.12}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                name="Creator earnings"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <section className={cn(clayCard, 'overflow-hidden p-4 sm:p-6')}>
          <h2 className={cn(adminSectionTitle, 'mb-4 flex items-center gap-2')}>
            <Crown className="h-4 w-4 text-muted-foreground" aria-hidden />
            Top Creators by Revenue
          </h2>
          {stats.topCreators.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active subscription revenue yet
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.topCreators.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-4 text-caption text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-caption text-muted-foreground">
                        {c.subs} active · {fmt(c.fees)} fees
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-emerald-400">{fmt(c.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn(clayCard, 'overflow-hidden p-4 sm:p-6')}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className={adminSectionTitle}>Recent Transactions</h2>
            <Link
              to="/admin/transactions"
              className="inline-flex items-center gap-1 text-caption text-primary"
            >
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {stats.recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentTransactions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.creatorName}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {s.userEmail} ·{' '}
                      {new Date(s.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{fmt(s.amount)}</p>
                    <Badge
                      variant="outline"
                      className={`text-caption ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}
                    >
                      {s.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinance;
