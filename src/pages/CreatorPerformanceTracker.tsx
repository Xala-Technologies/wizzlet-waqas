import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Eye,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Package,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import { cn } from '@/lib/utils';
import {
  CREATOR_PERFORMANCE_DEMO_GROWTH,
  CREATOR_PERFORMANCE_DEMO_INSIGHTS,
  CREATOR_PERFORMANCE_DEMO_METRICS,
  CREATOR_PERFORMANCE_DEMO_REVENUE_SERIES,
  CREATOR_PERFORMANCE_DEMO_TOP_POSTS,
  CREATOR_PERFORMANCE_DEMO_TOP_PRODUCTS,
  formatCompactCount,
  shouldUseCreatorPerformanceDemo,
  type ChartRange,
  type DemoGrowthCard,
  type DemoInsight,
  type DemoTopPost,
  type DemoTopProduct,
} from '@/lib/creatorPerformanceDemo';

const CHART_RANGES: ChartRange[] = ['7D', '30D', '90D', '1Y', 'All'];

const insightIcon = {
  emerald: TrendingUp,
  violet: Users,
  sky: Eye,
  amber: Star,
  rose: TrendingDown,
} as const;

const insightToneClass = {
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
} as const;

function postTypeIcon(type: DemoTopPost['type']) {
  if (type === 'Video') return Video;
  if (type === 'Image') return ImageIcon;
  return FileText;
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function GrowthMiniChart({ card }: { card: DemoGrowthCard }) {
  const data = card.series.map((v, i) => ({ i, v }));
  const positive =
    card.invertTrend ? card.trendPct <= 0 : card.trendPct >= 0;
  const TrendIcon = card.trendPct >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{card.label}</p>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
            positive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden />
          {Math.abs(card.trendPct)}%
        </span>
      </div>
      <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
        {card.value}
      </p>
      <div className="mt-3 h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`growth-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={card.stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={card.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={card.stroke}
              strokeWidth={2}
              fill={`url(#growth-${card.id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const CreatorPerformanceTracker = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const creator = useQuery(api.creators.queries.myCreator);
  const earnings = useQuery(api.creators.earnings.myEarnings);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const posts = useQuery(api.posts.queries.listMine);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator?._id ? { creatorId: creator._id, activeOnly: true } : 'skip',
  );

  const [chartRange, setChartRange] = useState<ChartRange>('30D');
  const [metricKey, setMetricKey] = useState('revenue');

  const loading =
    creator === undefined ||
    earnings === undefined ||
    subs === undefined ||
    posts === undefined ||
    analytics === undefined ||
    (creator?._id != null && products === undefined);

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === 'active'),
    [subs],
  );

  const hasMeaningfulActivity =
    (earnings?.grossCents ?? 0) > 0 ||
    activeSubs.length > 0 ||
    (posts?.length ?? 0) > 0 ||
    (products?.length ?? 0) > 0;

  const useDemo = shouldUseCreatorPerformanceDemo({
    hasMeaningfulActivity,
    forceDemo,
    disableDemo,
  });

  const metrics = useDemo
    ? CREATOR_PERFORMANCE_DEMO_METRICS
    : {
        totalRevenueCents: earnings?.grossCents ?? 0,
        totalRevenueDelta: null as number | null,
        mrrCents: Math.round(
          activeSubs.reduce((sum, s) => sum + (s.amountCents ?? 0), 0),
        ),
        mrrDelta: null as number | null,
        totalSubscribers: activeSubs.length,
        subscribersDelta: null as number | null,
        postViews: (analytics ?? []).filter((e) => e.eventType === 'post_view').length,
        postViewsDelta: null as number | null,
        dateRangeLabel: 'Last 30 days',
      };

  const revenueSeries = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_REVENUE_SERIES;
    const monthly = earnings?.monthly ?? [];
    if (monthly.length === 0) return [];
    return monthly.slice(-12).map((m) => ({
      label: m.month.length >= 7 ? m.month.slice(5) : m.month,
      fullLabel: m.month,
      revenue: Math.round(m.revenueCents) / 100,
    }));
  }, [useDemo, earnings?.monthly]);

  const insights: DemoInsight[] = useDemo
    ? CREATOR_PERFORMANCE_DEMO_INSIGHTS
    : [
        {
          id: 'live-1',
          tone: 'violet',
          text:
            activeSubs.length > 0
              ? `You have ${activeSubs.length} active subscriber${activeSubs.length === 1 ? '' : 's'}.`
              : 'No active subscribers yet — share your profile to grow.',
        },
        {
          id: 'live-2',
          tone: 'emerald',
          text:
            (earnings?.grossCents ?? 0) > 0
              ? `Gross revenue so far: ${money(earnings!.grossCents)}.`
              : 'Revenue will appear here after your first payment.',
        },
        {
          id: 'live-3',
          tone: 'sky',
          text:
            (posts?.length ?? 0) > 0
              ? `${posts!.length} published pick${posts!.length === 1 ? '' : 's'} in Your Picks.`
              : 'Publish picks to start tracking content performance.',
        },
      ];

  const growthCards = useDemo
    ? CREATOR_PERFORMANCE_DEMO_GROWTH
    : ([
        {
          id: 'subs',
          label: 'Subscribers Growth',
          value: String(activeSubs.length),
          trendPct: 0,
          series: [Math.max(0, activeSubs.length - 2), activeSubs.length],
          stroke: 'hsl(239 84% 60%)',
          fill: 'hsl(239 84% 60% / 0.18)',
        },
        {
          id: 'conv',
          label: 'Conversion Rate',
          value: '—',
          trendPct: 0,
          series: [1, 1],
          stroke: 'hsl(160 84% 39%)',
          fill: 'hsl(160 84% 39% / 0.18)',
        },
        {
          id: 'churn',
          label: 'Churn Rate',
          value: '—',
          trendPct: 0,
          invertTrend: true,
          series: [1, 1],
          stroke: 'hsl(0 84% 60%)',
          fill: 'hsl(0 84% 60% / 0.16)',
        },
      ] satisfies DemoGrowthCard[]);

  const topPosts: DemoTopPost[] = useDemo
    ? CREATOR_PERFORMANCE_DEMO_TOP_POSTS
    : (posts ?? []).slice(0, 5).map((p, i) => ({
        id: p._id,
        rank: i + 1,
        title: p.title,
        subtitle: p.isPremium ? 'Premium pick' : 'Free pick',
        type: 'Text' as const,
        views: 0,
        likes: 0,
        comments: 0,
        conversions: 0,
        revenueCents: 0,
        thumbTone: 'bg-violet-500/15 text-violet-700',
      }));

  const topProducts: DemoTopProduct[] = useDemo
    ? CREATOR_PERFORMANCE_DEMO_TOP_PRODUCTS
    : (products ?? []).slice(0, 5).map((p, i) => {
        const count = activeSubs.filter((s) => s.productId === p._id).length;
        return {
          id: p._id,
          rank: i + 1,
          name: p.name,
          subscribers: count,
          revenueCents: count * (p.priceCents ?? 0),
          conversionPct: 0,
          iconTone:
            i === 0
              ? 'bg-sky-500/15 text-sky-700'
              : i === 1
                ? 'bg-rose-500/15 text-rose-700'
                : 'bg-violet-500/15 text-violet-700',
        };
      });

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
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Performance
          </h1>
          <p className="mt-1.5 max-w-xl text-support text-muted-foreground">
            Track your growth, analyze your content, and make smarter decisions.
          </p>
        </div>
        <div className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)]">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="tabular-nums">{metrics.dateRangeLabel}</span>
        </div>
      </header>

      {useDemo ? (
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
      ) : null}

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
            },
            {
              label: 'Monthly recurring revenue',
              value: money(metrics.mrrCents),
              icon: BarChart3,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.mrrDelta != null
                  ? `↑ ${metrics.mrrDelta}%`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Total subscribers',
              value: metrics.totalSubscribers.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.subscribersDelta != null
                  ? `↑ ${metrics.subscribersDelta}%`
                  : undefined,
              trendPositive: true,
              href: '/creator/subscribers',
            },
            {
              label: 'Post views',
              value: formatCompactCount(metrics.postViews),
              icon: Eye,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.postViewsDelta != null
                  ? `↑ ${metrics.postViewsDelta}%`
                  : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 xl:col-span-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Revenue Overview
              </h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <p className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                  {money(metrics.totalRevenueCents)}
                </p>
                {metrics.totalRevenueDelta != null ? (
                  <span className="inline-flex items-center gap-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                    {metrics.totalRevenueDelta}%
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={metricKey} onValueChange={setMetricKey}>
                <SelectTrigger className="h-10 w-[8.5rem] rounded-xl border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="mrr">MRR</SelectItem>
                  <SelectItem value="subs">Subscribers</SelectItem>
                </SelectContent>
              </Select>
              <div className={segmentedTrackClassName} role="group" aria-label="Chart range">
                {CHART_RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={segmentedItemClassName(chartRange === r)}
                    onClick={() => setChartRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-72 min-w-0 w-full sm:h-80">
            {revenueSeries.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No revenue data for this period yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueSeries}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="perfRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(239 84% 60%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(239 84% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
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
                    width={48}
                    tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                      fontSize: 13,
                      boxShadow: 'var(--shadow-card)',
                    }}
                    formatter={(value: number) => [
                      `$${Number(value).toLocaleString()}`,
                      metricKey === 'mrr'
                        ? 'MRR'
                        : metricKey === 'subs'
                          ? 'Subscribers'
                          : 'Revenue',
                    ]}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as
                        | { fullLabel?: string; label?: string }
                        | undefined;
                      return row?.fullLabel ?? row?.label ?? '';
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(239 84% 55%)"
                    strokeWidth={2.5}
                    fill="url(#perfRevenueFill)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Showing {chartRange} · {metricKey === 'revenue' ? 'Revenue' : metricKey.toUpperCase()}
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 xl:col-span-4">
          <div className="mb-4 flex items-center gap-2">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpiIconTone.amber)}>
              <Lightbulb className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Key Insights
            </h2>
          </div>
          <ul className="space-y-3">
            {insights.map((insight) => {
              const Icon = insightIcon[insight.tone];
              return (
                <li
                  key={insight.id}
                  className="flex gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      insightToneClass[insight.tone],
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {insight.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {growthCards.map((card) => (
          <GrowthMiniChart key={card.id} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 xl:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Top Performing Posts
            </h2>
            <Link
              to="/creator/posts"
              className="text-xs font-bold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {topPosts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No posts yet.{' '}
              <Link to="/creator/posts" className="font-semibold text-primary hover:underline">
                Create a pick
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Post</th>
                    <th className="py-2 pr-2">Type</th>
                    <th className="py-2 pr-2 text-right">Views</th>
                    <th className="py-2 pr-2 text-right">Likes</th>
                    <th className="py-2 pr-2 text-right">Comments</th>
                    <th className="py-2 pr-2 text-right">Conv.</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topPosts.map((post) => {
                    const TypeIcon = postTypeIcon(post.type);
                    return (
                      <tr key={post.id} className="border-b border-border/70 last:border-0">
                        <td className="py-3 pr-2 tabular-nums text-muted-foreground">
                          {post.rank}
                        </td>
                        <td className="py-3 pr-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                post.thumbTone,
                              )}
                            >
                              <TypeIcon className="h-4 w-4" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{post.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {post.subtitle}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-2">
                          <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {post.type}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums font-medium">
                          {post.views ? formatCompactCount(post.views) : '—'}
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                          {post.likes || '—'}
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                          {post.comments || '—'}
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums font-medium">
                          {post.conversions || '—'}
                        </td>
                        <td className="py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {post.revenueCents > 0 ? money(post.revenueCents) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Top Performing Products
            </h2>
            <Link
              to="/creator/products"
              className="text-xs font-bold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No products yet.{' '}
              <Link to="/creator/products" className="font-semibold text-primary hover:underline">
                Add a product
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Product</th>
                    <th className="py-2 pr-2 text-right">Subs</th>
                    <th className="py-2 pr-2 text-right">Revenue</th>
                    <th className="py-2 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-2 tabular-nums text-muted-foreground">
                        {product.rank}
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              product.iconTone,
                            )}
                          >
                            <Package className="h-4 w-4" aria-hidden />
                          </span>
                          <p className="truncate font-semibold text-foreground">{product.name}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-right tabular-nums font-medium">
                        {product.subscribers.toLocaleString()}
                      </td>
                      <td className="py-3 pr-2 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {product.revenueCents > 0 ? money(product.revenueCents) : '—'}
                      </td>
                      <td className="py-3 text-right tabular-nums text-muted-foreground">
                        {product.conversionPct > 0 ? `${product.conversionPct}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default CreatorPerformanceTracker;
