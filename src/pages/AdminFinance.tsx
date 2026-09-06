import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Percent, TrendingUp, Wallet, Loader2, Crown, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminFinance = () => {
  const [nowMs] = useState(() => Date.now());
  const overview = useQuery(api.admin.snapshots.financeOverview, { nowMs });

  if (overview === undefined) {
    return (
      <DashboardLayout type="admin">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const stats = overview;

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Live revenue, fees, creator earnings and payout liability</p>
          {stats.truncated && (
            <p className="text-amber-600 text-xs mt-2">
              Showing up to {stats.listLimit.toLocaleString()} rows per table — totals may be incomplete at this scale.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 text-xs"><Link to="/admin/payouts">Payouts</Link></Button>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs"><Link to="/admin/reports">Export</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">{fmt(stats.grossRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Gross Revenue (all time)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Percent className="h-4 w-4 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{fmt(stats.feeRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Platform Fee Revenue · {stats.effectiveRate.toFixed(1)}% effective</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{fmt(stats.mrr)}</p>
          <p className="text-xs text-muted-foreground mt-1">MRR · {stats.activeCount} active subs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Wallet className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-400">{fmt(stats.liability)}</p>
          <p className="text-xs text-muted-foreground mt-1">Unpaid Creator Liability</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fee MRR</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(stats.feeMrr)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Creator Earnings</p>
          <p className="text-xl font-bold">{fmt(stats.creatorEarnings)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Paid Out</p>
          <p className="text-xl font-bold">{fmt(stats.paidOut)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payouts In Progress</p>
          <p className="text-xl font-bold text-amber-400">{fmt(stats.inFlight)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-8 min-w-0">
        <h2 className="text-sm font-medium mb-4">Revenue Split — Last 12 Months</h2>
        <div className="h-72 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                formatter={(value: number, name: string) => [`$${Number(value).toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Gross revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
              <Area type="monotone" dataKey="fees" name="Platform fees" stroke="#a855f7" fill="#a855f7" fillOpacity={0.12} />
              <Area type="monotone" dataKey="earnings" name="Creator earnings" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Top Creators by Revenue</h2>
          </div>
          {stats.topCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No active subscription revenue yet</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.topCreators.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.subs} active · {fmt(c.fees)} fees</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-emerald-400 shrink-0">{fmt(c.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent Transactions</h2>
            <Link to="/admin/transactions" className="text-xs text-primary inline-flex items-center gap-1">All <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          {stats.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No transactions yet</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentTransactions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.creatorName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.userEmail} · {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{fmt(s.amount)}</p>
                    <Badge variant="outline" className={`text-[10px] ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinance;
