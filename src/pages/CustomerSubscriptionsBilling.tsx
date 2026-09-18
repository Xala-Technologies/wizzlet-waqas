import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  ChevronDown,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MemberMyCreatorRow,
  MemberMyCreatorRowSkeleton,
} from '@/components/my-creators/MemberMyCreatorRow';
import { Seo } from '@/components/Seo';
import { useAppUser } from '@/hooks/useAppUser';
import { api } from '@convex/_generated/api';
import { cancelSubscription, openCustomerPortal } from '@/lib/stripe';
import { describeSubscriptionAccess } from '@/lib/billingAccess';
import {
  isMemberMyCreatorsDemoId,
  MEMBER_MY_CREATORS_DEMO_CHARGES,
  MEMBER_MY_CREATORS_DEMO_PURCHASES,
  MEMBER_MY_CREATORS_DEMO_SUBS,
  shouldUseMemberMyCreatorsDemo,
} from '@/lib/memberMyCreatorsDemo';
import { cn } from '@/lib/utils';

type TabKey = 'active' | 'purchases' | 'billing';
type SortKey = 'recent' | 'name' | 'price';

type CreatorCardModel = {
  id: string;
  creatorId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials?: string;
  avatarTone?: string;
  sports: string[];
  winRate: number | null;
  profit30dUnits: number | null;
  followersLabel: string | null;
  monthlyPriceCents: number;
  statusLabel: string;
  statusTone: 'ok' | 'warn' | 'danger' | 'muted';
  renewsLabel: string;
  lastActiveMs: number;
  verified: boolean;
  messagingEnabled: boolean;
  isDemo: boolean;
  hasAccess: boolean;
};

const currency = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

function inferSports(bio: string | null, username: string): string[] {
  const hay = `${bio ?? ''} ${username}`.toLowerCase();
  const found: string[] = [];
  for (const key of ['NBA', 'NFL', 'Soccer', 'Tennis', 'UFC', 'MLB', 'NHL']) {
    if (hay.includes(key.toLowerCase())) found.push(key);
  }
  return found.length > 0 ? found : ['Sports'];
}

function eventLabel(type: string): string {
  if (type === 'subscription_charge' || type === 'renewal') return 'Subscription charge';
  if (type === 'refund') return 'Refund';
  if (type === 'adjustment') return 'Adjustment';
  return type.replace(/_/g, ' ');
}

const CustomerSubscriptionsBilling = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const { appUserId, loading: userLoading } = useAppUser();

  const subsRaw = useQuery(
    api.subscriptions.mutations.mySubscriptionsDetailed,
    appUserId ? {} : 'skip',
  );
  const eventsRaw = useQuery(
    api.subscriptions.mutations.myPaymentEvents,
    appUserId ? {} : 'skip',
  );

  const [tab, setTab] = useState<TabKey>('active');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null);
  const [manageTarget, setManageTarget] = useState<CreatorCardModel | null>(null);

  const loading =
    userLoading || (appUserId ? subsRaw === undefined || eventsRaw === undefined : false);
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
      return {
        id: s._id,
        creatorId: s.creator._id,
        username: s.creator.username,
        displayName: name,
        bio: 'Subscribed creator on Prizelet.',
        avatarUrl: s.creator.avatarUrl ?? null,
        sports: inferSports(null, s.creator.username),
        winRate: null,
        profit30dUnits: null,
        followersLabel: null,
        monthlyPriceCents: s.amountCents || s.creator.monthlyPriceCents || 999,
        statusLabel: access.badge,
        statusTone: access.tone,
        renewsLabel: s.currentPeriodEnd
          ? `Renews ${format(new Date(s.currentPeriodEnd), 'MMM d, yyyy')}`
          : access.detail,
        lastActiveMs: s.createdAt,
        verified: true,
        messagingEnabled: s.creator.messagingEnabled ?? true,
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
        avatarUrl: null,
        avatarInitials: d.avatarInitials,
        avatarTone: d.avatarTone,
        sports: d.sports,
        winRate: d.winRate,
        profit30dUnits: d.profit30dUnits,
        followersLabel: d.followersLabel,
        monthlyPriceCents: d.monthlyPriceCents,
        statusLabel: 'Active',
        statusTone: 'ok' as const,
        renewsLabel: d.renewsLabel,
        lastActiveMs: d.lastActiveMs,
        verified: d.verified,
        messagingEnabled: true,
        isDemo: true,
        hasAccess: true,
      })),
    [],
  );

  // Prefer hasAccess from describeSubscriptionAccess for live rows.
  const activeList = useDemo ? demoCards : liveCards.filter((c) => c.hasAccess);
  const purchaseCount = useDemo ? MEMBER_MY_CREATORS_DEMO_PURCHASES.length : 0;
  const billingEvents = useDemo
    ? MEMBER_MY_CREATORS_DEMO_CHARGES.map((c) => ({
        id: c.id,
        title: `${c.creatorName} — ${c.typeLabel}`,
        date: c.dateLabel,
        amount: c.amountCents,
        status: c.status,
      }))
    : (eventsRaw ?? []).map((e) => ({
        id: e._id,
        title: `${e.creatorName} — ${eventLabel(e.type)}`,
        date: format(new Date(e.createdAt), 'MMM d, yyyy'),
        amount: e.amountCents,
        status: e.status,
      }));
  const billingCount = billingEvents.length;

  const filteredActive = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = [...activeList];
    if (q) {
      rows = rows.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.sports.some((s) => s.toLowerCase().includes(q)),
      );
    }
    rows.sort((a, b) => {
      if (sort === 'name') return a.displayName.localeCompare(b.displayName);
      if (sort === 'price') return a.monthlyPriceCents - b.monthlyPriceCents;
      return b.lastActiveMs - a.lastActiveMs;
    });
    return rows;
  }, [activeList, query, sort]);

  const sortLabel =
    sort === 'name' ? 'Name' : sort === 'price' ? 'Lowest price' : 'Recently Active';

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

  const confirmCancel = async () => {
    if (!cancelTarget || cancellingId) return;
    if (isMemberMyCreatorsDemoId(cancelTarget.id)) {
      toast.message('Sample preview — cancel is available on live subscriptions.');
      setCancelTarget(null);
      return;
    }
    setCancellingId(cancelTarget.id);
    try {
      await cancelSubscription(cancelTarget.id);
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'active', label: 'Active', count: activeList.length },
    { key: 'purchases', label: 'Purchases', count: purchaseCount },
    { key: 'billing', label: 'Billing History', count: billingCount > 0 ? billingCount : undefined },
  ];

  return (
    <DashboardLayout type="member">
      <Seo
        title="My Creators — Prizelet"
        description="Manage your subscriptions, view creator performance and access your purchases."
      />

      <header className="mb-6">
        <h1 className="text-heading font-bold tracking-tight text-slate-900 md:text-heading-lg">
          My Creators
        </h1>
        <p className="mt-1.5 text-support text-slate-500">
          Manage your subscriptions, view creator performance and access your purchases.
        </p>
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

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {t.label}
                {typeof t.count === 'number' ? ` (${t.count})` : ''}
              </button>
            );
          })}
        </div>

        {tab === 'active' ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your creators..."
                className="h-9 rounded-full border-slate-200 bg-white pl-9 text-sm"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 rounded-full border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700"
                >
                  Sort by: {sortLabel}
                  <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSort('recent')}>
                  Recently Active
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSort('name')}>Name</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSort('price')}>Lowest price</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {tab === 'active' ? (
        loading && !useDemo ? (
          <ul className="space-y-4" aria-busy="true" aria-label="Loading creators">
            {Array.from({ length: 3 }).map((_, i) => (
              <MemberMyCreatorRowSkeleton key={i} />
            ))}
          </ul>
        ) : filteredActive.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              {query.trim() ? `No creators match “${query.trim()}”.` : 'No active subscriptions'}
            </p>
            <p className="mt-2 text-base text-slate-500">
              {query.trim()
                ? 'Try a different search.'
                : 'Subscribe to creators on Discover to see them here.'}
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link to="/dashboard/discover">Discover Creators</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredActive.map((c) => (
              <MemberMyCreatorRow
                key={c.id}
                username={c.username}
                displayName={c.displayName}
                bio={c.bio}
                avatarUrl={c.avatarUrl}
                avatarInitials={c.avatarInitials}
                avatarTone={c.avatarTone}
                sports={c.sports}
                winRate={c.winRate}
                profit30dUnits={c.profit30dUnits}
                followersLabel={c.followersLabel}
                monthlyPriceCents={c.monthlyPriceCents}
                statusLabel={c.statusLabel}
                statusTone={c.statusTone}
                renewsLabel={c.renewsLabel}
                verified={c.verified}
                cancelDisabled={cancellingId === c.creatorId}
                onManage={() => setManageTarget(c)}
                onMessage={
                  c.messagingEnabled
                    ? () => {
                        if (c.isDemo) {
                          toast.message('Sample preview — messaging needs a live subscription.');
                          return;
                        }
                        navigate(`/dashboard/messages?creatorId=${c.creatorId}`);
                      }
                    : undefined
                }
                onOpenBilling={() => void manageBilling()}
                onCancel={
                  c.hasAccess
                    ? () => setCancelTarget({ id: c.creatorId, name: c.displayName })
                    : undefined
                }
              />
            ))}
          </ul>
        )
      ) : null}

      {tab === 'purchases' ? (
        useDemo ? (
          <ul className="space-y-3">
            {MEMBER_MY_CREATORS_DEMO_PURCHASES.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Package className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {p.creatorName} · {p.purchasedLabel}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 sm:text-right">
                  {currency(p.amountCents)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Package className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No one-time purchases yet</p>
            <p className="mt-2 text-base text-slate-500">
              Packs and one-off products you buy will show up here.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-xl">
              <Link to="/dashboard/discover">Browse creators</Link>
            </Button>
          </div>
        )
      ) : null}

      {tab === 'billing' ? (
        billingEvents.length > 0 ? (
          <div className="space-y-4">
            <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {billingEvents.map((row, i, arr) => (
                <li
                  key={row.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3.5',
                    i < arr.length - 1 && 'border-b border-slate-100',
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{row.title}</p>
                    <p className="text-xs font-medium text-slate-400">{row.date}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{currency(row.amount)}</p>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-500">
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => void manageBilling()}
              disabled={portalLoading}
            >
              {portalLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Open Billing Portal
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No billing history yet</p>
            <p className="mt-2 text-base text-slate-500">
              Settled charges appear here after you subscribe. Cards and invoices stay in Stripe.
            </p>
            <Button
              type="button"
              className="mt-6 rounded-xl"
              onClick={() => void manageBilling()}
              disabled={portalLoading}
            >
              Open Billing Portal
            </Button>
          </div>
        )
      ) : null}

      <AlertDialog
        open={!!manageTarget}
        onOpenChange={(open) => {
          if (!open) setManageTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manage {manageTarget?.displayName ?? 'subscription'}</AlertDialogTitle>
            <AlertDialogDescription>
              Update payment methods in Stripe, message the creator, or cancel this subscription.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button
              type="button"
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => {
                setManageTarget(null);
                void manageBilling();
              }}
            >
              Open billing portal
            </Button>
            {manageTarget?.messagingEnabled ? (
              <Button
                type="button"
                variant="outline"
                className="justify-start rounded-xl"
                onClick={() => {
                  const c = manageTarget;
                  setManageTarget(null);
                  if (c.isDemo) {
                    toast.message('Sample preview — messaging needs a live subscription.');
                    return;
                  }
                  navigate(`/dashboard/messages?creatorId=${c.creatorId}`);
                }}
              >
                Message creator
              </Button>
            ) : null}
            {manageTarget?.hasAccess ? (
              <Button
                type="button"
                variant="outline"
                className="justify-start rounded-xl text-destructive hover:text-destructive"
                onClick={() => {
                  const c = manageTarget;
                  setManageTarget(null);
                  setCancelTarget({ id: c.creatorId, name: c.displayName });
                }}
              >
                Cancel subscription
              </Button>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open && !cancellingId) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling {cancelTarget?.name ?? 'this creator'} ends billing and premium access
              immediately. This cannot be undone from here — you can subscribe again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!cancellingId}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!cancellingId}
              onClick={(e) => {
                e.preventDefault();
                void confirmCancel();
              }}
            >
              {cancellingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CustomerSubscriptionsBilling;
