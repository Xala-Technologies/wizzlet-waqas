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
import { Percent, DollarSign, TrendingUp, Loader2, Crown, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { scanTruncationNote } from '@/lib/adminTruncation';

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: 14,
  color: 'hsl(var(--foreground))',
};

const AdminFees = () => {
  const [nowMs] = useState(() => Date.now());

  const platformSettings = useQuery(api.platform.mutations.get);
  const overview = useQuery(api.admin.snapshots.feesOverview, { nowMs });

  const loading = platformSettings === undefined || overview === undefined;
  const introPct = platformSettings?.introFeePercent ?? 5;
  const standardPct = platformSettings?.standardFeePercent ?? 10;

  const kpiItems = useMemo(() => {
    if (!overview) return [];
    return [
      {
        label: 'Total Volume',
        value: `$${overview.totalRevenue.toFixed(2)}`,
        icon: DollarSign,
        iconClassName: kpiIconTone.emerald,
      },
      {
        label: 'Fees Earned',
        value: `$${overview.totalFees.toFixed(2)}`,
        icon: Percent,
        iconClassName: kpiIconTone.violet,
      },
      {
        label: 'Creator Payouts',
        value: `$${overview.totalCreatorEarnings.toFixed(2)}`,
        icon: TrendingUp,
        iconClassName: kpiIconTone.sky,
      },
      {
        label: 'Active Subscriptions',
        value: String(overview.introFeeCount + overview.standardFeeCount),
        icon: Crown,
        iconClassName: kpiIconTone.amber,
      },
    ];
  }, [overview]);

  if (loading || !overview) {
    return (
      <DashboardLayout type="admin" mainClassName="bg-clay-page">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const truncation = scanTruncationNote(overview.truncated, overview.listLimit);

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader
        notice={truncation}
        actions={
          <Button asChild variant="outline" size="sm" className="h-9 text-caption">
            <Link to="/admin/settings" className="inline-flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Fee rules
            </Link>
          </Button>
        }
      />

      <DashboardKpiStrip items={kpiItems} variant="clay" className="mb-6 sm:mb-8" />

      <section className={cn(clayCard, 'mb-6 min-w-0 p-4 sm:p-6')}>
        <h2 className={cn(adminSectionTitle, 'mb-4')}>Monthly Fee Revenue</h2>
        <div className="h-64 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.monthlyFees}>
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
                formatter={(value: number) => [`$${value}`, 'Fee Revenue']}
              />
              <Bar dataKey="fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cn(clayCard, 'border border-emerald-500/20 bg-emerald-500/5 p-5')}>
          <p className="mb-1 text-caption uppercase tracking-wider text-muted-foreground">
            Intro Fee ({introPct}%)
          </p>
          <p className="text-2xl font-bold text-emerald-400">{overview.introFeeCount}</p>
          <p className="mt-1 text-caption text-muted-foreground">subscriptions at intro rate</p>
        </div>
        <div className={cn(clayCard, 'border border-amber-500/20 bg-amber-500/5 p-5')}>
          <p className="mb-1 text-caption uppercase tracking-wider text-muted-foreground">
            Standard Fee ({standardPct}%)
          </p>
          <p className="text-2xl font-bold text-amber-400">{overview.standardFeeCount}</p>
          <p className="mt-1 text-caption text-muted-foreground">subscriptions at standard rate</p>
        </div>
      </div>

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <div className="mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className={adminSectionTitle}>Fee Earnings by Creator</h2>
        </div>
        {overview.creatorFees.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-1">
            {overview.creatorFees.map((cf, i) => (
              <div
                key={`${cf.name}-${i}`}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/20"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 text-caption font-medium text-muted-foreground">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{cf.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {cf.subCount} subscriber{cf.subCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium uppercase tracking-wide ${cf.feePercent <= introPct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                  >
                    {cf.feePercent}%
                  </span>
                  <span className="w-20 text-right text-sm font-medium text-emerald-400">
                    ${cf.feeEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default AdminFees;
