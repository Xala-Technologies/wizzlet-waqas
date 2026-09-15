import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  BarChart3,
  DollarSign,
  FileText,
  Loader2,
  Megaphone,
  MessageSquare,
  PenLine,
  Plus,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { computeWinRate } from '../../convex/lib/results';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';
import { OverviewKpiStrip } from '@/components/creator/overview/OverviewKpiStrip';
import { OverviewRecentPicks } from '@/components/creator/overview/OverviewRecentPicks';
import { OverviewEarningsChart } from '@/components/creator/overview/OverviewEarningsChart';
import { OverviewProgressRing } from '@/components/creator/overview/OverviewProgressRing';
import { OverviewQuickActions } from '@/components/creator/overview/OverviewQuickActions';
import { OverviewRecentSubscribers } from '@/components/creator/overview/OverviewRecentSubscribers';
import { OverviewMessagesPanel } from '@/components/creator/overview/OverviewMessagesPanel';
import { OverviewTopPicks } from '@/components/creator/overview/OverviewTopPicks';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import {
  CREATOR_OVERVIEW_DEMO,
  shouldUseCreatorOverviewDemo,
} from '@/lib/creatorOverviewDemo';

const MOMENTUM_DISMISS_KEY = 'prizelet.creator.momentumBanner.dismissed';

function uiPickResult(result: string): 'win' | 'loss' | 'push' | 'pending' {
  if (result === 'won' || result === 'win') return 'win';
  if (result === 'lost' || result === 'loss') return 'loss';
  if (result === 'push') return 'push';
  return 'pending';
}

function profitLabel(units: number | null, result: string): { label: string; positive?: boolean } {
  if (result === 'pending' || units == null) return { label: '—' };
  const sign = units > 0 ? '+' : '';
  return {
    label: `${sign}${units.toFixed(2)}u`,
    positive: units > 0,
  };
}

const CreatorDashboard = () => {
  const [searchParams] = useSearchParams();
  const creator = useQuery(api.creators.queries.myCreator);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const postsRaw = useQuery(api.posts.queries.listMine);
  const picksRaw = useQuery(api.picks.mutations.listMine);
  const earnings = useQuery(api.creators.earnings.myEarnings);
  const inboxThreads = useQuery(api.messaging.mutations.overviewInboxThreads);
  const { results: recentSubRows, status: subsPageStatus } = usePaginatedQuery(
    api.subscriptions.mutations.listSubscribersDetailedPage,
    {},
    { initialNumItems: 5 },
  );

  const [momentumDismissed, setMomentumDismissed] = useState(
    () => safeGetItem(MOMENTUM_DISMISS_KEY) === '1',
  );
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const loading =
    creator === undefined ||
    subs === undefined ||
    postsRaw === undefined ||
    picksRaw === undefined ||
    earnings === undefined ||
    inboxThreads === undefined ||
    subsPageStatus === 'LoadingFirstPage';

  const picks = useMemo(
    () =>
      (picksRaw ?? []).map((p) => ({
        id: p._id,
        date: p.date,
        pickEvent: p.pickEvent,
        sport: p.sport,
        unitsRisked: p.unitsRisked,
        result: uiPickResult(p.result),
        unitsWonLost: p.unitsWonLost ?? null,
      })),
    [picksRaw],
  );

  const perf = useMemo(() => {
    const { wins, winRatePct, decided } = computeWinRate(picks.map((p) => p.result));
    const totalWonLost = picks.reduce((s, p) => s + (p.unitsWonLost || 0), 0);
    return { wins, winRate: winRatePct, settled: decided, totalWonLost };
  }, [picks]);

  /** Honest month-over-month from earnings.monthly when ≥2 months exist. */
  const revenueTrend = useMemo(() => {
    const monthly = earnings?.monthly ?? [];
    if (monthly.length < 2) return undefined;
    const last = monthly[monthly.length - 1]!;
    const prev = monthly[monthly.length - 2]!;
    if (prev.revenueCents <= 0) return undefined;
    const delta = ((last.revenueCents - prev.revenueCents) / prev.revenueCents) * 100;
    if (!Number.isFinite(delta)) return undefined;
    const rounded = Math.round(delta);
    if (rounded === 0) return undefined;
    return {
      label: `${rounded > 0 ? '↑' : '↓'} ${Math.abs(rounded)}%`,
      positive: rounded > 0,
    };
  }, [earnings?.monthly]);

  const activeSubs = (subs ?? []).filter((s) => s.status === 'active');
  const realPostCount = postsRaw?.length ?? 0;
  const realMrrNet = (earnings?.netCents ?? 0) / 100;
  const displayName =
    creator?.displayName?.trim() ||
    (creator?.username ? creator.username : 'creator');

  const useDemo =
    !disableDemo &&
    (forceDemo ||
      shouldUseCreatorOverviewDemo({
        postCount: realPostCount,
        settledPicks: perf.settled,
        activeSubscribers: activeSubs.length,
        netCents: earnings?.netCents ?? 0,
        pickCount: picks.length,
      }));

  const demo = CREATOR_OVERVIEW_DEMO;
  const postCount = useDemo ? demo.postCount : realPostCount;
  const mrrNet = useDemo ? demo.mrrNet : realMrrNet;
  const winRateValue = useDemo
    ? `${demo.winRatePct}%`
    : perf.settled > 0
      ? `${perf.winRate}%`
      : '—';
  const activeSubCount = useDemo ? demo.activeSubscribers : activeSubs.length;
  const displayRevenueTrend = useDemo ? demo.revenueTrend : revenueTrend;

  const recentPickRows = useMemo(() => {
    if (useDemo) return [...demo.recentPicks];
    return [...picks]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((p) => {
        const profit = profitLabel(p.unitsWonLost, p.result);
        return {
          id: p.id,
          dateLabel: p.date,
          event: p.pickEvent || 'Pick',
          sport: p.sport || 'Other',
          result: p.result,
          profitLabel: profit.label,
          profitPositive: profit.positive,
        };
      });
  }, [demo.recentPicks, picks, useDemo]);

  const earningsBars = useMemo(() => {
    if (useDemo) return [...demo.earningsBars];
    const monthly = earnings?.monthly ?? [];
    const last = monthly.slice(-6);
    return last.map((m) => ({
      label: m.month.length >= 7 ? m.month.slice(5) : m.month,
      valueCents: m.revenueCents,
    }));
  }, [demo.earningsBars, earnings?.monthly, useDemo]);

  const verificationPct = useMemo(() => {
    if (useDemo) return demo.verificationPercent;
    const minPicks = 50;
    return Math.min(100, Math.round((perf.settled / minPicks) * 100));
  }, [demo.verificationPercent, perf.settled, useDemo]);

  const recentSubscribers = useMemo(() => {
    if (useDemo) return [...demo.recentSubscribers];
    return (recentSubRows ?? []).slice(0, 5).map((s) => {
      const name = s.user?.fullName || s.user?.username || s.user?.email || 'Subscriber';
      const tierLabel =
        s.status === 'active'
          ? s.amountCents >= 5000
            ? 'VIP'
            : 'Monthly'
          : s.status;
      const tierTone =
        s.status !== 'active'
          ? ('default' as const)
          : s.amountCents >= 5000
            ? ('vip' as const)
            : ('monthly' as const);
      return {
        id: s._id,
        name,
        whenLabel: formatDistanceToNowStrict(new Date(s.createdAt), { addSuffix: true }),
        tierLabel,
        tierTone,
        avatarUrl: s.user?.image ?? null,
      };
    });
  }, [demo.recentSubscribers, recentSubRows, useDemo]);

  const messageRows = useMemo(() => {
    if (useDemo) return [...demo.messages];
    return (inboxThreads ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      preview: t.preview,
      whenLabel: formatDistanceToNowStrict(new Date(t.createdAt), { addSuffix: true }),
      unread: t.unread,
      avatarUrl: t.avatarUrl,
    }));
  }, [demo.messages, inboxThreads, useDemo]);

  const topPicks = useMemo(() => {
    if (useDemo) return [...demo.topPicks];
    const settled = picks.filter((p) => p.result === 'win' || p.result === 'loss');
    const groups = new Map<
      string,
      { label: string; sport: string; wins: number; decided: number; units: number }
    >();
    for (const p of settled) {
      const key = `${p.sport}|${p.pickEvent}`.toLowerCase();
      const g = groups.get(key) ?? {
        label: p.pickEvent || p.sport || 'Pick',
        sport: p.sport || 'Other',
        wins: 0,
        decided: 0,
        units: 0,
      };
      g.decided += 1;
      if (p.result === 'win') g.wins += 1;
      g.units += p.unitsWonLost ?? 0;
      groups.set(key, g);
    }
    return [...groups.entries()]
      .map(([id, g]) => ({
        id,
        label: g.label,
        sport: g.sport,
        winRateLabel: `${Math.round((g.wins / Math.max(g.decided, 1)) * 100)}% win · ${g.decided} settled`,
        profitLabel: `${g.units > 0 ? '+' : ''}${g.units.toFixed(1)}u`,
        units: g.units,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 4)
      .map(({ id, label, sport, winRateLabel, profitLabel }) => ({
        id,
        label,
        sport,
        winRateLabel,
        profitLabel,
      }));
  }, [demo.topPicks, picks, useDemo]);

  const showMomentum =
    !momentumDismissed && displayRevenueTrend?.positive === true;

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-24" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (creator === null) {
    return (
      <DashboardLayout type="creator">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-base font-bold text-foreground">Finish creator setup</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your creator profile to unlock the dashboard.
          </p>
          <Link to="/creator/onboarding" className="mt-4 inline-block text-sm font-bold text-primary">
            Continue onboarding
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const todayLabel = format(new Date(), 'EEEE, MMM d, yyyy');

  return (
    <DashboardLayout type="creator">
      <Seo
        title="Creator overview — Prizelet"
        description="Your Prizelet creator overview: picks, earnings, subscribers, and performance."
      />

      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {todayLabel}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
              Here’s your overview. Keep the momentum going.
            </p>
          </div>
          <Button asChild className="h-11 w-full shrink-0 gap-1.5 rounded-xl px-5 font-semibold sm:w-auto">
            <Link to="/creator/posts">
              <Plus className="h-4 w-4" aria-hidden />
              New Pick
            </Link>
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — numbers and lists below are mock content for design review, not live
            account metrics. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <OverviewKpiStrip
          items={[
            {
              label: 'Posts published',
              value: String(postCount),
              icon: FileText,
              iconClassName: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
            },
            {
              label: 'Monthly revenue (net)',
              value: `$${mrrNet.toFixed(0)}`,
              icon: DollarSign,
              iconClassName: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              trendLabel: displayRevenueTrend?.label,
              trendPositive: displayRevenueTrend?.positive,
            },
            {
              label: 'Win rate',
              value: winRateValue,
              icon: TrendingUp,
              iconClassName: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            },
            {
              label: 'Active subscribers',
              value: String(activeSubCount),
              icon: Users,
              iconClassName: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-5">
          <OverviewRecentPicks rows={recentPickRows} />
        </div>
        <div className="xl:col-span-4">
          <OverviewEarningsChart
            totalLabel={`$${mrrNet.toFixed(0)}`}
            bars={earningsBars}
          />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-3">
          <OverviewProgressRing
            percent={
              useDemo
                ? demo.verificationPercent
                : creator.verificationStatus === 'verified' && creator.isPublished
                  ? 100
                  : Math.max(verificationPct, creator.isPublished ? 60 : 25)
            }
            title={
              useDemo
                ? demo.verificationTitle
                : creator.verificationStatus === 'verified'
                  ? 'Verified creator'
                  : creator.isPublished
                    ? 'Published profile'
                    : 'Profile setup'
            }
            detail={
              useDemo
                ? demo.verificationDetail
                : creator.verificationStatus === 'verified'
                  ? 'You’re verified on Prizelet.'
                  : `${perf.settled}/50 settled picks toward verification readiness.`
            }
            href="/creator/settings"
            ctaLabel="View plan"
          />
          <OverviewQuickActions
            actions={[
              { label: 'Create New Pick', href: '/creator/posts', icon: PenLine },
              { label: 'Share Promo Code', href: '/creator/promo', icon: Megaphone },
              { label: 'Message Subscribers', href: '/creator/messages', icon: MessageSquare },
              { label: 'View Analytics', href: '/creator/performance-tracker', icon: BarChart3 },
            ]}
          />
        </div>
      </div>

      {showMomentum ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground sm:items-center sm:px-5">
          <Rocket className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            You’re on a roll! Net earnings are up{' '}
            {displayRevenueTrend?.label.replace(/^[↑↓]\s*/, '')} vs the prior month.
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/15"
            onClick={() => {
              safeSetItem(MOMENTUM_DISMISS_KEY, '1');
              setMomentumDismissed(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        <OverviewRecentSubscribers rows={recentSubscribers} />
        <OverviewMessagesPanel rows={messageRows} />
        <OverviewTopPicks rows={topPicks} />
      </div>
    </DashboardLayout>
  );
};

export default CreatorDashboard;
