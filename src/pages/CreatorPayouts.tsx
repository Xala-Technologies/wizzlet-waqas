import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { createConnectOnboardingLink } from '@/lib/stripe';
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
import { clayCard } from '@/lib/overviewClay';
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
import { scanTruncationNote } from '@/lib/adminTruncation';
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
  const connectStatus = useQuery(api.creators.queries.myConnectStatus);
  const refreshConnect = useAction(api.payments.stripeNode.refreshConnectAccountStatus);
  const handledConnectParam = useRef<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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

  const connectParam = searchParams.get('connect');
  useEffect(() => {
    if (forceDemo) return;
    if (connectParam !== 'return' && connectParam !== 'refresh') return;
    if (handledConnectParam.current === connectParam) return;
    handledConnectParam.current = connectParam;
    void (async () => {
      try {
        if (connectParam === 'return') {
          await refreshConnect({});
          toast.success(
            'Stripe Connect status updated. Admin can Send via Stripe only after Express payouts are enabled and the platform holds USD.',
          );
          return;
        }
        await createConnectOnboardingLink();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not refresh Stripe Connect.';
        if (message.includes('CONNECT_ACCOUNT_MISSING')) {
          toast.info('Connect Stripe to continue onboarding.');
          return;
        }
        toast.error(message);
      }
    })();
  }, [connectParam, forceDemo, refreshConnect]);

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

  const balanceTruncation = !useDemo
    ? scanTruncationNote(balance?.truncated === true, balance?.listLimit)
    : null;

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
      const msg = e instanceof Error ? e.message : 'Failed to request payout';
      if (msg.includes('BALANCE_TRUNCATED')) {
        toast.error(
          'Balance history is too large to verify safely — contact support before withdrawing.',
        );
      } else {
        toast.error(msg);
      }
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
      <DashboardLayout type="creator" mainClassName="bg-clay-page">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (creator === null) {
    return (
      <DashboardLayout type="creator" mainClassName="bg-clay-page">
        <header className="mb-4">
        </header>
        <p className="py-12 text-center text-sm text-muted-foreground">Creator profile not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator" mainClassName="bg-clay-page">
      <header className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-end sm:gap-8">
        <Button
          type="button"
          className="clay-btn h-12 w-full shrink-0 gap-2 rounded-[0.875rem] px-6 sm:w-auto"
          onClick={() => void requestPayout()}
          disabled={requesting || (!useDemo && available < minPayout)}
        >
          {requesting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <ArrowUpFromLine className="h-5 w-5" aria-hidden />
          )}
          Withdraw Now
        </Button>
      </header>

      <EarningsSubnav active="payouts" />

      {useDemo ? (
        <div className="clay-card mb-6 flex items-start gap-3 bg-[#fbf8f3] px-4 py-3.5 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — balances and history are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : (
        <div className="clay-card mb-6 px-4 py-3.5 text-sm text-muted-foreground sm:px-5">
          Withdrawals update the Prizelet ledger (USD). Admins send approved payouts with a real
          Stripe Connect Transfer when your Express account can receive payouts (matched USD or
          Stripe-native FX from platform settlement)
          {connectStatus?.stripeAccountId
            ? ` — Express ${connectStatus.stripeAccountId}${
                connectStatus.payoutsEnabled
                  ? ' is payouts-enabled'
                  : ' still needs Stripe KYC (payouts not enabled)'
              }.`
            : '. Connect Stripe Express below to start KYC.'}
          {balanceTruncation ? (
            <p className="mt-2 text-amber-600 dark:text-amber-400">{balanceTruncation}</p>
          ) : null}
        </div>
      )}

      {!useDemo ? (
        <div className={cn(clayCard, 'mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5')}>
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-foreground">Stripe Connect</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {connectStatus?.payoutsEnabled
                ? 'Express payouts enabled. Approved withdrawals can be sent as Stripe Transfers (USD available or Stripe-native FX).'
                : connectStatus?.stripeAccountId
                  ? 'Finish Stripe Express KYC so this account can receive Connect Transfers.'
                  : 'Open Stripe Express onboarding (USD / US Express for today’s ledger). KYC is required before any Transfer.'}
            </p>
          </div>
          <Button
            type="button"
            variant={connectStatus?.payoutsEnabled ? 'outline' : 'default'}
            className="h-11 shrink-0 rounded-xl"
            disabled={connecting}
            onClick={() => {
              setConnecting(true);
              void createConnectOnboardingLink().finally(() => setConnecting(false));
            }}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : connectStatus?.payoutsEnabled ? (
              'Update Stripe account'
            ) : connectStatus?.stripeAccountId ? (
              'Continue Stripe onboarding'
            ) : (
              'Connect Stripe'
            )}
          </Button>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cn(clayCard, 'p-4 sm:p-5')}>
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

          <div className={cn(clayCard, 'p-4 sm:p-5')}>
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

          <div className={cn(clayCard, 'p-4 sm:p-5')}>
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

          <div className={cn(clayCard, 'p-4 sm:p-5')}>
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
        <section className={cn(clayCard, 'overflow-hidden xl:col-span-8')}>
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
            className={cn(clayCard, 'scroll-mt-24 p-5')}
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

          <section className={cn(clayCard, 'p-5')}>
            <div className="mb-2 flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Need Help?</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Questions about payouts, timing, or payment methods? Our help center covers the
              details.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link to="/creator/settings">
                View Help Center
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </section>

          <section className={cn(clayCard, 'border-violet-500/20 bg-violet-500/5 p-5')}>
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
                <SelectTrigger>
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
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
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
