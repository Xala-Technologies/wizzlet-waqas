import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Lightbulb,
  Loader2,
  MoreVertical,
  RefreshCcw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { EarningsSubnav } from '@/components/creator/EarningsSubnav';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CREATOR_TXN_DEMO_METRICS,
  CREATOR_TXN_DEMO_ROWS,
  CREATOR_TXN_PRODUCTS,
  CREATOR_TXN_TIPS,
  paymentMethodLabel,
  shouldUseCreatorTransactionsDemo,
  type DemoTransaction,
  type TxnStatus,
  type TxnType,
} from '@/lib/creatorTransactionsDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

function money(cents: number, fractionDigits = 0): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

function moneyExact(cents: number): string {
  const abs = Math.abs(cents);
  const formatted = (abs / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

function statusPill(status: TxnStatus): string {
  if (status === 'succeeded') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  if (status === 'refunded') {
    return 'border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-400';
  }
  if (status === 'chargeback') {
    return 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400';
  }
  return 'border-border bg-muted text-muted-foreground';
}

function statusLabel(status: TxnStatus): string {
  if (status === 'succeeded') return 'Succeeded';
  if (status === 'refunded') return 'Refunded';
  if (status === 'chargeback') return 'Chargeback';
  return 'Failed';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
}

const CreatorTransactions = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const earnings = useQuery(api.creators.earnings.myEarnings);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sideType, setSideType] = useState('all');
  const [sideProduct, setSideProduct] = useState('all');
  const [sideStatus, setSideStatus] = useState('all');
  const [tablePage, setTablePage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loading = earnings === undefined;

  const liveRows: DemoTransaction[] = useMemo(() => {
    const payments = earnings?.recentPayments ?? [];
    return payments.map((p) => {
      const labelParts = p.label.split('—').map((s) => s.trim());
      const typeHint = (labelParts[0] ?? 'Subscription').toLowerCase();
      const name = labelParts[1] ?? labelParts[0] ?? 'Subscriber';
      let type: TxnType = 'Subscription';
      if (typeHint.includes('tip')) type = 'Tip';
      else if (typeHint.includes('refund')) type = 'Refund';
      else if (typeHint.includes('one') || typeHint.includes('purchase')) type = 'One-time purchase';
      else if (typeHint.includes('chargeback')) type = 'Chargeback';
      return {
        id: p.id,
        dateMs: p.createdAt,
        type,
        subscriberName: name,
        subscriberHandle: '',
        avatarTone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
        product: typeHint.includes('subscription') ? 'Subscription' : 'Product',
        amountCents: p.amountCents,
        status: (p.amountCents < 0 ? 'refunded' : 'succeeded') as TxnStatus,
        paymentMethod: 'visa' as const,
        paymentLast4: '••••',
      };
    });
  }, [earnings]);

  const useDemo = shouldUseCreatorTransactionsDemo({
    paymentCount: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const rows = useDemo ? CREATOR_TXN_DEMO_ROWS : liveRows;
  const metrics = useDemo
    ? CREATOR_TXN_DEMO_METRICS
    : {
        totalTransactions: liveRows.length,
        totalTransactionsDelta: null as number | null,
        totalRevenueCents: earnings?.grossCents ?? 0,
        totalRevenueDelta: null as number | null,
        totalRefundsCents: liveRows
          .filter((r) => r.amountCents < 0)
          .reduce((sum, r) => sum + Math.abs(r.amountCents), 0),
        totalRefundsDelta: null as number | null,
        successfulPayments: liveRows.filter((r) => r.status === 'succeeded').length,
        successfulPaymentsDelta: null as number | null,
        dateRangeLabel: 'All time',
        summary: {
          successful: {
            count: liveRows.filter((r) => r.status === 'succeeded').length,
            pct: liveRows.length
              ? Math.round(
                  (liveRows.filter((r) => r.status === 'succeeded').length / liveRows.length) *
                    1000,
                ) / 10
              : 0,
          },
          refunds: {
            count: liveRows.filter((r) => r.status === 'refunded').length,
            pct: liveRows.length
              ? Math.round(
                  (liveRows.filter((r) => r.status === 'refunded').length / liveRows.length) *
                    1000,
                ) / 10
              : 0,
          },
          chargebacks: {
            count: liveRows.filter((r) => r.status === 'chargeback').length,
            pct: liveRows.length
              ? Math.round(
                  (liveRows.filter((r) => r.status === 'chargeback').length / liveRows.length) *
                    1000,
                ) / 10
              : 0,
          },
          failed: {
            count: liveRows.filter((r) => r.status === 'failed').length,
            pct: liveRows.length
              ? Math.round(
                  (liveRows.filter((r) => r.status === 'failed').length / liveRows.length) * 1000,
                ) / 10
              : 0,
          },
        },
      };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (productFilter !== 'all' && row.product !== productFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.subscriberName.toLowerCase().includes(q) ||
        row.subscriberHandle.toLowerCase().includes(q) ||
        row.product.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search, typeFilter, productFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);
  const totalLabel = useDemo ? metrics.totalTransactions : filtered.length;

  const pageNumbers = useMemo(() => {
    const total = Math.min(pageCount, 5);
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i);
    const start = Math.max(0, Math.min(safePage - 2, pageCount - 5));
    return Array.from({ length: total }, (_, i) => start + i);
  }, [pageCount, safePage]);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of pageRows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const applySideFilters = () => {
    setTypeFilter(sideType);
    setProductFilter(sideProduct);
    setStatusFilter(sideStatus);
    setTablePage(0);
    toast.success('Filters applied');
  };

  const exportCsv = () => {
    if (useDemo) {
      toast.message('Sample preview — export disabled', {
        description: 'Create real payment activity or add ?demo=0 to export live data.',
      });
      return;
    }
    toast.message('Export started', {
      description: `${filtered.length} transactions queued.`,
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

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Transactions
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            View all payments, refunds, and other financial activity.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 rounded-xl gap-2"
          onClick={exportCsv}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </header>

      <EarningsSubnav active="transactions" />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — KPIs and the transactions table are mock content for design
            review. Add <span className="font-mono text-xs">?demo=0</span> to see empty real
            states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total transactions',
              value: metrics.totalTransactions.toLocaleString(),
              icon: CreditCard,
              iconClassName: kpiIconTone.sky,
              trendLabel:
                metrics.totalTransactionsDelta != null
                  ? `↑ ${metrics.totalTransactionsDelta}% vs. last month`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Total revenue',
              value: money(metrics.totalRevenueCents),
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.totalRevenueDelta != null
                  ? `↑ ${metrics.totalRevenueDelta}% vs. last month`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Total refunds',
              value: money(metrics.totalRefundsCents),
              icon: RefreshCcw,
              iconClassName: kpiIconTone.rose,
              trendLabel:
                metrics.totalRefundsDelta != null
                  ? `↑ ${metrics.totalRefundsDelta}% vs. last month`
                  : undefined,
              trendPositive: false,
            },
            {
              label: 'Successful payments',
              value: metrics.successfulPayments.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.successfulPaymentsDelta != null
                  ? `↑ ${metrics.successfulPaymentsDelta}% vs. last month`
                  : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:col-span-8">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
            <div className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setTablePage(0);
                }}
                placeholder="Search transactions…"
                className="h-11 min-h-11 rounded-xl pl-9"
                aria-label="Search transactions"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setSideType(v);
                setTablePage(0);
              }}
            >
              <SelectTrigger className="min-h-11 w-full rounded-xl sm:w-[9.5rem]" aria-label="Type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Subscription">Subscription</SelectItem>
                <SelectItem value="One-time purchase">One-time purchase</SelectItem>
                <SelectItem value="Tip">Tip</SelectItem>
                <SelectItem value="Refund">Refund</SelectItem>
                <SelectItem value="Chargeback">Chargeback</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={productFilter}
              onValueChange={(v) => {
                setProductFilter(v);
                setSideProduct(v);
                setTablePage(0);
              }}
            >
              <SelectTrigger
                className="min-h-11 w-full rounded-xl sm:w-[10rem]"
                aria-label="Product"
              >
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {CREATOR_TXN_PRODUCTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setSideStatus(v);
                setTablePage(0);
              }}
            >
              <SelectTrigger
                className="min-h-11 w-full rounded-xl sm:w-[9.5rem]"
                aria-label="Status"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="chargeback">Chargeback</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-14 text-center text-sm text-muted-foreground sm:px-5">
              No transactions found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <th className="w-10 px-4 py-3 sm:px-5">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={(v) => toggleAllPage(v === true)}
                          aria-label="Select all on page"
                        />
                      </th>
                      <th className="px-2 py-3">Date</th>
                      <th className="px-2 py-3">Type</th>
                      <th className="px-2 py-3">Subscriber</th>
                      <th className="px-2 py-3">Product</th>
                      <th className="px-2 py-3 text-right">Amount</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Payment method</th>
                      <th className="w-12 px-4 py-3 text-right sm:px-5"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3.5 sm:px-5">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(v) => toggleOne(row.id, v === true)}
                            aria-label={`Select ${row.id}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-2 py-3.5 text-muted-foreground">
                          {format(row.dateMs, 'MMM d, yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3.5 font-semibold text-foreground">
                          {row.type}
                        </td>
                        <td className="px-2 py-3.5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                row.avatarTone,
                              )}
                            >
                              {initials(row.subscriberName)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-foreground">
                                {row.subscriberName}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {row.subscriberHandle}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[9rem] truncate px-2 py-3.5 text-muted-foreground">
                          {row.product}
                        </td>
                        <td
                          className={cn(
                            'whitespace-nowrap px-2 py-3.5 text-right font-semibold tabular-nums',
                            row.amountCents < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-foreground',
                          )}
                        >
                          {moneyExact(row.amountCents)}
                        </td>
                        <td className="px-2 py-3.5">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                              statusPill(row.status),
                            )}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-3.5 text-muted-foreground">
                          {paymentMethodLabel(row.paymentMethod, row.paymentLast4)}
                        </td>
                        <td className="px-4 py-3.5 text-right sm:px-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                aria-label="Row actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.message(useDemo ? 'Sample preview' : 'Transaction', {
                                    description: row.id,
                                  })
                                }
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.message('Receipt', {
                                    description: useDemo
                                      ? 'Sample preview — receipt not sent.'
                                      : 'Receipt link copied.',
                                  })
                                }
                              >
                                Send receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Showing {showingFrom}–{showingTo} of{' '}
                  {useDemo && filtered.length === rows.length
                    ? totalLabel.toLocaleString()
                    : filtered.length.toLocaleString()}{' '}
                  transactions
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
          <button
            type="button"
            className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
            onClick={() =>
              toast.message('Date range', {
                description: metrics.dateRangeLabel,
              })
            }
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate text-sm font-semibold text-foreground">
                {metrics.dateRangeLabel}
              </span>
            </span>
          </button>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
              Transaction Filters
            </h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Transaction type
                </Label>
                <Select value={sideType} onValueChange={setSideType}>
                  <SelectTrigger className="min-h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Subscription">Subscription</SelectItem>
                    <SelectItem value="One-time purchase">One-time purchase</SelectItem>
                    <SelectItem value="Tip">Tip</SelectItem>
                    <SelectItem value="Refund">Refund</SelectItem>
                    <SelectItem value="Chargeback">Chargeback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Product</Label>
                <Select value={sideProduct} onValueChange={setSideProduct}>
                  <SelectTrigger className="min-h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {CREATOR_TXN_PRODUCTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                <Select value={sideStatus} onValueChange={setSideStatus}>
                  <SelectTrigger className="min-h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="chargeback">Chargeback</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="min-h-11 w-full rounded-xl"
                onClick={applySideFilters}
              >
                Apply Filters
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
              Transaction Summary
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">Last 30 days</p>
            <dl className="space-y-3 text-sm">
              {(
                [
                  ['Successful payments', metrics.summary.successful, 'text-emerald-600 dark:text-emerald-400'],
                  ['Refunds', metrics.summary.refunds, 'text-orange-600 dark:text-orange-400'],
                  ['Chargebacks', metrics.summary.chargebacks, 'text-rose-600 dark:text-rose-400'],
                  ['Failed payments', metrics.summary.failed, 'text-muted-foreground'],
                ] as const
              ).map(([label, item, tone]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={cn('font-bold tabular-nums', tone)}>
                    {item.count.toLocaleString()}{' '}
                    <span className="font-semibold text-muted-foreground">({item.pct}%)</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Tips for fewer failed payments
              </h2>
            </div>
            <ul className="space-y-2.5">
              {CREATOR_TXN_TIPS.map((tip) => (
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
    </DashboardLayout>
  );
};

export default CreatorTransactions;
