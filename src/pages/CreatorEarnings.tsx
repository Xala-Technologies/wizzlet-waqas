import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  Lightbulb,
  Loader2,
  Package,
  Repeat,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { EarningsSubnav } from '@/components/creator/EarningsSubnav';
import { EarningsTaxDocumentsPanel } from '@/components/creator/EarningsTaxDocuments';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CREATOR_EARNINGS_DEMO_BY_TYPE,
  CREATOR_EARNINGS_DEMO_METRICS,
  CREATOR_EARNINGS_DEMO_SERIES,
  CREATOR_EARNINGS_DEMO_TRANSACTIONS,
  CREATOR_EARNINGS_TIPS,
  shouldUseCreatorEarningsDemo,
  type DemoEarningTxn,
} from '@/lib/creatorEarningsDemo';
import { shouldUseCreatorTaxDocsDemo } from '@/lib/creatorTaxDocsDemo';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

function money(cents: number, fractionDigits = 0): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

function moneyExact(cents: number): string {
  return money(cents, 2);
}

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('tip')) return Gift;
  if (t.includes('one-time') || t.includes('purchase')) return Package;
  if (t.includes('sub') || t.includes('payment')) return Repeat;
  return CreditCard;
}

const CreatorEarnings = () => {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const [chartGranularity, setChartGranularity] = useState('daily');
  const showTaxDocs = hash === '#tax-docs';

  const earnings = useQuery(api.creators.earnings.myEarnings);
  const payouts = useQuery(api.payouts.mutations.listMine);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);

  const loading = earnings === undefined || payouts === undefined || subs === undefined;

  const useDemo = shouldUseCreatorEarningsDemo({
    netCents: earnings?.netCents ?? 0,
    paymentCount: earnings?.recentPayments.length ?? 0,
    forceDemo,
    disableDemo,
  });

  const useTaxDemo = shouldUseCreatorTaxDocsDemo({
    forceDemo,
    disableDemo,
    realDocCount: 0,
  });

  const demoBanner = (useDemo || (showTaxDocs && useTaxDemo)) ? (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
      <Sparkles
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
        aria-hidden
      />
      <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
        Sample preview data — charts and tables are mock content for design review. Add{' '}
        <span className="font-mono text-xs">?demo=0</span> to see empty real states.
      </p>
    </div>
  ) : null;

  const paidOutCents = useMemo(
    () =>
      (payouts ?? [])
        .filter((p) => p.status === 'paid' || p.status === 'completed')
        .reduce((sum, p) => sum + (p.amountCents ?? 0), 0),
    [payouts],
  );

  const pendingFromPayouts = useMemo(
    () =>
      (payouts ?? [])
        .filter(
          (p) =>
            p.status === 'requested' ||
            p.status === 'pending' ||
            p.status === 'processing' ||
            p.status === 'approved',
        )
        .reduce((sum, p) => sum + (p.amountCents ?? 0), 0),
    [payouts],
  );

  const metrics = useDemo
    ? CREATOR_EARNINGS_DEMO_METRICS
    : {
        totalRevenueCents: earnings?.grossCents ?? 0,
        totalRevenueDelta: null as number | null,
        netEarningsCents: earnings?.netCents ?? 0,
        netEarningsDelta: null as number | null,
        totalPaidOutCents: paidOutCents,
        totalPaidOutDelta: null as number | null,
        pendingPayoutCents:
          pendingFromPayouts > 0
            ? pendingFromPayouts
            : Math.max(0, (earnings?.netCents ?? 0) - paidOutCents),
        pendingPayoutDelta: null as number | null,
        dateRangeLabel: 'Last 30 days',
        upcomingPayoutCents:
          pendingFromPayouts > 0
            ? pendingFromPayouts
            : Math.max(0, (earnings?.netCents ?? 0) - paidOutCents),
        upcomingPayoutDateLabel: 'Next schedule',
      };

  const series = useDemo
    ? CREATOR_EARNINGS_DEMO_SERIES
    : (earnings?.monthly ?? []).slice(-8).map((m) => {
        const revenue = Math.round(m.revenueCents) / 100;
        const net = Math.round(revenue * 0.85 * 100) / 100;
        const payoutsApprox = Math.round(revenue * 0.4 * 100) / 100;
        return {
          label: m.month.length >= 7 ? m.month.slice(5) : m.month,
          revenue,
          net,
          payouts: payoutsApprox,
        };
      });

  const byType = useDemo
    ? CREATOR_EARNINGS_DEMO_BY_TYPE
    : [{ name: 'Subscriptions', value: 100, color: 'hsl(239 84% 55%)' }];

  const transactions: DemoEarningTxn[] = useDemo
    ? CREATOR_EARNINGS_DEMO_TRANSACTIONS
    : (earnings?.recentPayments ?? []).slice(0, 8).map((p) => {
        const amountCents = p.amountCents;
        const feeCents = Math.round(amountCents * 0.08);
        const isSub = p.label.toLowerCase().includes('subscription');
        return {
          id: p.id,
          dateMs: p.createdAt,
          type: (isSub ? 'Subscription' : 'One-time purchase') as DemoEarningTxn['type'],
          source: p.label.replace(/^Subscription\s*—\s*/i, '') || p.label,
          amountCents,
          feeCents,
          netCents: amountCents - feeCents,
          status: 'completed' as const,
        };
      });

  const donutTotalLabel = money(metrics.totalRevenueCents);

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (showTaxDocs) {
    return (
      <DashboardLayout type="creator">
        <EarningsTaxDocumentsPanel
          useDemo={useTaxDemo}
          beforeContent={
            <>
              <EarningsSubnav active="tax" />
              {demoBanner}
            </>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Earnings
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Track your revenue, payouts, and financial performance.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm"
          onClick={() =>
            toast.message('Date range', {
              description: useDemo
                ? 'Demo period is fixed to January 2025 for design review.'
                : 'Custom date ranges are coming soon.',
            })
          }
        >
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>{metrics.dateRangeLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>
      </header>

      <EarningsSubnav active="overview" />

      {demoBanner}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
              items={[
                {
                  label: 'Total revenue',
                  value: money(metrics.totalRevenueCents),
                  icon: DollarSign,
                  iconClassName: kpiIconTone.emerald,
                  trendLabel:
                    metrics.totalRevenueDelta != null
                      ? `↑ ${metrics.totalRevenueDelta}%`
                      : undefined,
                  trendPositive: true,
                  trendCaption:
                    metrics.totalRevenueDelta != null ? 'vs. last month' : undefined,
                },
                {
                  label: 'Net earnings',
                  value: money(metrics.netEarningsCents),
                  icon: Wallet,
                  iconClassName: kpiIconTone.violet,
                  trendLabel:
                    metrics.netEarningsDelta != null
                      ? `↑ ${metrics.netEarningsDelta}%`
                      : undefined,
                  trendPositive: true,
                  trendCaption:
                    metrics.netEarningsDelta != null ? 'vs. last month' : undefined,
                },
                {
                  label: 'Total paid out',
                  value: money(metrics.totalPaidOutCents),
                  icon: CreditCard,
                  iconClassName: kpiIconTone.sky,
                  trendLabel:
                    metrics.totalPaidOutDelta != null
                      ? `↑ ${metrics.totalPaidOutDelta}%`
                      : undefined,
                  trendPositive: true,
                  trendCaption:
                    metrics.totalPaidOutDelta != null ? 'vs. last month' : undefined,
                },
                {
                  label: 'Pending payout',
                  value: money(metrics.pendingPayoutCents),
                  icon: Clock,
                  iconClassName: kpiIconTone.amber,
                  trendLabel:
                    metrics.pendingPayoutDelta != null
                      ? `↑ ${metrics.pendingPayoutDelta}%`
                      : undefined,
                  trendPositive: true,
                  trendCaption:
                    metrics.pendingPayoutDelta != null ? 'vs. last month' : undefined,
                },
              ]}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-8">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Revenue &amp; Payouts
                </h2>
                <Select value={chartGranularity} onValueChange={setChartGranularity}>
                  <SelectTrigger className="h-9 w-[7.5rem] rounded-xl text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-72 min-w-0 w-full">
                {series.length === 0 ? (
                  <p className="py-20 text-center text-sm text-muted-foreground">No revenue yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                        domain={useDemo ? [0, 800] : ['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 13,
                        }}
                        formatter={(value: number | string) =>
                          typeof value === 'number' ? `$${value.toLocaleString()}` : value
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="payouts"
                        name="Payouts"
                        fill="hsl(160 84% 39%)"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="hsl(262 83% 58%)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        name="Net earnings"
                        stroke="hsl(217 91% 60%)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-4">
              <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
                Revenue by Product Type
              </h2>
              <div className="relative mx-auto h-48 w-full max-w-[14rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byType}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={74}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {byType.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) =>
                        typeof value === 'number' ? `${value}%` : value
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-extrabold tabular-nums text-foreground">
                    {donutTotalLabel}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total revenue
                  </p>
                </div>
              </div>
              <ul className="mt-2 space-y-1.5">
                {byType.map((p) => (
                  <li key={p.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: p.color }}
                      />
                      {p.name}
                    </span>
                    <span className="font-bold tabular-nums">{p.value}%</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <section
              id="recent-earnings"
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-8"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Recent Earnings
                </h2>
                <Link
                  to="/creator/transactions"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View all →
                </Link>
              </div>
              {transactions.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-2">Date</th>
                        <th className="py-2 pr-2">Type</th>
                        <th className="py-2 pr-2">Source</th>
                        <th className="py-2 pr-2 text-right">Amount</th>
                        <th className="py-2 pr-2 text-right">Fee</th>
                        <th className="py-2 pr-2 text-right">Net amount</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => {
                        const Icon = typeIcon(t.type);
                        return (
                          <tr key={t.id} className="border-b border-border/70 last:border-0">
                            <td className="whitespace-nowrap py-3 pr-2 text-muted-foreground">
                              {format(t.dateMs, 'MMM d, yyyy')}
                            </td>
                            <td className="py-3 pr-2">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                  <Icon className="h-3.5 w-3.5" aria-hidden />
                                </span>
                                {t.type}
                              </span>
                            </td>
                            <td className="max-w-[10rem] truncate py-3 pr-2 text-muted-foreground">
                              {t.source}
                            </td>
                            <td className="py-3 pr-2 text-right font-semibold tabular-nums">
                              {moneyExact(t.amountCents)}
                            </td>
                            <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                              {moneyExact(t.feeCents)}
                            </td>
                            <td className="py-3 pr-2 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {moneyExact(t.netCents)}
                            </td>
                            <td className="py-3 text-right">
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                                  t.status === 'completed'
                                    ? resultPillTone.published
                                    : resultPillTone.pending,
                                )}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4 xl:col-span-4">
              <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
                  Upcoming Payout
                </h2>
                <p className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {money(metrics.upcomingPayoutCents)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Estimated payout</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  <span className="font-semibold text-foreground">
                    {metrics.upcomingPayoutDateLabel}
                  </span>
                </p>
                <Button asChild className="mt-4 min-h-11 w-full rounded-xl">
                  <Link to="/creator/payouts">View Payout Details →</Link>
                </Button>
              </section>

              <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
                <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
                  <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                  Tips to increase your earnings
                </h2>
                <ul className="space-y-2.5">
                  {CREATOR_EARNINGS_TIPS.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
    </DashboardLayout>
  );
};

export default CreatorEarnings;
