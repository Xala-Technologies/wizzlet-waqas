import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Clock, Settings, ArrowDownToLine, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CreatorPayouts = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const payoutRows = useQuery(api.payouts.mutations.listMine);
  const settingsRow = useQuery(api.payouts.mutations.getMySettings);
  const earnings = useQuery(api.creators.earnings.myEarnings);
  const balance = useQuery(api.payouts.mutations.availableBalance);
  const upsertSettings = useMutation(api.payouts.mutations.upsertSettings);
  const requestPayoutMut = useMutation(api.payouts.mutations.requestPayout);

  const [method, setMethod] = useState('bank_transfer');
  const [accountLabel, setAccountLabel] = useState('');
  const [schedule, setSchedule] = useState('monthly');
  const [minimumPayout, setMinimumPayout] = useState(50);
  const [savingSettings, setSavingSettings] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!settingsRow) return;
    setMethod(settingsRow.method);
    setAccountLabel(settingsRow.accountLabel ?? '');
    setSchedule(settingsRow.schedule);
    setMinimumPayout(settingsRow.minimumPayoutCents / 100);
  }, [settingsRow]);

  const loading =
    creator === undefined ||
    payoutRows === undefined ||
    earnings === undefined ||
    balance === undefined;

  const payouts = useMemo(
    () =>
      (payoutRows ?? []).map((p) => ({
        id: p._id,
        amount: p.amountCents / 100,
        status: p.status,
        method: p.method ?? '—',
        created_at: p.createdAt,
        processed_at: p.processedAt ?? null,
      })),
    [payoutRows],
  );

  const lifetimeEarnings = (balance?.earnedCents ?? earnings?.netCents ?? 0) / 100;
  const paidOut = (balance?.reservedCents ?? 0) / 100;
  const pending = payouts
    .filter((p) => p.status === 'pending' || p.status === 'processing' || p.status === 'requested')
    .reduce((a, b) => a + b.amount, 0);
  const available = (balance?.availableCents ?? 0) / 100;

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await upsertSettings({
        method,
        accountLabel: accountLabel || undefined,
        schedule,
        minimumPayoutCents: Math.round(minimumPayout * 100),
      });
      toast.success('Payout settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const requestPayout = async () => {
    if (available < minimumPayout) {
      toast.error(`Minimum payout is $${minimumPayout.toFixed(2)}`);
      return;
    }
    setRequesting(true);
    try {
      await requestPayoutMut({
        amountCents: Math.round(available * 100),
        method,
      });
      toast.success('Payout request saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (creator === null) {
    return (
      <DashboardLayout type="creator">
        <p className="text-sm text-muted-foreground py-12 text-center">Creator profile not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage withdrawals and payout settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <Wallet className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">${available.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Clock className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold">${pending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Pending / requested</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">${paidOut.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Paid out</p>
        </div>
      </div>

      <div className="mb-8">
        <Button onClick={() => void requestPayout()} disabled={requesting || available < minimumPayout} className="gap-2">
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
          Request payout (${available.toFixed(2)})
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Settings className="h-4 w-4" /> Payout settings</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Account label</Label>
            <Input value={accountLabel} onChange={(e) => setAccountLabel(e.target.value)} placeholder="Ending in 1234" />
          </div>
          <div>
            <Label>Schedule</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Minimum payout ($)</Label>
            <Input type="number" value={minimumPayout} onChange={(e) => setMinimumPayout(Number(e.target.value))} />
          </div>
        </div>
        <Button className="mt-4" onClick={() => void saveSettings()} disabled={savingSettings}>
          {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save settings'}
        </Button>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">History</h2>
      {payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payouts yet.</p>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">${p.amount.toFixed(2)} · {p.status}</p>
                  <p className="text-xs text-muted-foreground">{p.method} · {format(p.created_at, 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorPayouts;
