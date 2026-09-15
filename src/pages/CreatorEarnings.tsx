import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  DollarSign,
  Lightbulb,
  Loader2,
  Sparkles,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { Button } from '@/components/ui/button';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';
import { initialsFromName } from '@/lib/creatorSubscribersDemo';
import {
  CREATOR_EARNINGS_DEMO_BY_PLAN,
  CREATOR_EARNINGS_DEMO_METRICS,
  CREATOR_EARNINGS_DEMO_MONTHLY,
  CREATOR_EARNINGS_DEMO_PAYOUTS,
  CREATOR_EARNINGS_DEMO_TRANSACTIONS,
  shouldUseCreatorEarningsDemo,
} from '@/lib/creatorEarningsDemo';

const CreatorEarnings = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const earnings = useQuery(api.creators.earnings.myEarnings);
  const payouts = useQuery(api.payouts.mutations.listMine);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);

  const loading = earnings === undefined;

  const useDemo = shouldUseCreatorEarningsDemo({
    netCents: earnings?.netCents ?? 0,
    paymentCount: earnings?.recentPayments.length ?? 0,
    forceDemo,
    disableDemo,
  });

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === 'active').length,
    [subs],
  );

  const paidOutCents = useMemo(
    () =>
      (payouts ?? [])
        .filter((p) => p.status === 'paid' || p.status === 'completed')
        .reduce((sum, p) => sum + (p.amountCents ?? 0), 0),
    [payouts],
  );

  const pendingPayoutCents = useMemo(
    () =>
      (payouts ?? [])
        .filter((p) => p.status === 'requested' || p.status === 'pending' || p.status === 'processing')
        .reduce((sum, p) => sum + (p.amountCents ?? 0), 0),
    [payouts],
  );

  const metrics = useDemo
    ? CREATOR_EARNINGS_DEMO_METRICS
    : {
        totalRevenueCents: earnings?.grossCents ?? 0,
        totalRevenueDelta: null as number | null,
        totalPayoutsCents: paidOutCents,
        totalPayoutsDelta: null as number | null,
        pendingBalanceCents: Math.max(0, (earnings?.netCents ?? 0) - paidOutCents) || pendingPayoutCents,
        pendingDelta: null as number | null,
        activeSubscribers: activeSubs,
        activeSubscribersDelta: null as number | null,
      };

  const monthly = useDemo
    ? CREATOR_EARNINGS_DEMO_MONTHLY
    : (earnings?.monthly ?? []).slice(-6).map((m) => ({
        month: m.month.length >= 7 ? m.month.slice(5) : m.month,
        subscriptions: Math.round(m.revenueCents) / 100,
        oneTime: 0,
      }));

  const byPlan = useDemo
    ? CREATOR_EARNINGS_DEMO_BY_PLAN
    : [
        { name: 'Subscriptions', value: 100, color: 'hsl(239 84% 67%)' },
      ];

  const transactions = useDemo
    ? CREATOR_EARNINGS_DEMO_TRANSACTIONS
    : (earnings?.recentPayments ?? []).slice(0, 6).map((p) => ({
        id: p.id,
        dateMs: p.createdAt,
        customer: p.label,
        type: 'Payment',
        amountCents: p.amountCents,
        status: 'completed' as const,
      }));

  const payoutRows = useDemo
    ? CREATOR_EARNINGS_DEMO_PAYOUTS
    : (payouts ?? []).slice(0, 6).map((p) => ({
        id: p._id,
        dateMs: p.createdAt,
        amountCents: p.amountCents,
        method: p.method || 'Stripe',
        status: (p.status === 'paid' ? 'completed' : p.status) as string,
      }));

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Earnings
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Your Earnings
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Track revenue, payouts, and subscriber-driven income.
          </p>
        </div>
        <Button asChild className="min-h-11 shrink-0 rounded-xl">
          <Link to="/creator/payouts">
            <Wallet className="mr-1.5 h-4 w-4" /> Withdraw Funds
          </Link>
        </Button>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — charts and tables are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total Revenue',
              value: `$${(metrics.totalRevenueCents / 100).toLocaleString()}`,
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.totalRevenueDelta != null ? `↑ ${metrics.totalRevenueDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Total Payouts',
              value: `$${(metrics.totalPayoutsCents / 100).toLocaleString()}`,
              icon: Wallet,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.totalPayoutsDelta != null ? `↑ ${metrics.totalPayoutsDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Pending Balance',
              value: `$${(metrics.pendingBalanceCents / 100).toLocaleString()}`,
              icon: BarChart3,
              iconClassName: kpiIconTone.sky,
              trendLabel: metrics.pendingDelta != null ? `↑ ${metrics.pendingDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Active Subscribers',
              value: String(metrics.activeSubscribers),
              icon: Users,
              iconClassName: kpiIconTone.amber,
              trendLabel:
                metrics.activeSubscribersDelta != null
                  ? `↑ ${metrics.activeSubscribersDelta}%`
                  : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-8">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Revenue Overview
          </h2>
          <div className="h-72 min-w-0 w-full">
            {monthly.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">No revenue yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 13,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="subscriptions"
                    name="Subscriptions"
                    stackId="a"
                    fill="hsl(239 84% 55%)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="oneTime"
                    name="One-time"
                    stackId="a"
                    fill="hsl(262 83% 72%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-4">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Revenue by Plan
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byPlan}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {byPlan.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {byPlan.map((p) => (
              <li key={p.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </span>
                <span className="font-bold tabular-nums">{p.value}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold tracking-tight">Recent Transactions</h2>
            <Link to="/creator/payouts" className="text-xs font-bold text-primary hover:underline">
              View all
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Customer</th>
                    <th className="py-2 pr-2">Type</th>
                    <th className="py-2 pr-2 text-right">Amount</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-2 text-muted-foreground whitespace-nowrap">
                        {format(t.dateMs, 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-700">
                            {initialsFromName(t.customer)}
                          </span>
                          <span className="font-semibold">{t.customer}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-muted-foreground">{t.type}</td>
                      <td className="py-3 pr-2 text-right font-bold text-emerald-600">
                        +${(t.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold tracking-tight">Payout History</h2>
            <Link to="/creator/payouts" className="text-xs font-bold text-primary hover:underline">
              View all
            </Link>
          </div>
          {payoutRows.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2 text-right">Amount</th>
                    <th className="py-2 pr-2">Method</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutRows.map((p) => (
                    <tr key={p.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-2 text-muted-foreground whitespace-nowrap">
                        {format(p.dateMs, 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 pr-2 text-right font-bold tabular-nums">
                        ${(p.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 pr-2">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <ArrowUpRight className="h-3.5 w-3.5 text-sky-500" />
                          {p.method}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                            p.status === 'completed' || p.status === 'paid'
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
                              : 'border-border bg-muted text-muted-foreground',
                          )}
                        >
                          {p.status === 'paid' ? 'Completed' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 sm:items-center sm:px-5">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary sm:mt-0" aria-hidden />
        <p className="text-sm font-semibold leading-snug text-foreground">
          Pro tip: Consistent daily picks and a clear VIP tier usually lift MRR faster than one-off
          price hikes — track results on Performance, then refine Smart Pricing.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default CreatorEarnings;
