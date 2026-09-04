import { Link } from 'react-router-dom';
import {
  Users,
  Crown,
  DollarSign,
  CreditCard,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Percent,
  ArrowRight,
  Download,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useDemoAdminStore, downloadCsv } from '@/components/demo/demoAdminStore';

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusStyles: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  cancelled: 'bg-muted text-muted-foreground',
  refunded: 'bg-destructive/10 text-destructive',
};

const DemoAdminDashboard = () => {
  const { rows, metrics, state, approveApplication, rejectApplication, reset } = useDemoAdminStore();
  const recent = [...rows].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 6);

  const thisMonth = metrics.months[metrics.months.length - 1];
  const lastMonth = metrics.months[metrics.months.length - 2];
  const growth =
    lastMonth && lastMonth.revenue > 0
      ? +(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100).toFixed(1)
      : 0;
  const growthUp = growth >= 0;

  const inactiveCreators = state.creators.filter(c => !c.active);
  const topCreators = metrics.byCreator.slice(0, 5);

  const stats = [
    { label: 'Gross Volume', value: money(metrics.volume), icon: DollarSign, to: '/demo/admin/transactions', sub: `${metrics.totalTransactions} transactions` },
    { label: 'Creators', value: `${metrics.activeCreators}/${metrics.totalCreators}`, icon: Crown, to: '/demo/admin/creators', sub: `${metrics.pendingApplications} pending` },
    { label: 'Subscribers', value: metrics.subscribers.toLocaleString(), icon: Users, to: '/demo/admin/users', sub: `${metrics.activeUsers}/${metrics.totalUsers} accounts active` },
    { label: 'Platform Earnings', value: money(metrics.fees), icon: CreditCard, to: '/demo/admin/fees', sub: `${metrics.effectiveFeeRate}% effective rate` },
  ];

  const exportSummary = () => {
    downloadCsv('wizzlet-demo-platform-summary.csv', [
      ['Metric', 'Value'],
      ['Gross volume', metrics.volume],
      ['Platform earnings', metrics.fees],
      ['Creator payouts owed', metrics.payouts],
      ['Refunded volume', metrics.refunded],
      ['Effective fee rate %', metrics.effectiveFeeRate],
      ['Active subscriptions', metrics.activeTransactions],
      ['Total transactions', metrics.totalTransactions],
      ['Active creators', metrics.activeCreators],
      ['Total creators', metrics.totalCreators],
      ['Pending applications', metrics.pendingApplications],
      ['Subscribers', metrics.subscribers],
      [],
      ['Month', 'Gross volume', 'Platform fees'],
      ...metrics.months.map(m => [m.month, m.revenue, m.fees]),
    ]);
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Live demo figures — every number below is derived from the transactions and fee rules in this session
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={exportSummary}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export summary
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={reset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset demo
          </Button>
        </div>
      </div>

      {/* Pending applications — reviewable inline */}
      {state.applications.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm flex-1 font-medium">
              {state.applications.length} creator application{state.applications.length > 1 ? 's' : ''} waiting for review
            </p>
            <Button size="sm" variant="ghost" asChild className="text-xs">
              <Link to="/demo/admin/creators">Open queue <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {state.applications.slice(0, 3).map(app => (
              <div key={app.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{app.name} <span className="text-muted-foreground font-normal">@{app.username}</span></p>
                  <p className="text-xs text-muted-foreground truncate">{app.pitch}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{app.appliedDaysAgo}d ago</span>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="h-7 text-xs" onClick={() => approveApplication(app.id)}>Approve</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectApplication(app.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveCreators.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm flex-1">
            {inactiveCreators.length} creator account{inactiveCreators.length > 1 ? 's are' : ' is'} disabled — their subscribers keep billing until cancelled.
          </p>
          <Button size="sm" variant="outline" asChild className="text-xs"><Link to="/demo/admin/creators">Manage</Link></Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.to} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
            <stat.icon className="h-4 w-4 text-primary mb-3" />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{stat.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Month to date</p>
          <p className="text-3xl font-bold">{money(thisMonth?.revenue ?? 0)}</p>
          <p className={`text-xs mt-1 inline-flex items-center gap-1 ${growthUp ? 'text-primary' : 'text-destructive'}`}>
            {growthUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {growthUp ? '+' : ''}{growth}% vs {lastMonth?.month ?? 'last month'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Refunded volume</p>
          <p className="text-3xl font-bold">{money(metrics.refunded)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.volume ? ((metrics.refunded / (metrics.volume + metrics.refunded)) * 100).toFixed(1) : '0.0'}% of billed volume
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Fee tiers in force</p>
          <p className="text-3xl font-bold">{state.settings.introFeePercent}% → {state.settings.standardFeePercent}%</p>
          <p className="text-xs text-muted-foreground mt-1">intro for first {state.settings.introPeriodDays} days</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Monthly Platform Revenue</h2>
          <Link to="/demo/admin/fees" className="text-xs text-primary hover:underline">Fee breakdown</Link>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12, color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name) => [`$${value}`, name === 'fees' ? 'Platform fees' : 'Gross volume']}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => (value === 'fees' ? 'Platform fees' : 'Gross volume')}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fees" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Subscriptions</p>
          <p className="text-3xl font-bold">{metrics.activeTransactions}</p>
          <p className="text-xs text-muted-foreground mt-1">across {metrics.activeCreators} active creators</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Volume / Creator</p>
          <p className="text-3xl font-bold">{money(metrics.avgRevenuePerCreator)}</p>
          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Percent className="h-3 w-3" /> effective fee rate {metrics.effectiveFeeRate}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Creator Payouts Owed</p>
          <p className="text-3xl font-bold">{money(metrics.payouts)}</p>
          <p className="text-xs text-muted-foreground mt-1">min payout ${state.settings.minPayoutAmount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top creators by platform fees */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Top Creators by Platform Fees</h2>
            </div>
            <Link to="/demo/admin/fees" className="text-xs text-primary hover:underline">All</Link>
          </div>
          {topCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billed transactions yet.</p>
          ) : (
            <div className="space-y-1">
              {topCreators.map((c, i) => (
                <div key={c.creator.id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.creator.name}
                        {!c.creator.active && <span className="ml-2 text-[10px] text-destructive">disabled</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.transactions} txns · {money(c.volume)} volume · {c.feePercent}% tier
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium shrink-0">{money(c.fees)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Recent Activity</h2>
            </div>
            <Link to="/demo/admin/transactions" className="text-xs text-primary hover:underline">All transactions</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity in this session.</p>
          ) : (
            <div className="space-y-1">
              {recent.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{a.customer}</span>
                        <span className="text-muted-foreground"> subscribed to </span>
                        <span className="font-medium">{a.creatorName}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        fee {money(a.fee)} ({a.feePercent}%) · creator {money(a.earnings)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[a.status]}`}>{a.status}</span>
                    <span className="text-sm font-medium">{money(a.amount)}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">{format(a.date, 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DemoAdminDashboard;
