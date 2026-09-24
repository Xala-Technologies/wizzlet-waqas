import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Megaphone,
  MessageSquare,
  Package,
  PenLine,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { computeWinRate } from '../../convex/lib/results';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';
import { OverviewKpiStrip } from '@/components/creator/overview/OverviewKpiStrip';
import { OverviewEarningsChart } from '@/components/creator/overview/OverviewEarningsChart';
import { OverviewQuickActions } from '@/components/creator/overview/OverviewQuickActions';
import { OverviewRecentSubscribers } from '@/components/creator/overview/OverviewRecentSubscribers';
import { OverviewRecentActivity } from '@/components/creator/overview/OverviewRecentActivity';
import { OverviewTopProducts } from '@/components/creator/overview/OverviewTopProducts';
import { OverviewReferralBanner } from '@/components/creator/overview/OverviewReferralBanner';
import { kpiIconTone } from '@/lib/kpiIconTones';
import {
  CREATOR_OVERVIEW_DEMO,
  shouldUseCreatorOverviewDemo,
} from '@/lib/creatorOverviewDemo';
import { earningsMonthLabel } from '@/lib/sportVisual';

function uiPickResult(result: string): 'win' | 'loss' | 'push' | 'pending' {
  if (result === 'won' || result === 'win') return 'win';
  if (result === 'lost' || result === 'loss') return 'loss';
  if (result === 'push') return 'push';
  return 'pending';
}

function timeOfDayGreeting(name: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}! 👋`;
}

function formatCompact(n: number): string {
  return n.toLocaleString();
}

const CreatorDashboard = () => {
  const [searchParams] = useSearchParams();
  const creator = useQuery(api.creators.queries.myCreator);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const postsRaw = useQuery(api.posts.queries.listMine);
  const picksRaw = useQuery(api.picks.mutations.listMine);
  const earnings = useQuery(api.creators.earnings.myEarnings);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator?._id ? { creatorId: creator._id, activeOnly: true } : 'skip',
  );
  const { results: recentSubRows, status: subsPageStatus } = usePaginatedQuery(
    api.subscriptions.mutations.listSubscribersDetailedPage,
    {},
    { initialNumItems: 5 },
  );

  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const loading =
    creator === undefined ||
    subs === undefined ||
    postsRaw === undefined ||
    picksRaw === undefined ||
    earnings === undefined ||
    analytics === undefined ||
    subsPageStatus === 'LoadingFirstPage';

  const picks = useMemo(
    () =>
      (picksRaw ?? []).map((p) => ({
        id: p._id,
        result: uiPickResult(p.result),
      })),
    [picksRaw],
  );

  const perf = useMemo(() => {
    const { decided } = computeWinRate(picks.map((p) => p.result));
    return { settled: decided };
  }, [picks]);

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
      label: `${rounded > 0 ? '↑' : '↓'} ${Math.abs(rounded)}% vs. last month`,
      positive: rounded > 0,
    };
  }, [earnings?.monthly]);

  const activeSubs = (subs ?? []).filter((s) => s.status === 'active');
  const realPostCount = postsRaw?.length ?? 0;
  const realMrrNet = (earnings?.netCents ?? 0) / 100;
  const realPostViews = (analytics ?? []).filter((e) => e.eventType === 'post_view').length;
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
  const activeSubCount = useDemo ? demo.activeSubscribers : activeSubs.length;
  const postViews = useDemo ? demo.postViews : realPostViews;
  const displayRevenueTrend = useDemo ? demo.revenueTrend : revenueTrend;

  const earningsBars = useMemo(() => {
    if (useDemo) return [...demo.earningsBars];
    const monthly = earnings?.monthly ?? [];
    const last = monthly.slice(-6);
    return last.map((m) => ({
      label: earningsMonthLabel(m.month.length >= 7 ? m.month.slice(5) : m.month),
      valueCents: m.revenueCents,
    }));
  }, [demo.earningsBars, earnings?.monthly, useDemo]);

  const recentSubscribers = useMemo(() => {
    if (useDemo) return [...demo.recentSubscribers];
    return (recentSubRows ?? []).slice(0, 5).map((s) => {
      const name = s.user?.fullName || s.user?.username || s.user?.email || 'Subscriber';
      const tierLabel =
        s.status === 'active'
          ? s.amountCents >= 5000
            ? 'VIP'
            : s.amountCents >= 2500
              ? 'Premium'
              : 'Active'
          : s.status;
      const tierTone =
        s.status !== 'active'
          ? ('default' as const)
          : s.amountCents >= 5000
            ? ('vip' as const)
            : s.amountCents >= 2500
              ? ('monthly' as const)
              : ('free' as const);
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

  const activityRows = useMemo(() => {
    if (useDemo) return [...demo.recentActivity];
    const rows: Array<{
      id: string;
      title: string;
      whenLabel: string;
      amountLabel?: string;
      unread?: boolean;
      tone: 'subscriber' | 'payment' | 'message' | 'milestone';
    }> = [];

    for (const s of (recentSubRows ?? []).slice(0, 3)) {
      rows.push({
        id: `sub-${s._id}`,
        title: 'New subscriber joined',
        whenLabel: formatDistanceToNowStrict(new Date(s.createdAt), { addSuffix: true }),
        amountLabel: s.amountCents
          ? `$${(s.amountCents / 100).toFixed(2)}/mo`
          : undefined,
        tone: 'subscriber',
      });
    }

    const payments = (earnings?.recentPayments ?? []).slice(0, 2);
    for (const p of payments) {
      rows.push({
        id: `pay-${p.id ?? p.createdAt}`,
        title: 'Payment received',
        whenLabel: formatDistanceToNowStrict(new Date(p.createdAt), { addSuffix: true }),
        amountLabel: `$${((p.amountCents ?? 0) / 100).toFixed(2)}`,
        tone: 'payment',
      });
    }

    if (realPostViews >= 1000) {
      rows.push({
        id: 'views-milestone',
        title: 'Your post reached 1,000 views',
        whenLabel: 'Recently',
        tone: 'milestone',
      });
    }

    return rows.slice(0, 5);
  }, [
    demo.recentActivity,
    earnings?.recentPayments,
    realPostViews,
    recentSubRows,
    useDemo,
  ]);

  const topProducts = useMemo(() => {
    if (useDemo) return [...demo.topProducts];
    const list = (products ?? [])
      .filter((p) => p.isActive && !p.isClosed)
      .slice(0, 4)
      .map((p, i) => ({
        id: p._id,
        name: p.name,
        subscribersLabel: '— subscribers',
        revenueLabel: `$${(p.priceCents / 100).toFixed(0)}`,
        growthLabel: '—',
        growthPositive: true as const,
        icon: (i === 0 ? 'crown' : i === 1 ? 'gem' : 'star') as 'crown' | 'gem' | 'star',
      }));
    return list;
  }, [demo.topProducts, products, useDemo]);

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
        title="Creator overview — Sweeph"
        description="Your Sweeph creator overview: posts, earnings, subscribers, and performance."
      />

      <header className="mb-7 sm:mb-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="text-caption font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {todayLabel}
            </p>
            <h1 className="type-page-title mt-2 text-foreground md:text-[2.75rem] md:leading-[1.1]">
              {timeOfDayGreeting(displayName)}
            </h1>
            <p className="mt-3 max-w-2xl text-body font-medium text-muted-foreground">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <Button
            asChild
            className="h-12 w-full shrink-0 gap-2 rounded-[var(--radius-md)] px-6 sm:mt-1 sm:w-auto"
          >
            <Link to="/creator/posts">
              <Plus className="h-5 w-5" aria-hidden />
              Create Post
            </Link>
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — numbers and lists below are mock content for design review, not
            live account metrics. Add <span className="font-mono text-xs">?demo=0</span> to see empty
            real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <OverviewKpiStrip
          items={[
            {
              label: 'Monthly revenue',
              value: `$${formatCompact(Math.round(mrrNet))}`,
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel: displayRevenueTrend?.label,
              trendPositive: displayRevenueTrend?.positive,
              href: '/creator/earnings',
            },
            {
              label: 'Subscribers',
              value: formatCompact(activeSubCount),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel: useDemo ? demo.subscribersTrend.label : undefined,
              trendPositive: useDemo ? demo.subscribersTrend.positive : undefined,
              href: '/creator/subscribers',
            },
            {
              label: 'Posts published',
              value: formatCompact(postCount),
              icon: FileText,
              iconClassName: kpiIconTone.sky,
              trendLabel: useDemo ? demo.postsTrend.label : undefined,
              trendPositive: useDemo ? demo.postsTrend.positive : undefined,
              href: '/creator/posts',
            },
            {
              label: 'Post views',
              value: formatCompact(postViews),
              icon: Eye,
              iconClassName: kpiIconTone.amber,
              trendLabel: useDemo ? demo.viewsTrend.label : undefined,
              trendPositive: useDemo ? demo.viewsTrend.positive : undefined,
              href: '/creator/performance-tracker',
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-5">
          <OverviewEarningsChart
            totalLabel={`$${formatCompact(Math.round(mrrNet))}`}
            trendLabel={displayRevenueTrend?.label}
            trendPositive={displayRevenueTrend?.positive}
            bars={earningsBars}
          />
        </div>
        <div className="xl:col-span-3">
          <OverviewQuickActions
            actions={[
              { label: 'Create Post', href: '/creator/posts', icon: PenLine },
              { label: 'New Product', href: '/creator/products', icon: Package },
              { label: 'Share Promo Code', href: '/creator/promo', icon: Megaphone },
              { label: 'Message Subscribers', href: '/creator/messages', icon: MessageSquare },
            ]}
          />
        </div>
        <div className="xl:col-span-4">
          <OverviewRecentSubscribers rows={recentSubscribers} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
        <OverviewRecentActivity rows={activityRows} />
        <OverviewTopProducts rows={topProducts} />
      </div>

      <OverviewReferralBanner />
    </DashboardLayout>
  );
};

export default CreatorDashboard;
