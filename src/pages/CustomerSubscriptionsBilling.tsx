import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, FileText, ExternalLink, Loader2, MessageSquare, Compass } from 'lucide-react';
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
import { format } from 'date-fns';
import { useAppUser } from '@/hooks/useAppUser';
import { api } from '@convex/_generated/api';
import { cancelSubscription, openCustomerPortal } from '@/lib/stripe';
import { describeSubscriptionAccess } from '@/lib/billingAccess';
import { subscriptionGrantsContentAccess } from '../../convex/lib/contentAccess';

interface SubscriptionRow {
  id: string;
  status: string;
  billingStatus: string | null;
  cancelAtPeriodEnd: boolean;
  amount: number;
  created_at: string;
  currentPeriodEnd: number | null;
  creator: {
    id: string;
    username: string | null;
    display_name: string | null;
    messaging_enabled: boolean | null;
  } | null;
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function eventLabel(type: string): string {
  if (type === 'subscription_charge' || type === 'renewal') return 'Subscription charge';
  if (type === 'refund') return 'Refund';
  if (type === 'adjustment') return 'Adjustment';
  return type.replace(/_/g, ' ');
}

type ExpectRow = { icon: typeof Crown; label: string; detail: string };

function BillingEmpty({
  icon: Icon,
  headline,
  support,
  expects,
  primary,
  secondary,
}: {
  icon: typeof Crown;
  headline: string;
  support: string;
  expects: ExpectRow[];
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 sm:px-10 sm:py-14 text-center">
      <div className="inbox-empty-enter mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <h2 className="inbox-empty-enter text-title-lg font-semibold text-foreground tracking-tight">
        {headline}
      </h2>
      <p className="inbox-empty-enter-delay text-support text-muted-foreground mt-2 mx-auto max-w-md leading-relaxed">
        {support}
      </p>
      <ul className="inbox-empty-enter-delay mx-auto mt-8 max-w-md text-left space-y-3">
        {expects.map((row) => (
          <li
            key={row.label}
            className="flex items-start gap-3 rounded-xl border border-border px-4 py-3"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <row.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-ui font-medium text-foreground">{row.label}</p>
              <p className="text-support text-muted-foreground">{row.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="inbox-empty-enter-delay mt-8 flex flex-wrap items-center justify-center gap-3">
        {primary}
        {secondary}
      </div>
    </div>
  );
}

const CustomerSubscriptionsBilling = () => {
  const navigate = useNavigate();
  const { appUserId, loading: userLoading } = useAppUser();
  const subsRaw = useQuery(api.subscriptions.mutations.mySubscriptionsDetailed, appUserId ? {} : 'skip');
  const eventsRaw = useQuery(api.subscriptions.mutations.myPaymentEvents, appUserId ? {} : 'skip');
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  const loading =
    userLoading || (appUserId ? subsRaw === undefined || eventsRaw === undefined : false);

  const subs: SubscriptionRow[] = useMemo(
    () =>
      (subsRaw ?? []).map((s) => ({
        id: s._id,
        status: s.status,
        billingStatus: s.billingStatus ?? null,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd === true,
        amount: s.amountCents / 100,
        created_at: new Date(s.createdAt).toISOString(),
        currentPeriodEnd: s.currentPeriodEnd ?? null,
        creator: {
          id: s.creator._id,
          username: s.creator.username,
          display_name: s.creator.displayName ?? null,
          messaging_enabled: s.creator.messagingEnabled,
        },
      })),
    [subsRaw],
  );

  const now = Date.now();
  const active = subs.filter((s) =>
    subscriptionGrantsContentAccess(
      {
        status: s.status,
        billingStatus: s.billingStatus,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      },
      now,
    ),
  );
  const filtered = subs.filter((s) => {
    const access = subscriptionGrantsContentAccess(
      {
        status: s.status,
        billingStatus: s.billingStatus,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      },
      now,
    );
    if (statusFilter === 'active') return access;
    if (statusFilter === 'cancelled') return !access;
    return true;
  });
  const listPriceTotal = active.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const pastDueCount = subs.filter((s) => {
    const b = (s.billingStatus ?? '').toLowerCase();
    const st = s.status.toLowerCase();
    return st === 'past_due' || b === 'past_due' || b === 'unpaid' || st === 'unpaid';
  }).length;
  const filtersActive = statusFilter !== 'all';

  const manageBilling = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget || cancellingId) return;
    setCancellingId(cancelTarget.id);
    try {
      await cancelSubscription(cancelTarget.id);
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="member">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold text-foreground">Subscriptions &amp; Billing</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Manage subscriptions, charges, and payment methods. Access and billing status are shown
            separately when they differ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {active.length > 0 && (
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-support text-muted-foreground">Active access list-price total</p>
              <p className="text-ui font-bold text-foreground mt-1">{currency(listPriceTotal)}</p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => void manageBilling()}
            disabled={portalLoading}
          >
            {portalLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Billing portal
          </Button>
        </div>
      </header>

      {pastDueCount > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4">
          <p className="text-ui font-medium text-destructive">
            {pastDueCount} subscription{pastDueCount === 1 ? '' : 's'} past due
          </p>
          <p className="text-support text-muted-foreground mt-1">
            Premium access is paused until payment succeeds. Use Open Billing Portal to update your
            card.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11"
            onClick={() => void manageBilling()}
            disabled={portalLoading}
          >
            {portalLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Open Billing Portal
          </Button>
        </div>
      )}

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">
            Subscriptions ({subs.length})
          </TabsTrigger>
          <TabsTrigger value="billing">
            Charges ({(eventsRaw ?? []).length})
          </TabsTrigger>
          <TabsTrigger value="payment">
            Payment Method
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          {subs.length === 0 ? (
            <BillingEmpty
              icon={Crown}
              headline="No subscriptions yet"
              support="Subscribe to creators for premium picks and messaging access. Your active access and billing status stay honest here — even when they differ."
              expects={[
                {
                  icon: Compass,
                  label: 'Find creators',
                  detail: 'Browse Discover and open a profile you trust',
                },
                {
                  icon: Crown,
                  label: 'Subscribe for access',
                  detail: 'Premium content unlocks after checkout succeeds',
                },
                {
                  icon: CreditCard,
                  label: 'Manage anytime',
                  detail: 'Cancel, fix past-due, or update cards from this page',
                },
              ]}
              primary={
                <Button className="min-h-11 px-6" asChild>
                  <Link to="/dashboard/discover">Browse creators</Link>
                </Button>
              }
              secondary={
                <Button variant="outline" className="min-h-11 px-6" asChild>
                  <Link to="/dashboard">Go to Feed</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'active', label: 'Active' },
                    { key: 'cancelled', label: 'Cancelled' },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.key}
                    type="button"
                    variant={statusFilter === opt.key ? 'default' : 'outline'}
                    className="min-h-11"
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {filtered.length === 0 && filtersActive ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                  <h3 className="text-ui font-semibold text-foreground mb-2">
                    No subscriptions in this filter
                  </h3>
                  <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
                    Active means content access right now. Cancelled / no-access includes ended and
                    past-due paused access — not only voluntary cancels.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setStatusFilter('all')}
                  >
                    Show all
                  </Button>
                </div>
              ) : (
                filtered.map((sub) => {
                  const name = sub.creator?.display_name || sub.creator?.username || 'Creator';
                  const access = describeSubscriptionAccess(
                    {
                      status: sub.status,
                      billingStatus: sub.billingStatus,
                      currentPeriodEnd: sub.currentPeriodEnd,
                      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                    },
                    now,
                  );
                  const toneClass =
                    access.tone === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : access.tone === 'warn'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : access.tone === 'danger'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-muted text-muted-foreground';
                  return (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Crown className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ui font-medium text-foreground truncate">{name}</p>
                        <p className="text-support text-muted-foreground">
                          Started {format(new Date(sub.created_at), 'MMM d, yyyy')}
                          {' · '}
                          {access.detail}
                        </p>
                      </div>
                      <p className="text-ui font-semibold text-foreground">
                        {currency(Number(sub.amount) || 0)}
                      </p>
                      <Badge variant="outline" className={`text-support ${toneClass}`}>
                        {access.badge.toUpperCase()}
                      </Badge>
                      {access.hasAccess && sub.creator && (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={cancellingId === sub.creator.id}
                          onClick={() => setCancelTarget({ id: sub.creator!.id, name })}
                        >
                          {cancellingId === sub.creator.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Cancel
                        </Button>
                      )}
                      {access.hasAccess && sub.creator && (sub.creator.messaging_enabled ?? true) && (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 gap-1.5"
                          onClick={() =>
                            navigate(`/dashboard/messages?creatorId=${sub.creator!.id}`)
                          }
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Message
                        </Button>
                      )}
                      {!access.hasAccess && (access.tone === 'danger' || access.tone === 'warn') && (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 gap-1.5"
                          onClick={() => void manageBilling()}
                          disabled={portalLoading}
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Fix billing
                        </Button>
                      )}
                      {sub.creator?.username && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 min-h-11 min-w-11"
                          aria-label={`Open ${name} profile`}
                          onClick={() => navigate(`/${sub.creator!.username}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
              <p className="text-support text-muted-foreground pt-1">
                Cancel ends Stripe billing and premium access for that creator immediately after
                confirmation. Past-due subscriptions keep the record visible but block access until
                payment succeeds. Use Open Billing Portal for cards and invoices.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing">
          {(eventsRaw ?? []).length === 0 ? (
            <BillingEmpty
              icon={FileText}
              headline="No settled charges yet"
              support="After you subscribe, settled Prizelet payment events appear here. Stripe invoices and receipts stay in the billing portal."
              expects={[
                {
                  icon: CreditCard,
                  label: 'Checkout & renewals',
                  detail: 'Successful charges and renewals land as events',
                },
                {
                  icon: FileText,
                  label: 'Refunds & adjustments',
                  detail: 'Shown when recorded against your account',
                },
                {
                  icon: ExternalLink,
                  label: 'Full invoices',
                  detail: 'Open the portal for PDFs and payment methods',
                },
              ]}
              primary={
                <Button
                  type="button"
                  className="min-h-11 px-6"
                  onClick={() => void manageBilling()}
                  disabled={portalLoading}
                >
                  {portalLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Open billing portal
                </Button>
              }
              secondary={
                subs.length === 0 ? (
                  <Button variant="outline" className="min-h-11 px-6" asChild>
                    <Link to="/dashboard/discover">Browse creators</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              <p className="text-support text-muted-foreground">
                Settled payment events from Prizelet. For Stripe invoices and receipts, open the
                billing portal.
              </p>
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                {(eventsRaw ?? []).map((item, i, arr) => (
                  <div
                    key={item._id}
                    className={`flex items-center gap-4 min-h-11 px-5 py-3 ${
                      i < arr.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-ui font-medium text-foreground truncate">
                        {item.creatorName} — {eventLabel(item.type)}
                      </p>
                      <p className="text-support text-muted-foreground">
                        {format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="text-ui font-semibold text-foreground">
                      {currency(item.amountCents / 100)}
                    </p>
                    <Badge variant="outline" className="text-support text-muted-foreground">
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => void manageBilling()}
                disabled={portalLoading}
              >
                {portalLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Open Billing Portal
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment">
          <div className="rounded-xl border border-border bg-card px-6 py-10 sm:px-10 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 max-w-xl mx-auto sm:mx-0">
              <div className="mx-auto sm:mx-0 flex h-14 w-14 items-center justify-center rounded-xl bg-muted shrink-0">
                <CreditCard className="h-7 w-7 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-title-lg font-semibold text-foreground tracking-tight">
                  Cards stay with Stripe
                </h2>
                <p className="text-support text-muted-foreground mt-2 leading-relaxed">
                  Prizelet never stores full card numbers. Update payment methods, download
                  invoices, or manage tax details in the secure billing portal.
                </p>
                <ul className="mt-6 space-y-3 text-left">
                  {[
                    {
                      icon: CreditCard,
                      label: 'Add or replace a card',
                      detail: 'Default method used for renewals',
                    },
                    {
                      icon: FileText,
                      label: 'Invoices & receipts',
                      detail: 'Download history from Stripe',
                    },
                    {
                      icon: ExternalLink,
                      label: 'Return here anytime',
                      detail: 'Portal opens in a secure Stripe session',
                    },
                  ].map((row) => (
                    <li
                      key={row.label}
                      className="flex items-start gap-3 rounded-xl border border-border px-4 py-3"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <row.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ui font-medium text-foreground">{row.label}</p>
                        <p className="text-support text-muted-foreground">{row.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  className="min-h-11 mt-8 w-full sm:w-auto"
                  onClick={() => void manageBilling()}
                  disabled={portalLoading}
                >
                  {portalLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Open billing portal
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
