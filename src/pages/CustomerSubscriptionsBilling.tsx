import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, CreditCard, FileText, ExternalLink, Loader2, MessageSquare, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';
import { useAppUser } from '@/hooks/useAppUser';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { cancelSubscription, openCustomerPortal } from '@/lib/stripe';

interface SubscriptionRow {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  creator: {
    id: string;
    username: string | null;
    display_name: string | null;
    messaging_enabled: boolean | null;
  } | null;
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function nextRenewal(startedAt: string): Date {
  const start = new Date(startedAt);
  let next = start;
  const now = new Date();
  let guard = 0;
  while (next <= now && guard < 240) {
    next = addMonths(next, 1);
    guard += 1;
  }
  return next;
}

function billingHistory(subs: SubscriptionRow[]) {
  const now = new Date();
  const rows: { key: string; date: Date; description: string; amount: number }[] = [];

  for (const sub of subs) {
    const name = sub.creator?.display_name || sub.creator?.username || 'Creator';
    let charge = new Date(sub.created_at);
    let i = 0;
    while (charge <= now && i < 36) {
      rows.push({
        key: `${sub.id}-${i}`,
        date: charge,
        description: `${name} — Monthly subscription`,
        amount: Number(sub.amount) || 0,
      });
      charge = addMonths(new Date(sub.created_at), i + 1);
      i += 1;
    }
  }

  return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
}

const CustomerSubscriptionsBilling = () => {
  const navigate = useNavigate();
  const { appUserId, loading: userLoading } = useAppUser();
  const subsRaw = useQuery(api.subscriptions.mutations.mySubscriptionsDetailed, appUserId ? {} : 'skip');
  const sendMessageMutation = useMutation(api.messaging.mutations.send);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<{ id: string; name: string } | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loading = userLoading || (appUserId ? subsRaw === undefined : false);

  const subs: SubscriptionRow[] = useMemo(
    () =>
      (subsRaw ?? []).map((s) => ({
        id: s._id,
        status: s.status,
        amount: s.amountCents / 100,
        created_at: new Date(s.createdAt).toISOString(),
        creator: {
          id: s.creator._id,
          username: s.creator.username,
          display_name: s.creator.displayName ?? null,
          messaging_enabled: s.creator.messagingEnabled,
        },
      })),
    [subsRaw],
  );

  const sendMessage = async () => {
    if (!appUserId || !messageTarget || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      await sendMessageMutation({
        creatorId: messageTarget.id as Id<'creators'>,
        subscriberId: appUserId as Id<'users'>,
        body: messageBody.trim(),
        senderRole: 'subscriber',
      });
      toast.success(`Message sent to ${messageTarget.name}`);
      setMessageBody('');
      setMessageTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const active = subs.filter((s) => s.status === 'active');
  const history = billingHistory(active);
  const monthlyTotal = active.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const busy = loading;

  const manageBilling = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async (creatorId: string) => {
    setCancellingId(creatorId);
    try {
      await cancelSubscription(creatorId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout type="member">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions &amp; Billing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your subscriptions and payment history</p>
        </div>
        {active.length > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Monthly total</p>
            <p className="text-lg font-bold">{currency(monthlyTotal)}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="subscriptions" className="text-xs">Subscriptions</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs">Billing History</TabsTrigger>
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
              <h3 className="text-sm font-medium mb-1">No active subscriptions</h3>
              <p className="text-xs text-muted-foreground mb-4">Discover creators and subscribe to get premium picks and content.</p>
              <Button size="sm" onClick={() => navigate('/dashboard/discover')}>Browse Creators</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {subs.map((sub) => {
                const name = sub.creator?.display_name || sub.creator?.username || 'Creator';
                const isActive = sub.status === 'active';
                return (
                  <div key={sub.id} className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Crown className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Monthly · Started {format(new Date(sub.created_at), 'MMM d, yyyy')}
                        {isActive && ` · Renews ${format(nextRenewal(sub.created_at), 'MMM d, yyyy')}`}
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
                        onClick={() => handleCancel(sub.creator!.id)}
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
                        onClick={() => setMessageTarget({ id: sub.creator!.id, name })}
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
              })}
              <p className="text-[11px] text-muted-foreground pt-1">
                Cancel ends Stripe billing and access for that creator. Use Open Billing Portal to update cards and view invoices.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing">
          {busy ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">No charges yet</h3>
              <p className="text-xs text-muted-foreground">Your billing history appears here once you subscribe.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {history.map((item, i) => (
                <div
                  key={item.key}
                  className={`flex items-center gap-4 px-5 py-3.5 ${i < history.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground">{format(item.date, 'MMM d, yyyy')}</p>
                  </div>
                  <p className="text-sm font-semibold">{currency(item.amount)}</p>
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    PAID
                  </Badge>
                </div>
              ))}
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
      <Dialog open={!!messageTarget} onOpenChange={(open) => !open && setMessageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {messageTarget?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Write your message…"
            rows={5}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            className="resize-none"
          />
          <DialogFooter>
            <Button onClick={sendMessage} disabled={sendingMessage || !messageBody.trim()}>
              {sendingMessage ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CustomerSubscriptionsBilling;
