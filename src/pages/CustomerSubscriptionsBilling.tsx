import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

interface SubscriptionRow {
  id: string;
  status: string;
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

  const active = subs.filter((s) => s.status === 'active');
  const filtered = subs.filter((s) => {
    if (statusFilter === 'active') return s.status === 'active';
    if (statusFilter === 'cancelled') return s.status !== 'active';
    return true;
  });
  const listPriceTotal = active.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const busy = loading;

  const manageBilling = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget.id);
    try {
      await cancelSubscription(cancelTarget.id);
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  return (
    <DashboardLayout type="member">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions &amp; Billing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage subscriptions, charges, and payment methods</p>
        </div>
        {active.length > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Active list-price total</p>
            <p className="text-lg font-bold">{currency(listPriceTotal)}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="subscriptions" className="text-xs">Subscriptions</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs">Charges</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs">Payment Method</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          {busy ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[74px] w-full rounded-xl" />)}
            </div>
          ) : subs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <Crown className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">No subscriptions yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Discover creators and subscribe to get premium picks and content.</p>
              <Button size="sm" onClick={() => navigate('/dashboard/discover')}>Browse Creators</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'cancelled', label: 'Cancelled' },
                ] as const).map((opt) => (
                  <Button
                    key={opt.key}
                    variant={statusFilter === opt.key ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No subscriptions in this filter.</p>
              ) : (
                filtered.map((sub) => {
                  const name = sub.creator?.display_name || sub.creator?.username || 'Creator';
                  const isActive = sub.status === 'active';
                  const periodEnd =
                    sub.currentPeriodEnd != null
                      ? format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')
                      : null;
                  return (
                    <div key={sub.id} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Crown className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Started {format(new Date(sub.created_at), 'MMM d, yyyy')}
                          {isActive && periodEnd ? ` · Current period ends ${periodEnd}` : ''}
                          {isActive && !periodEnd ? ' · Next invoice date in Billing Portal' : ''}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{currency(Number(sub.amount) || 0)}</p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'}`}
                      >
                        {sub.status.toUpperCase()}
                      </Badge>
                      {isActive && sub.creator && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={cancellingId === sub.creator.id}
                          onClick={() => setCancelTarget({ id: sub.creator!.id, name })}
                        >
                          {cancellingId === sub.creator.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Cancel
                        </Button>
                      )}
                      {isActive && sub.creator && (sub.creator.messaging_enabled ?? true) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => navigate(`/dashboard/messages?creatorId=${sub.creator!.id}`)}
                        >
                          <MessageSquare className="mr-1 h-3 w-3" /> Message
                        </Button>
                      )}
                      {sub.creator?.username && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Open ${name} profile`}
                          onClick={() => navigate(`/${sub.creator!.username}`)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
              <p className="text-[11px] text-muted-foreground pt-1">
                Cancel ends Stripe billing and premium access for that creator immediately. Use Open Billing Portal for cards and invoices.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing">
          {busy ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (eventsRaw ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">No settled charges yet</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Charges recorded after checkout appear here. Full invoices are in the billing portal.
              </p>
              <Button variant="outline" size="sm" onClick={manageBilling} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Open Billing Portal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Settled payment events from Wizzlet. For Stripe invoices and receipts, open the billing portal.
              </p>
              <div className="rounded-xl border border-border overflow-hidden">
                {(eventsRaw ?? []).map((item, i, arr) => (
                  <div
                    key={item._id}
                    className={`flex items-center gap-4 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.creatorName} — {eventLabel(item.type)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <p className="text-sm font-semibold">{currency(item.amountCents / 100)}</p>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={manageBilling} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Open Billing Portal
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Payment methods are stored with our payment provider</p>
                <p className="text-[11px] text-muted-foreground">
                  Card details never touch Wizzlet — update them in the secure billing portal.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={manageBilling} disabled={portalLoading}>
              {portalLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Open Billing Portal
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling {cancelTarget?.name ?? 'this creator'} ends billing and premium access immediately. This cannot be undone from here — you can subscribe again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmCancel()}
            >
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CustomerSubscriptionsBilling;
