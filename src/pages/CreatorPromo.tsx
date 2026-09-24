import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  ChevronDown,
  Link2,
  Loader2,
  Megaphone,
  MoreVertical,
  MousePointerClick,
  Percent,
  Sparkles,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { MarketingSubnav } from '@/components/creator/MarketingSubnav';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_MARKETING_DEMO_ACTIVITY,
  CREATOR_MARKETING_DEMO_MANAGE,
  CREATOR_MARKETING_DEMO_METRICS,
  CREATOR_MARKETING_DEMO_SERIES,
  CREATOR_MARKETING_DEMO_TRAFFIC,
  shouldUseCreatorMarketingDemo,
  type DemoActivityRow,
  type DemoManageCard,
  type MarketingChartMetric,
} from '@/lib/creatorMarketingDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import { cn } from '@/lib/utils';

const THIRTY_DAYS_MS = 30 * 86_400_000;

const CHART_TABS: { id: MarketingChartMetric; label: string }[] = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'signUps', label: 'Sign ups' },
  { id: 'conversions', label: 'Conversions' },
];

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function moneyExact(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function activityTypeMeta(type: DemoActivityRow['type']) {
  if (type === 'Promo Code') {
    return {
      icon: Tag,
      tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
    };
  }
  if (type === 'Link') {
    return {
      icon: Link2,
      tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
    };
  }
  return {
    icon: UserPlus,
    tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  };
}

const CreatorPromo = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const links = useQuery(api.creators.growth.listMyLinks);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);

  const [chartMetric, setChartMetric] = useState<MarketingChartMetric>('revenue');
  const [chartGranularity, setChartGranularity] = useState('daily');

  const loading =
    creatorLoading ||
    promos === undefined ||
    links === undefined ||
    analytics === undefined ||
    subs === undefined;

  const promoRows = useMemo(() => promos ?? [], [promos]);
  const linkRows = useMemo(() => links ?? [], [links]);

  const realLinkClicks = linkRows.reduce((sum, l) => sum + l.clicks, 0);
  const realConversions = linkRows.reduce((sum, l) => sum + l.conversions, 0);
  const realProfileViews = (analytics ?? []).filter((e) => e.eventType === 'profile_view').length;
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const realNewSubs = (subs ?? []).filter((s) => s.createdAt >= cutoff).length;
  const realRevenueCents = (subs ?? [])
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amountCents, 0);

  const useDemo = shouldUseCreatorMarketingDemo({
    linkClicks: realLinkClicks,
    profileViews: realProfileViews,
    promoCount: promoRows.length,
    forceDemo,
    disableDemo,
  });

  const metrics = useDemo
    ? CREATOR_MARKETING_DEMO_METRICS
    : {
        totalClicks: realLinkClicks,
        totalClicksDelta: null as number | null,
        signUps: realNewSubs,
        signUpsDelta: null as number | null,
        paidConversions: realConversions,
        paidConversionsDelta: null as number | null,
        revenueCents: realRevenueCents,
        revenueDelta: null as number | null,
        dateRangeLabel: 'Last 30 days',
      };

  const series = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_SERIES;
    return [] as typeof CREATOR_MARKETING_DEMO_SERIES;
  }, [useDemo]);

  const trafficSources = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_TRAFFIC;
    if (linkRows.length === 0 && realProfileViews === 0) return [];
    const linkShare = realLinkClicks;
    const directShare = realProfileViews;
    const total = linkShare + directShare || 1;
    return [
      {
        name: 'Tracking links',
        value: Math.round((linkShare / total) * 100) || (linkShare > 0 ? 1 : 0),
        color: 'hsl(239 84% 60%)',
      },
      {
        name: 'Profile views',
        value: Math.round((directShare / total) * 100) || (directShare > 0 ? 1 : 0),
        color: 'hsl(280 70% 55%)',
      },
    ].filter((s) => s.value > 0);
  }, [useDemo, linkRows.length, realLinkClicks, realProfileViews]);

  const manageCards: DemoManageCard[] = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_MANAGE;
    const activePromos = promoRows.filter((p) => p.isActive).length;
    const promoUses = promoRows.reduce((sum, p) => sum + p.usedCount, 0);
    const activeLinks = linkRows.length;
    const convRate =
      realLinkClicks > 0 ? ((realConversions / realLinkClicks) * 100).toFixed(1) : '0';
    return [
      {
        id: 'promo' as const,
        title: 'Promo Codes',
        href: '/creator/promo/codes',
        manageLabel: 'Manage Promo Codes',
        manageTone: 'primary' as const,
        stats: [
          { label: 'Active codes', value: String(activePromos) },
          { label: 'Revenue generated', value: '—' },
          { label: 'Total uses', value: String(promoUses) },
        ],
      },
      {
        id: 'links' as const,
        title: 'Links',
        href: '/creator/links',
        manageLabel: 'Manage Links',
        manageTone: 'primary' as const,
        stats: [
          { label: 'Active links', value: String(activeLinks) },
          { label: 'Total clicks', value: realLinkClicks.toLocaleString() },
          { label: 'Conversion rate', value: `${convRate}%` },
        ],
      },
      {
        id: 'referrals' as const,
        title: 'Referrals',
        href: '/creator/referrals',
        manageLabel: 'Manage Referrals',
        manageTone: 'emerald' as const,
        stats: [
          { label: 'Active referrers', value: '—' },
          { label: 'Revenue generated', value: '—' },
          { label: 'New customers', value: '—' },
        ],
      },
    ];
  }, [useDemo, promoRows, linkRows, realLinkClicks, realConversions]);

  const activity: DemoActivityRow[] = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_ACTIVITY;
    const fromPromos: DemoActivityRow[] = promoRows.slice(0, 3).map((p) => ({
      id: p._id,
      dateLabel: formatShortDate(p._creationTime),
      type: 'Promo Code' as const,
      name: p.code,
      details: `${p.discountPercent}% off — used by ${p.usedCount} customers`,
      clicks: p.usedCount * 4,
      conversions: p.usedCount,
      revenueCents: 0,
    }));
    const fromLinks: DemoActivityRow[] = linkRows.slice(0, 3).map((l) => ({
      id: l._id,
      dateLabel: formatShortDate(l._creationTime),
      type: 'Link' as const,
      name: l.name,
      details: l.url || 'Tracking link',
      clicks: l.clicks,
      conversions: l.conversions,
      revenueCents: 0,
    }));
    return [...fromPromos, ...fromLinks].slice(0, 5);
  }, [useDemo, promoRows, linkRows]);

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Marketing
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
            Grow your audience, drive more sales, and track what works.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Megaphone className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to unlock marketing tools and promo codes.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const chartTitle =
    chartMetric === 'revenue'
      ? 'Marketing Revenue'
      : chartMetric === 'clicks'
        ? 'Marketing Clicks'
        : chartMetric === 'signUps'
          ? 'Marketing Sign ups'
          : 'Marketing Conversions';

  return (
    <DashboardLayout type="creator">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Marketing
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
            Grow your audience, drive more sales, and track what works.
          </p>
        </div>
        <div className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)]">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="tabular-nums">{metrics.dateRangeLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      </header>

      <MarketingSubnav active="overview" />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — charts and campaigns are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total Clicks',
              value: metrics.totalClicks.toLocaleString(),
              icon: MousePointerClick,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.totalClicksDelta != null ? `↑ ${metrics.totalClicksDelta}%` : undefined,
              trendCaption:
                metrics.totalClicksDelta != null ? 'vs. previous month' : undefined,
              trendPositive: true,
            },
            {
              label: 'Sign ups',
              value: metrics.signUps.toLocaleString(),
              icon: UserPlus,
              iconClassName: kpiIconTone.sky,
              trendLabel: metrics.signUpsDelta != null ? `↑ ${metrics.signUpsDelta}%` : undefined,
              trendCaption: metrics.signUpsDelta != null ? 'vs. previous month' : undefined,
              trendPositive: true,
            },
            {
              label: 'Paid conversions',
              value: metrics.paidConversions.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.amber,
              trendLabel:
                metrics.paidConversionsDelta != null
                  ? `↑ ${metrics.paidConversionsDelta}%`
                  : undefined,
              trendCaption:
                metrics.paidConversionsDelta != null ? 'vs. previous month' : undefined,
              trendPositive: true,
            },
            {
              label: 'Revenue from marketing',
              value: money(metrics.revenueCents),
              icon: TrendingUp,
              iconClassName: kpiIconTone.emerald,
              trendLabel: metrics.revenueDelta != null ? `↑ ${metrics.revenueDelta}%` : undefined,
              trendCaption: metrics.revenueDelta != null ? 'vs. previous month' : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 xl:col-span-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">{chartTitle}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className={segmentedTrackClassName} role="group" aria-label="Chart metric">
                {CHART_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={segmentedItemClassName(chartMetric === t.id)}
                    onClick={() => setChartMetric(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Select value={chartGranularity} onValueChange={setChartGranularity}>
                <SelectTrigger
                  className="h-10 w-[7.5rem] rounded-xl border-border bg-background"
                  aria-label="Chart granularity"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-72 min-w-0 w-full sm:h-80">
            {series.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No marketing series to chart yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mktRevenueFill" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(v) =>
                      chartMetric === 'revenue'
                        ? Number(v) >= 1000
                          ? `$${Number(v) / 1000}K`
                          : `$${v}`
                        : String(v)
                    }
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
                      chartMetric === 'revenue'
                        ? `$${Number(value).toLocaleString()}`
                        : Number(value).toLocaleString(),
                      CHART_TABS.find((t) => t.id === chartMetric)?.label ?? 'Value',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="hsl(239 84% 55%)"
                    strokeWidth={2.5}
                    fill="url(#mktRevenueFill)"
                    dot={{ r: 3, fill: 'hsl(239 84% 55%)', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 xl:col-span-4">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Top Traffic Sources
          </h2>
          <div className="relative h-56">
            {trafficSources.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No traffic data yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficSources}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {trafficSources.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs font-medium text-muted-foreground">Total clicks</p>
                  <p className="text-lg font-extrabold tabular-nums text-foreground">
                    {metrics.totalClicks.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
          <ul className="mt-2 space-y-1.5">
            {trafficSources.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold tabular-nums">{s.value}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {manageCards.map((card) => (
          <section
            key={card.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  card.id === 'promo'
                    ? kpiIconTone.violet
                    : card.id === 'links'
                      ? kpiIconTone.sky
                      : kpiIconTone.emerald,
                )}
              >
                {card.id === 'promo' ? (
                  <Percent className="h-4 w-4" aria-hidden />
                ) : card.id === 'links' ? (
                  <Link2 className="h-4 w-4" aria-hidden />
                ) : (
                  <UserPlus className="h-4 w-4" aria-hidden />
                )}
              </span>
              <h3 className="text-base font-extrabold tracking-tight text-foreground">
                {card.title}
              </h3>
            </div>
            <ul className="space-y-2.5">
              {card.stats.map((stat) => (
                <li key={stat.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-extrabold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to={card.href}
              className={cn(
                'mt-5 inline-flex text-sm font-bold hover:underline',
                card.manageTone === 'emerald'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-primary',
              )}
            >
              {card.manageLabel} →
            </Link>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Recent Marketing Activity
          </h2>
          <Link to="/creator/links" className="text-xs font-bold text-primary hover:underline">
            View all →
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No marketing activity yet — create a promo or tracking link to see events here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Details</th>
                  <th className="py-2 pr-2 text-right">Clicks</th>
                  <th className="py-2 pr-2 text-right">Conversions</th>
                  <th className="py-2 pr-2 text-right">Revenue</th>
                  <th className="py-2 w-10">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => {
                  const meta = activityTypeMeta(row.type);
                  const TypeIcon = meta.icon;
                  return (
                    <tr key={row.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-2 whitespace-nowrap text-muted-foreground">
                        {row.dateLabel}
                      </td>
                      <td className="py-3 pr-2">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg',
                              meta.tone,
                            )}
                          >
                            <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="font-medium text-muted-foreground">{row.type}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-2 font-semibold text-foreground">{row.name}</td>
                      <td className="py-3 pr-2 max-w-[14rem] truncate text-muted-foreground">
                        {row.details}
                      </td>
                      <td className="py-3 pr-2 text-right tabular-nums font-medium">
                        {row.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 pr-2 text-right tabular-nums font-medium">
                        {row.conversions.toLocaleString()}
                      </td>
                      <td className="py-3 pr-2 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {row.revenueCents > 0 ? moneyExact(row.revenueCents) : '—'}
                      </td>
                      <td className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Row actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() =>
                                toast.message('Preview only', {
                                  description: 'Open Manage tools to edit real campaigns.',
                                })
                              }
                            >
                              View details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default CreatorPromo;
