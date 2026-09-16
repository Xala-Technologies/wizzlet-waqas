import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  ArrowUpFromLine,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Lightbulb,
  Loader2,
  Settings,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EarningsSubnav } from '@/components/creator/EarningsSubnav';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CREATOR_PAYOUTS_DEMO_HISTORY,
  CREATOR_PAYOUTS_DEMO_KPIS,
  CREATOR_PAYOUTS_TIPS,
  shouldUseCreatorPayoutsDemo,
} from '@/lib/creatorPayoutsDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

function money(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function moneyExact(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
  if (status === 'completed') return 'Completed';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function methodDisplay(method: string): string {
  const m = method.toLowerCase();
  if (m.includes('wise')) return 'Wise (USD)';
  if (m === 'bank_transfer' || m === 'bank') return 'Bank transfer';
  if (m === 'paypal') return 'PayPal';
  if (m === 'stripe') return 'Stripe';
  return method;
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
  const [schedule, setSchedule] = useState('weekly');
  const [minimumPayout, setMinimumPayout] = useState(50);
  const [savingSettings, setSavingSettings] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tablePage, setTablePage] = useState(0);

  useEffect(() => {
    if (!settingsRow) return;
    setMethod(settingsRow.method);
    setAccountLabel(settingsRow.accountLabel ?? '');
    setSchedule(settingsRow.schedule);
    setMinimumPayout(settingsRow.minimumPayoutCents / 100);
  }, [settingsRow]);

  const loading =
    creator === undefined || payoutRows === undefined || balance === undefined;

  const livePayouts = useMemo(
    () =>
      (payoutRows ?? []).map((p) => ({
        id: p._id,
        amount: p.amountCents / 100,
        status: p.status,
        method: p.method ?? '—',
        referenceId: p._id.slice(-9),
        created_at: p.createdAt,
        processed_at: p.processedAt ?? null,
      })),
    [payoutRows],
  );

  const liveAvailable = (balance?.availableCents ?? 0) / 100;

  const useDemo = shouldUseCreatorPayoutsDemo({
    historyCount: livePayouts.length,
    available: liveAvailable,
    forceDemo,
    disableDemo,
  });

  const payouts = useDemo ? CREATOR_PAYOUTS_DEMO_HISTORY : livePayouts;

  const available = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.available : liveAvailable;
  const paidOut = useDemo
    ? CREATOR_PAYOUTS_DEMO_KPIS.paidOut
    : payouts
        .filter((p) => p.status === 'completed' || p.status === 'paid')
        .reduce((a, b) => a + b.amount, 0);
  const minPayout = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.minimumPayout : minimumPayout;

  const methodMasked = useDemo
    ? CREATOR_PAYOUTS_DEMO_KPIS.methodMasked
    : accountLabel
      ? accountLabel
      : '—';
  const methodLabel = useDemo
    ? CREATOR_PAYOUTS_DEMO_KPIS.methodLabel
    : methodDisplay(method);
  const scheduleLabel = useDemo
    ? CREATOR_PAYOUTS_DEMO_KPIS.scheduleLabel
    : schedule === 'weekly'
      ? 'Weekly (Fridays)'
      : schedule === 'biweekly'
        ? 'Biweekly'
        : 'Monthly';
  const nextPayoutLabel = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.nextPayoutLabel : '—';
  const nextPayoutRemaining = useDemo ? CREATOR_PAYOUTS_DEMO_KPIS.nextPayoutRemaining : undefined;

  const pageCount = Math.max(1, Math.ceil(payouts.length / PAGE_SIZE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = payouts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = payouts.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(payouts.length, (safePage + 1) * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const total = pageCount;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i);
    const start = Math.max(0, Math.min(safePage - 1, total - 3));
    return [start, start + 1, start + 2].filter((p) => p < total);
  }, [pageCount, safePage]);

  const openSettings = () => setSettingsOpen(true);

  const saveSettings = async () => {
    if (useDemo) {
      toast.message('Sample preview — settings not saved', {
        description: 'Create real payout activity or add ?demo=0 to manage live settings.',
      });
      setSettingsOpen(false);
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
      setSettingsOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const requestPayout = async () => {
    if (useDemo) {
      toast.message('Sample preview — payout not requested', {
        description: 'This is mock data for design review. Real balances unlock Withdraw Now.',
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

  const viewPayout = (referenceId: string) => {
    toast.message(useDemo ? 'Sample preview — payout detail' : 'Payout detail', {
      description: `Reference ${referenceId}`,
    });
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
          <h1 className="text-heading font-bold tracking-tight text-foreground">Payouts</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Manage your payouts, payment method, and payout settings.
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
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Payouts
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Manage your payouts, payment method, and payout settings.
          </p>
        </div>
        <Button
          type="button"
          className="min-h-11 shrink-0 rounded-xl gap-2"
          onClick={() => void requestPayout()}
          disabled={requesting || (!useDemo && available < minPayout)}
        >
          {requesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpFromLine className="h-4 w-4" />
          )}
          Withdraw Now
        </Button>
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
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  kpiIconTone.emerald,
                )}
              >
                <Wallet className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
              {money(available)}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Available for payout</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  kpiIconTone.violet,
                )}
              >
                <TrendingUp className="h-5 w-5" aria-hidden />
              </div>
              {useDemo ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  ↑ {CREATOR_PAYOUTS_DEMO_KPIS.paidOutDelta}% vs. last 3 months
                </span>
              ) : null}
            </div>
            <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
              {money(paidOut)}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Total paid out</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  kpiIconTone.sky,
                )}
              >
                <Calendar className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {nextPayoutLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Next payout date</p>
            {nextPayoutRemaining ? (
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{nextPayoutRemaining}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  kpiIconTone.amber,
                )}
              >
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <button
                type="button"
                onClick={openSettings}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Change
              </button>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {methodMasked}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{methodLabel}</p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:col-span-8">
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Payout History
            </h2>
          </div>

          {payouts.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground sm:px-5">
              No payouts yet.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 sm:px-5">Date</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Payment method</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Reference ID</th>
                      <th className="px-4 py-3 text-right sm:px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p) => (
                      <tr key={p.id} className="border-b border-border/70 last:border-0">
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground sm:px-5">
                          {format(p.created_at, 'MMM d, yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-semibold tabular-nums text-foreground">
                          {moneyExact(p.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                          {methodDisplay(p.method)}
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                              payoutStatusPill(p.status),
                            )}
                          >
                            {payoutStatusLabel(p.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs text-muted-foreground">
                          {p.referenceId}
                        </td>
                        <td className="px-4 py-3.5 text-right sm:px-5">
                          <button
                            type="button"
                            className="text-sm font-bold text-primary hover:underline"
                            onClick={() => viewPayout(p.referenceId)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Showing {showingFrom}–{showingTo} of {payouts.length} payouts
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    disabled={safePage <= 0}
                    onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {pageNumbers.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={p === safePage ? 'default' : 'outline'}
                      className="h-9 min-w-9 rounded-lg px-2.5 text-xs font-bold"
                      onClick={() => setTablePage(p)}
                    >
                      {p + 1}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setTablePage((p) => Math.min(pageCount - 1, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="flex flex-col gap-4 xl:col-span-4">
          <section
            id="payout-settings"
            className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="mb-1 flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Payout Settings
              </h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Configure how and when you get paid.
            </p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              <li>
                <button
                  type="button"
                  onClick={openSettings}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="block text-xs font-semibold text-muted-foreground">
                      Payment method
                    </span>
                    <span className="text-sm font-bold text-foreground">{methodLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openSettings}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="block text-xs font-semibold text-muted-foreground">
                      Payout schedule
                    </span>
                    <span className="text-sm font-bold text-foreground">{scheduleLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openSettings}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="block text-xs font-semibold text-muted-foreground">
                      Minimum payout amount
                    </span>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {moneyExact(minPayout)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            </ul>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11 w-full rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={openSettings}
            >
              Edit Payout Settings
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-2 flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Need Help?</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Questions about payouts, timing, or payment methods? Our help center covers the
              details.
            </p>
            <Button asChild variant="outline" className="min-h-11 w-full rounded-xl gap-2">
              <Link to="/creator/settings">
                View Help Center
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </section>

          <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Tips for faster payouts
              </h2>
            </div>
            <ul className="space-y-2.5">
              {CREATOR_PAYOUTS_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payout Settings</DialogTitle>
            <DialogDescription>
              Preferred schedule is an ops preference — payouts are requested manually.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
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
                  <SelectItem value="wise">Wise (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account label</Label>
              <Input
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder="**** 4582"
                className="min-h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger className="min-h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly (Fridays)</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              onClick={() => void saveSettings()}
              disabled={savingSettings}
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CreatorPayouts;
