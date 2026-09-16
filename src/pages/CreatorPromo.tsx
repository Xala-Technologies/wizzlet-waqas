import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  CartesianGrid,
  Cell,
  Legend as RechartsLegend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Calendar,
  Loader2,
  Megaphone,
  MousePointerClick,
  Percent,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { type PromoDiscountDuration } from '../../convex/lib/promoCodes';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { MarketingSubnav } from '@/components/creator/MarketingSubnav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_MARKETING_DEMO_CAMPAIGNS,
  CREATOR_MARKETING_DEMO_METRICS,
  CREATOR_MARKETING_DEMO_PLATFORMS,
  CREATOR_MARKETING_DEMO_SERIES,
  CREATOR_MARKETING_DEMO_TRAFFIC,
  shouldUseCreatorMarketingDemo,
  type DemoCampaignRow,
  type DemoPlatformCard,
} from '@/lib/creatorMarketingDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const THIRTY_DAYS_MS = 30 * 86_400_000;

type CampaignStatus = DemoCampaignRow['status'];

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusPill(status: CampaignStatus): string {
  if (status === 'active') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  if (status === 'paused') {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }
  return 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400';
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
  const upsertPromo = useMutation(api.creators.growth.upsertPromo);

  const [chartGranularity, setChartGranularity] = useState('daily');
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('15');
  const [duration, setDuration] = useState<PromoDiscountDuration>('once');
  const [maxUses, setMaxUses] = useState('');
  const [saving, setSaving] = useState(false);

  const loading =
    creatorLoading ||
    promos === undefined ||
    links === undefined ||
    analytics === undefined ||
    subs === undefined;

  const promoRows = promos ?? [];
  const linkRows = links ?? [];

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
        color: 'hsl(217 91% 60%)',
      },
      {
        name: 'Profile views',
        value: Math.round((directShare / total) * 100) || (directShare > 0 ? 1 : 0),
        color: 'hsl(280 70% 55%)',
      },
    ].filter((s) => s.value > 0);
  }, [useDemo, linkRows.length, realLinkClicks, realProfileViews]);

  const platforms: DemoPlatformCard[] = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_PLATFORMS;
    if (realLinkClicks <= 0) return [];
    return [
      {
        id: 'links',
        name: 'Tracking links',
        clicks: realLinkClicks,
        delta: 0,
        tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
        href: '/creator/links',
      },
    ];
  }, [useDemo, realLinkClicks]);

  const campaigns: DemoCampaignRow[] = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_CAMPAIGNS;
    const fromPromos: DemoCampaignRow[] = promoRows.slice(0, 4).map((p) => ({
      id: p._id,
      dateLabel: formatShortDate(p._creationTime),
      type: 'Promo Code' as const,
      name: p.code,
      clicks: p.usedCount * 4,
      signUps: p.usedCount,
      conversions: p.usedCount,
      revenueCents: 0,
      status: p.isActive ? ('active' as const) : ('paused' as const),
    }));
    const fromLinks: DemoCampaignRow[] = linkRows.slice(0, 4).map((l) => ({
      id: l._id,
      dateLabel: formatShortDate(l._creationTime),
      type: 'Link' as const,
      name: l.name,
      clicks: l.clicks,
      signUps: Math.max(0, l.conversions),
      conversions: l.conversions,
      revenueCents: 0,
      status: 'active' as const,
    }));
    return [...fromPromos, ...fromLinks].slice(0, 6);
  }, [useDemo, promoRows, linkRows]);

  const reviewCode = code.trim().toUpperCase() || 'CODE';
  const reviewDiscount = Number(discount);
  const reviewBits = [
    Number.isInteger(reviewDiscount) && reviewDiscount >= 1 && reviewDiscount <= 100
      ? `${reviewDiscount}%`
      : null,
    duration === 'forever' ? 'Forever' : 'Once',
    maxUses.trim() ? `max ${maxUses.trim()}` : 'unlimited',
  ].filter(Boolean);

  const handleCreate = async () => {
    if (!creator || saving) return;
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) {
      toast.error('Codes need at least 3 characters');
      return;
    }
    const d = Number(discount);
    if (!Number.isInteger(d) || d < 1 || d > 100) {
      toast.error('Discount must be a whole number between 1% and 100%');
      return;
    }
    const max = maxUses.trim() ? Number(maxUses) : undefined;
    if (max !== undefined && (Number.isNaN(max) || max < 1)) {
      toast.error('Max uses must be a positive number');
      return;
    }
    setSaving(true);
    try {
      await upsertPromo({
        code: clean,
        discountPercent: d,
        discountDuration: duration,
        maxUses: max,
        isActive: true,
      });
      toast.success(`${clean} created`);
      setCode('');
      setMaxUses('');
      setDuration('once');
      setCreateOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create code';
      if (msg.includes('PROMO_CODE_TAKEN')) toast.error('That code is already taken');
      else if (msg.includes('INVALID_')) toast.error('Invalid promo details');
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-heading font-bold tracking-tight text-foreground">Marketing</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
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

  const dateRangeLabel = metrics.dateRangeLabel;

  return (
    <DashboardLayout type="creator">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Marketing
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Grow your audience, drive more sales, and track what works.
          </p>
        </div>
        <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-[var(--shadow-card)]">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
          <span className="tabular-nums">{dateRangeLabel}</span>
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
              label: 'Total clicks',
              value: metrics.totalClicks.toLocaleString(),
              icon: MousePointerClick,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.totalClicksDelta != null ? `↑ ${metrics.totalClicksDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Sign ups',
              value: metrics.signUps.toLocaleString(),
              icon: UserPlus,
              iconClassName: kpiIconTone.sky,
              trendLabel: metrics.signUpsDelta != null ? `↑ ${metrics.signUpsDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Paid conversions',
              value: metrics.paidConversions.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.paidConversionsDelta != null
                  ? `↑ ${metrics.paidConversionsDelta}%`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Revenue from marketing',
              value: money(metrics.revenueCents),
              icon: TrendingUp,
              iconClassName: kpiIconTone.emerald,
              trendLabel: metrics.revenueDelta != null ? `↑ ${metrics.revenueDelta}%` : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Clicks, Sign ups & Revenue
            </h2>
            <Select value={chartGranularity} onValueChange={setChartGranularity}>
              <SelectTrigger
                className="min-h-11 w-full rounded-xl sm:w-[7.5rem]"
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
          <div className="h-72 min-w-0 w-full">
            {series.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">
                No click or conversion series to chart yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 13,
                    }}
                  />
                  <RechartsLegend />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="hsl(217 91% 60%)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: 'hsl(217 91% 60%)' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="signUps"
                    name="Sign ups"
                    stroke="hsl(270 70% 55%)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: 'hsl(270 70% 55%)' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Conversions"
                    stroke="hsl(160 84% 39%)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: 'hsl(160 84% 39%)' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-4">
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
                    <Tooltip />
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {platforms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-card)] sm:col-span-2 xl:col-span-4">
            No platform traffic yet — create tracking links to see clicks by channel.
          </div>
        ) : (
          platforms.map((p) => (
            <section
              key={p.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold',
                    p.tone,
                  )}
                >
                  {p.name.slice(0, 1)}
                </span>
                <h3 className="text-sm font-extrabold tracking-tight text-foreground">{p.name}</h3>
              </div>
              <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                {p.clicks.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">clicks</p>
              {p.delta > 0 ? (
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ↑ {p.delta}%
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">—</p>
              )}
              <Button asChild variant="outline" className="mt-4 min-h-11 w-full rounded-xl">
                <Link to={p.href}>View Details →</Link>
              </Button>
            </section>
          ))
        )}

        <section className="flex flex-col justify-between rounded-2xl bg-violet-600 p-5 text-white shadow-[var(--shadow-card)] xl:col-span-1">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Reach more people</h3>
            <p className="mt-2 text-sm text-white/85">
              Launch a promo or campaign to grow clicks and paid conversions.
            </p>
          </div>
          <Button
            type="button"
            className="mt-5 min-h-11 w-full rounded-xl bg-white text-violet-700 hover:bg-white/90"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Campaign
          </Button>
        </section>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Recent Campaigns
          </h2>
          <Link to="/creator/links" className="text-xs font-bold text-primary hover:underline">
            View all
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No campaigns yet — create a promo or tracking link to see activity here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2 text-right">Clicks</th>
                  <th className="py-2 pr-2 text-right">Sign ups</th>
                  <th className="py-2 pr-2 text-right">Conversions</th>
                  <th className="py-2 pr-2 text-right">Revenue</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-2 whitespace-nowrap text-muted-foreground">
                      {c.dateLabel}
                    </td>
                    <td className="py-3 pr-2 text-muted-foreground">{c.type}</td>
                    <td className="py-3 pr-2 font-semibold text-foreground">{c.name}</td>
                    <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                      {c.clicks.toLocaleString()}
                    </td>
                    <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                      {c.signUps.toLocaleString()}
                    </td>
                    <td className="py-3 pr-2 text-right font-bold tabular-nums">{c.conversions}</td>
                    <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                      {c.revenueCents > 0 ? money(c.revenueCents) : '—'}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                          statusPill(c.status),
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
              <Percent className="h-4 w-4 text-primary" /> Promo Codes
            </h2>
            <p className="mt-1.5 text-support text-muted-foreground">
              Create discount codes, pause campaigns, and track uses on the dedicated Promo Codes
              page.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 rounded-xl"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Code
            </Button>
            <Button asChild className="min-h-11 shrink-0 rounded-xl">
              <Link to="/creator/promo/codes">
                Manage all codes
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create promo code</DialogTitle>
            <DialogDescription>
              Percent off for the first month only, or forever on every renewal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-code">Code</Label>
              <Input
                id="promo-code"
                className="h-11 min-h-11 font-mono uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER_SALE"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-discount">Discount % (1–100)</Label>
              <Input
                id="promo-discount"
                className="h-11 min-h-11"
                type="number"
                min={1}
                max={100}
                step={1}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <fieldset className="space-y-2">
              <Legend className="text-support font-medium text-muted-foreground">
                Discount duration
              </Legend>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="promo-duration"
                  className="mt-1"
                  checked={duration === 'once'}
                  onChange={() => setDuration('once')}
                />
                <span>
                  <span className="block text-ui font-medium text-foreground">Once</span>
                  <span className="text-support text-muted-foreground">First month only</span>
                </span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="promo-duration"
                  className="mt-1"
                  checked={duration === 'forever'}
                  onChange={() => setDuration('forever')}
                />
                <span>
                  <span className="block text-ui font-medium text-foreground">Forever</span>
                  <span className="text-support text-muted-foreground">Every renewal</span>
                </span>
              </label>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="promo-max">Max redemptions (optional)</Label>
              <Input
                id="promo-max"
                className="h-11 min-h-11"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-caption uppercase tracking-wider text-muted-foreground">Preview</p>
              <p className="truncate font-mono text-ui text-foreground">{reviewCode}</p>
              <p className="truncate text-support text-muted-foreground">{reviewBits.join(' · ')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={saving || !code.trim()}
              onClick={() => void handleCreate()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function Legend({ className, children }: { className?: string; children: ReactNode }) {
  return <legend className={className}>{children}</legend>;
}

export default CreatorPromo;
