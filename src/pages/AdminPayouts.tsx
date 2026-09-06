import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Clock, CheckCircle2, XCircle, TrendingUp, Calendar, Loader2, Crown, Send } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutRow {
  id: string;
  creator_id: string;
  amount: number;
  status: string;
  method: string;
  reference: string | null;
  processed_at: number | null;
  created_at: number;
}

interface CreatorBalance {
  creatorId: string;
  name: string;
  earned: number;
  paid: number;
  inFlight: number;
  available: number;
}

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const fmt = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d: number | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const AdminPayouts = () => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const subsRaw = useQuery(api.subscriptions.mutations.listAllAdmin);
  const creatorsRaw = useQuery(api.creators.queries.listAllAdmin);
  const payoutsRaw = useQuery(api.payouts.mutations.listAllAdmin);
  const createPayoutMutation = useMutation(api.payouts.mutations.createAdmin);
  const setStatusMutation = useMutation(api.payouts.mutations.setStatusAdmin);

  const loading = subsRaw === undefined || creatorsRaw === undefined || payoutsRaw === undefined;

  const payouts = useMemo((): PayoutRow[] => {
    if (!payoutsRaw) return [];
    return [...payoutsRaw]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(p => ({
        id: p._id,
        creator_id: p.creatorId,
        amount: p.amountCents / 100,
        status: p.status,
        method: p.method ?? 'bank_transfer',
        reference: p.reference ?? null,
        processed_at: p.processedAt ?? null,
        created_at: p.createdAt,
      }));
  }, [payoutsRaw]);

  const balances = useMemo((): CreatorBalance[] => {
    if (!subsRaw || !creatorsRaw) return [];

    const earnedBy = new Map<string, number>();
    subsRaw
      .filter(s => s.status === 'active')
      .forEach(s => earnedBy.set(s.creatorId, (earnedBy.get(s.creatorId) ?? 0) + s.creatorEarningsCents / 100));

    const paidBy = new Map<string, number>();
    const inFlightBy = new Map<string, number>();
    payouts.forEach(p => {
      if (p.status === 'completed') paidBy.set(p.creator_id, (paidBy.get(p.creator_id) ?? 0) + p.amount);
      else if (p.status === 'pending' || p.status === 'processing')
        inFlightBy.set(p.creator_id, (inFlightBy.get(p.creator_id) ?? 0) + p.amount);
    });

    return creatorsRaw
      .map(c => {
        const earned = earnedBy.get(c._id) ?? 0;
        const paid = paidBy.get(c._id) ?? 0;
        const inFlight = inFlightBy.get(c._id) ?? 0;
        return {
          creatorId: c._id,
          name: c.displayName || `@${c.username ?? 'unknown'}`,
          earned,
          paid,
          inFlight,
          available: Math.max(0, earned - paid - inFlight),
        };
      })
      .filter(r => r.earned > 0 || r.paid > 0 || r.inFlight > 0)
      .sort((a, b) => b.available - a.available);
  }, [subsRaw, creatorsRaw, payouts]);

  const totals = useMemo(() => {
    const totalPaidOut = payouts.filter(p => p.status === 'completed').reduce((a, b) => a + b.amount, 0);
    const pending = payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((a, b) => a + b.amount, 0);
    const owed = balances.reduce((a, b) => a + b.available, 0);
    const lastPayout = payouts.find(p => p.status === 'completed');
    return {
      totalPaidOut,
      pending,
      owed,
      lastPayoutDate: lastPayout ? fmtDate(lastPayout.processed_at ?? lastPayout.created_at) : 'No payouts yet',
      processing: payouts.filter(p => p.status === 'processing' || p.status === 'pending').length,
      completed: payouts.filter(p => p.status === 'completed').length,
      failed: payouts.filter(p => p.status === 'failed').length,
    };
  }, [payouts, balances]);

  const creatorName = (id: string) => balances.find(b => b.creatorId === id)?.name ?? 'Unknown creator';

  const createPayout = async (row: CreatorBalance) => {
    if (row.available <= 0) return;
    setBusyId(row.creatorId);
    const now = new Date();
    try {
      await createPayoutMutation({
        creatorId: row.creatorId as Id<'creators'>,
        amountCents: Math.round(row.available * 100),
        status: 'pending',
        method: 'bank_transfer',
        reference: `Payout – ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      });
      toast.success(`Payout of ${fmt(row.available)} queued for ${row.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create payout');
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await setStatusMutation({
        payoutId: id as Id<'payouts'>,
        status,
      });
      toast.success(`Payout marked ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update payout');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Payouts &amp; Treasury</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Creator earnings, queued payouts, and payment history</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <Wallet className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{fmt(totals.owed)}</p>
          <p className="text-xs text-muted-foreground mt-1">Owed to Creators</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Clock className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-400">{fmt(totals.pending)}</p>
          <p className="text-xs text-muted-foreground mt-1">Queued / In Progress</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{fmt(totals.totalPaidOut)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Paid Out</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Calendar className="h-4 w-4 text-purple-400 mb-2" />
          <p className="text-lg font-bold">{totals.lastPayoutDate}</p>
          <p className="text-xs text-muted-foreground mt-1">Last Completed Payout</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden mb-8">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Creator Balances</h2>
        </div>
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No creator earnings yet</p>
        ) : (
          <>
            <MobileRecordCards>
              {balances.map((b) => (
                <li key={b.creatorId} className="mx-3 mb-3 last:mb-3 rounded-xl border border-border bg-card p-4 space-y-3 md:mx-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Lifetime</span><p className="mt-0.5">{fmt(b.earned)}</p></div>
                    <div><span className="text-muted-foreground">Paid</span><p className="mt-0.5">{fmt(b.paid)}</p></div>
                    <div><span className="text-muted-foreground">In progress</span><p className="mt-0.5 text-amber-400">{fmt(b.inFlight)}</p></div>
                    <div><span className="text-muted-foreground">Available</span><p className="mt-0.5 font-medium text-emerald-400">{fmt(b.available)}</p></div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11 w-full text-xs"
                    disabled={b.available <= 0 || busyId === b.creatorId}
                    onClick={() => createPayout(b)}
                  >
                    {busyId === b.creatorId ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="mr-1.5 h-3 w-3" /> Create payout</>}
                  </Button>
                </li>
              ))}
            </MobileRecordCards>
            <DesktopTableRegion label="Creator balances table" className="rounded-none border-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Lifetime Earnings</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Paid</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">In Progress</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Available</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(b => (
                    <tr key={b.creatorId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium text-xs">{b.name}</td>
                      <td className="p-4 text-xs text-muted-foreground">{fmt(b.earned)}</td>
                      <td className="p-4 text-xs text-muted-foreground">{fmt(b.paid)}</td>
                      <td className="p-4 text-xs text-amber-400">{fmt(b.inFlight)}</td>
                      <td className="p-4 font-medium text-emerald-400">{fmt(b.available)}</td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs"
                          disabled={b.available <= 0 || busyId === b.creatorId}
                          onClick={() => createPayout(b)}
                        >
                          {busyId === b.creatorId ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="mr-1.5 h-3 w-3" /> Create payout</>}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DesktopTableRegion>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Open</p>
          <p className="text-2xl font-bold text-amber-400">{totals.processing}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{totals.completed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Failed</p>
          <p className="text-2xl font-bold text-destructive">{totals.failed}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-medium">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No payouts recorded yet — create one from a creator balance above</p>
        ) : (
          <>
            <MobileRecordCards>
              {payouts.map((p) => (
                <li key={p.id} className="mx-3 mb-3 rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{creatorName(p.creator_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(p.created_at)}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyles[p.status] ?? ''}`}>
                      {p.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                      {p.status === 'failed' && <XCircle className="h-2.5 w-2.5 mr-1" />}
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-emerald-400">{fmt(p.amount)}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs" disabled={busyId === p.id} onClick={() => updateStatus(p.id, 'completed')}>
                        Mark paid
                      </Button>
                    )}
                    {p.status === 'pending' && (
                      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs" disabled={busyId === p.id} onClick={() => updateStatus(p.id, 'processing')}>
                        Processing
                      </Button>
                    )}
                    {p.status !== 'failed' && p.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs text-destructive" disabled={busyId === p.id} onClick={() => updateStatus(p.id, 'failed')}>
                        Fail
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </MobileRecordCards>
            <DesktopTableRegion label="Payout history table" className="rounded-none border-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Created</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Processed</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium text-xs">{creatorName(p.creator_id)}</td>
                      <td className="p-4 text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                      <td className="p-4 text-xs text-muted-foreground">{fmtDate(p.processed_at)}</td>
                      <td className="p-4 font-medium text-emerald-400">{fmt(p.amount)}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] ${statusStyles[p.status] ?? ''}`}>
                          {p.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                          {p.status === 'failed' && <XCircle className="h-2.5 w-2.5 mr-1" />}
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        {p.status !== 'completed' && (
                          <Button size="sm" variant="ghost" className="h-9 px-2 text-xs" disabled={busyId === p.id} onClick={() => updateStatus(p.id, 'completed')}>
                            Mark paid
                          </Button>
                        )}
                        {p.status === 'pending' && (
                          <Button size="sm" variant="ghost" className="h-9 px-2 text-xs" disabled={busyId === p.id} onClick={() => updateStatus(p.id, 'processing')}>
                            Processing
                          </Button>
                        )}
                        {p.status !== 'failed' && p.status !== 'completed' && (
                          <Button size="sm" variant="ghost" className="h-9 px-2 text-xs text-destructive" disabled={busyId === p.id} onClick={() => updateStatus(p.id, 'failed')}>
                            Fail
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DesktopTableRegion>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPayouts;
