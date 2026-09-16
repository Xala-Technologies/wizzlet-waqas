import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Settings,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { EarningsSubnav } from '@/components/creator/EarningsSubnav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CREATOR_PAYOUTS_DEMO_HISTORY,
  CREATOR_PAYOUTS_DEMO_KPIS,
  shouldUseCreatorPayoutsDemo,
} from '@/lib/creatorPayoutsDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

function payoutStatusPill(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'paid') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  if (s === 'pending' || s === 'processing' || s === 'requested' || s === 'approved') {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }
  if (s === 'failed' || s === 'rejected' || s === 'cancelled' || s === 'canceled') {
    return 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400';
  }
  return 'border-border bg-muted text-muted-foreground';
}

function payoutStatusLabel(status: string): string {
  if (status === 'paid') return 'Completed';
  return status.replace(/_/g, ' ');
}

const CreatorPayouts = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const creator = useQuery(api.creators.queries.myCreator);
  const payoutRows = useQuery(api.payouts.mutations.listMine);
  const settingsRow = useQuery(api.payouts.mutations.getMySettings);
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
    balance === undefined;

  const livePayouts = useMemo(
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

  const liveAvailable = (balance?.availableCents ?? 0) / 100;
  const liveEarned = (balance?.earnedCents ?? 0) / 100;

  const useDemo = shouldUseCreatorPayoutsDemo({
    historyCount: livePayouts.length,
    available: liveAvailable,
    forceDemo,
    disableDemo,
  });

  const payouts = useDemo ? CREATOR_PAYOUTS_DEMO_HISTORY : livePayouts;

  const paidOut = useDemo
    ? CREATOR_PAYOUTS_DEMO_KPIS.paidOut
    : payouts
        .filter((p) => p.status === 'completed' || p.status === 'paid')
        .reduce((a, b) => a + b.amount, 0);
  const pending = useDemo
    ? CREATOR_PAYOUTS_DEMO_KPIS.pending
    : payouts
        .filter(
          (p) =>
            p.status === 'pending' ||
            p.status === 'processing' ||
            p.status === 'requested' ||
            p.status === 'approved',
        )
        .reduce((a, b) => a + b.amount, 0);
  const available = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.available : liveAvailable;
  const earned = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.earned : liveEarned;
  const minPayout = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.minimumPayout : minimumPayout;

  const saveSettings = async () => {
    if (useDemo) {
      toast.message('Sample preview — settings not saved', {
        description: 'Create real payout activity or add ?demo=0 to manage live settings.',
      });
      return;
    }
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
    if (useDemo) {
      toast.message('Sample preview — payout not requested', {
        description: 'This is mock data for design review. Real balances unlock Request payout.',
      });
      return;
    }
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
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (creator === null) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Earnings
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground">Payouts</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Request withdrawals and manage payout preferences.
          </p>
        </header>
        <p className="py-12 text-center text-sm text-muted-foreground">Creator profile not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Earnings
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Payouts
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Available = settled payments minus reserved payouts. Requests are manual — schedule is an
            ops preference only.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-xl">
            <Link to="/creator/earnings">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Earnings
            </Link>
          </Button>
          <Button
            type="button"
            className="min-h-11 shrink-0 rounded-xl gap-2"
            onClick={() => void requestPayout()}
            disabled={requesting || (!useDemo && available < minPayout)}
          >
            {requesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="h-4 w-4" />
            )}
            Request payout
          </Button>
        </div>
      </header>

      <EarningsSubnav active="payouts" />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — balances and history are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Lifetime earned',
              value: `$${earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: TrendingUp,
              iconClassName: kpiIconTone.sky,
            },
            {
              label: 'Available',
              value: `$${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: Wallet,
              iconClassName: kpiIconTone.emerald,
            },
            {
              label: 'Pending / requested',
              value: `$${pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: Clock,
              iconClassName: kpiIconTone.amber,
            },
            {
              label: 'Paid out',
              value: `$${paidOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              icon: CheckCircle2,
              iconClassName: kpiIconTone.violet,
            },
          ]}
        />
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
          <Settings className="h-4 w-4 text-primary" /> Payout settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="min-h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account label</Label>
            <Input
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder="Ending in 1234"
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Preferred schedule (ops preference)</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="min-h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">
              Saved for operators — payouts are not automatic. Use Request payout above.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Minimum payout ($)</Label>
            <Input
              type="number"
              value={minimumPayout}
              onChange={(e) => setMinimumPayout(Number(e.target.value))}
              className="min-h-11 rounded-xl"
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 min-h-11 rounded-xl"
          onClick={() => void saveSettings()}
          disabled={savingSettings}
        >
          {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save settings'}
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
          Payout history
        </h2>
        {payouts.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/50 px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      kpiIconTone.emerald,
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-ui font-semibold text-foreground">
                      ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {p.method} · {format(p.created_at, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize',
                    payoutStatusPill(p.status),
                  )}
                >
                  {payoutStatusLabel(p.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default CreatorPayouts;
