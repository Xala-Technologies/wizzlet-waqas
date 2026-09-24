import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Gem, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  MemberMyCreatorRow,
  MemberMyCreatorRowSkeleton,
} from '@/components/my-creators/MemberMyCreatorRow';
import { Seo } from '@/components/Seo';
import { useAppUser } from '@/hooks/useAppUser';
import { api } from '@convex/_generated/api';
import { openCustomerPortal } from '@/lib/stripe';
import { describeSubscriptionAccess } from '@/lib/billingAccess';
import {
  MEMBER_MY_CREATORS_DEMO_SUBS,
  shouldUseMemberMyCreatorsDemo,
} from '@/lib/memberMyCreatorsDemo';
import { cn } from '@/lib/utils';

type CreatorCardModel = {
  id: string;
  creatorId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials?: string;
  avatarTone?: string;
  planLabel: string;
  tags: string[];
  verified: boolean;
  isDemo: boolean;
  hasAccess: boolean;
};

function inferTags(bio: string | null, username: string): string[] {
  const hay = `${bio ?? ''} ${username}`.toLowerCase();
  const found: string[] = [];
  for (const key of ['NBA', 'NFL', 'Soccer', 'Tennis', 'UFC', 'MLB', 'NHL', 'MMA', 'Boxing']) {
    if (hay.includes(key.toLowerCase())) found.push(key);
  }
  return found.length > 0 ? found : ['Sports'];
}

function planFromAmount(cents: number): string {
  if (cents >= 1999) return 'VIP';
  return 'Premium';
}

const CustomerSubscriptionsBilling = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const demoQs = forceDemo ? '?demo=1' : disableDemo ? '?demo=0' : '';
  const { appUserId, loading: userLoading } = useAppUser();

  const subsRaw = useQuery(
    api.subscriptions.mutations.mySubscriptionsDetailed,
    appUserId ? {} : 'skip',
  );

  const [portalLoading, setPortalLoading] = useState(false);

  const loading = userLoading || (appUserId ? subsRaw === undefined : false);
  const now = Date.now();

  const liveCards: CreatorCardModel[] = useMemo(() => {
    return (subsRaw ?? []).map((s) => {
      const access = describeSubscriptionAccess(
        {
          status: s.status,
          billingStatus: s.billingStatus,
          currentPeriodEnd: s.currentPeriodEnd,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd === true,
        },
        now,
      );
      const name = s.creator.displayName?.trim() || s.creator.username;
      const price = s.amountCents || s.creator.monthlyPriceCents || 999;
      return {
        id: s._id,
        creatorId: s.creator._id,
        username: s.creator.username,
        displayName: name,
        bio: 'Subscribed creator on Prizelet — open their profile for exclusive content.',
        avatarUrl: s.creator.avatarUrl ?? null,
        planLabel: planFromAmount(price),
        tags: inferTags(null, s.creator.username),
        verified: true,
        isDemo: false,
        hasAccess: access.hasAccess,
      };
    });
  }, [subsRaw, now]);

  const useDemo = shouldUseMemberMyCreatorsDemo({
    subscriptionCount: liveCards.length,
    forceDemo,
    disableDemo,
  });

  const demoCards: CreatorCardModel[] = useMemo(
    () =>
      MEMBER_MY_CREATORS_DEMO_SUBS.map((d) => ({
        id: d.id,
        creatorId: d.id,
        username: d.username,
        displayName: d.displayName,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
        avatarInitials: d.avatarInitials,
        avatarTone: d.avatarTone,
        planLabel: d.planLabel,
        tags: d.tags,
        verified: d.verified,
        isDemo: true,
        hasAccess: true,
      })),
    [],
  );

  const activeList = useDemo ? demoCards : liveCards.filter((c) => c.hasAccess);

  const manageBilling = async () => {
    if (portalLoading) return;
    if (useDemo) {
      toast.message('Sample preview — open billing after a real subscription.');
      return;
    }
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <DashboardLayout type="member">
      <Seo
        title="My Creators — Prizelet"
        description="Your active subscriptions and exclusive content on Prizelet."
      />

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My Creators
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
            Your active subscriptions and exclusive content.
          </p>
        </div>

        <div className="flex max-w-md items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3.5 sm:items-center">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
            <Gem className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Discover more creators</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Find new experts and unlock premium content.
            </p>
            <Link
              to="/dashboard/discover"
              className="mt-1.5 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              Browse Creators →
            </Link>
          </div>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample My Creators list for design review. Add{' '}
            <code className="rounded bg-amber-500/20 px-1">?demo=0</code> for live subscriptions
            only.
          </p>
        </div>
      ) : null}

      {loading && !useDemo ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4 shadow-[var(--shadow-card)] sm:px-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <MemberMyCreatorRowSkeleton key={i} />
          ))}
        </ul>
      ) : activeList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-[var(--shadow-card)]">
          <p className="text-lg font-semibold text-foreground">No active subscriptions</p>
          <p className="mt-2 text-base text-muted-foreground">
            Subscribe to creators on Discover to see them here.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/dashboard/discover">Browse Creators</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4 shadow-[var(--shadow-card)] sm:px-6">
          {activeList.map((c) => (
            <MemberMyCreatorRow
              key={c.id}
              username={c.username}
              displayName={c.displayName}
              bio={c.bio}
              avatarUrl={c.avatarUrl}
              avatarInitials={c.avatarInitials}
              avatarTone={c.avatarTone}
              tags={c.tags}
              planLabel={c.planLabel}
              verified={c.verified}
              manageHref={`/dashboard/subscriptions-billing/manage/${c.username}${demoQs}`}
              onOpenBilling={() => void manageBilling()}
            />
          ))}
        </ul>
      )}

      <div
        className={cn(
          'mt-6 flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-5',
          'sm:flex-row sm:items-center sm:justify-between sm:px-6',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UserPlus className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Explore more creators</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Find new experts and get access to premium content.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" className="min-h-10 shrink-0 rounded-xl font-semibold">
          <Link to="/dashboard/discover">Browse Creators →</Link>
        </Button>
      </div>

      {portalLoading ? (
        <p className="sr-only" aria-live="polite">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Opening billing portal…
        </p>
      ) : null}
    </DashboardLayout>
  );
};

export default CustomerSubscriptionsBilling;
