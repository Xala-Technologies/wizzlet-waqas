import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, FileText, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
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
        {active.length > 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 shrink-0">
            <p className="text-support text-muted-foreground">Active access list-price total</p>
            <p className="text-ui font-bold text-foreground mt-1">{currency(listPriceTotal)}</p>
          </div>
        )}
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
        <TabsList className="bg-muted/50 h-10">
          <TabsTrigger value="subscriptions" className="text-support h-8">
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-support h-8">
            Charges
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-support h-8">
            Payment Method
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          {subs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-ui font-semibold text-foreground mb-2">No subscriptions yet</h3>
              <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
                Discover creators and subscribe to get premium picks and content.
              </p>
              <Button className="min-h-11" asChild>
                <Link to="/dashboard/discover">Browse Creators</Link>
              </Button>
            </div>
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
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-ui font-semibold text-foreground mb-2">No settled charges yet</h3>
              <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
                Charges recorded after checkout appear here. Full invoices are in the billing
                portal.
              </p>
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
                    <Badge
                      variant="outline"
                      className="text-support bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    >
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
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-ui font-medium text-foreground">
                  Payment methods are stored with our payment provider
                </p>
                <p className="text-support text-muted-foreground mt-1">
                  Card details never touch Prizelet — update them in the secure billing portal.
                </p>
              </div>
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
