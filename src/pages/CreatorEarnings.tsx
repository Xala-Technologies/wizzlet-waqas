import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { DollarSign, TrendingUp, CreditCard, Loader2, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const CreatorEarnings = () => {
  const earnings = useQuery(api.creators.earnings.myEarnings);

  if (earnings === undefined) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const chartData = earnings.monthly.map((m) => ({
    month: m.month,
    revenue: Math.round(m.revenueCents) / 100,
  }));

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Active subscription MRR vs collected payment events. See Payouts for withdrawable balance.
        </p>
      </div>

      <div className="mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: `Active MRR gross (${earnings.activeCount} active)`,
              value: `$${(earnings.grossCents / 100).toFixed(2)}`,
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
            },
            {
              label: 'Active MRR net (after fees)',
              value: `$${(earnings.netCents / 100).toFixed(2)}`,
              icon: TrendingUp,
              iconClassName: kpiIconTone.sky,
            },
            {
              label: 'Featured price / subscriber',
              value: `$${(earnings.perSubCents / 100).toFixed(2)}`,
              icon: CreditCard,
              iconClassName: kpiIconTone.violet,
            },
          ]}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6 min-w-0">
        <h2 className="text-sm font-medium mb-4">Collected revenue by month</h2>
        <p className="text-caption text-muted-foreground mb-4">From settled payment events (not list-price MRR).</p>
        <div className="h-64 min-w-0 w-full">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-20 text-center">No payment events yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 14, color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Payments</h2>
      {earnings.recentPayments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {earnings.recentPayments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-caption text-muted-foreground">{format(p.createdAt, 'MMM d, yyyy')}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-400">+${(p.amountCents / 100).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorEarnings;
