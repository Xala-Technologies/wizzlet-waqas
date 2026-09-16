import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Percent,
  Plus,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { resolveDiscountDuration, type PromoDiscountDuration } from '../../convex/lib/promoCodes';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { MarketingSubnav } from '@/components/creator/MarketingSubnav';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_PROMO_CODES_DEMO_METRICS,
  CREATOR_PROMO_CODES_DEMO_ROWS,
  CREATOR_PROMO_CODES_DEMO_TOP,
  CREATOR_PROMO_CODES_TIPS,
  isCreatorPromoCodesDemoId,
  shouldUseCreatorPromoCodesDemo,
  type DemoPromoCodeRow,
  type DemoPromoStatus,
} from '@/lib/creatorPromoCodesDemo';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type TableRowModel = DemoPromoCodeRow & {
  isDemo: boolean;
  isActive: boolean;
  discountDuration: PromoDiscountDuration;
  expiresAt?: number;
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function statusTone(status: DemoPromoStatus): string {
  if (status === 'active') return resultPillTone.active;
  if (status === 'paused') return resultPillTone.pending;
  return 'bg-muted text-muted-foreground border-border';
}

function liveStatus(p: {
  isActive: boolean;
  expiresAt?: number;
}): DemoPromoStatus {
  if (!p.isActive) return 'paused';
  if (p.expiresAt != null && p.expiresAt < Date.now()) return 'expired';
  return 'active';
}

const CreatorPromoCodes = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const upsertPromo = useMutation(api.creators.growth.upsertPromo);
  const removePromo = useMutation(api.creators.growth.removePromo);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [tablePage, setTablePage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('15');
  const [duration, setDuration] = useState<PromoDiscountDuration>('once');
  const [maxUses, setMaxUses] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading = creatorLoading || promos === undefined;
  const promoRows = promos ?? [];

  const useDemo = shouldUseCreatorPromoCodesDemo({
    promoCount: promoRows.length,
    forceDemo,
    disableDemo,
  });

  const rows: TableRowModel[] = useMemo(() => {
    if (useDemo) {
      return CREATOR_PROMO_CODES_DEMO_ROWS.map((r) => ({
        ...r,
        isDemo: true,
        isActive: r.status === 'active',
        discountDuration: 'once' as const,
      }));
    }
    return promoRows.map((p) => {
      const status = liveStatus(p);
      return {
        id: p._id,
        code: p.code,
        discountPercent: p.discountPercent,
        appliesTo: 'All products',
        uses: p.usedCount,
        maxUses: p.maxUses ?? null,
        revenueCents: 0,
        conversionPct: 0,
        status,
        createdAtMs: p.createdAt ?? p._creationTime,
        isDemo: false,
        isActive: p.isActive,
        discountDuration: resolveDiscountDuration(p),
        expiresAt: p.expiresAt,
      };
    });
  }, [useDemo, promoRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (productFilter !== 'all' && r.appliesTo !== productFilter) return false;
      if (!q) return true;
      return (
        r.code.toLowerCase().includes(q) ||
        r.appliesTo.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter, productFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);

  const metrics = useDemo
    ? CREATOR_PROMO_CODES_DEMO_METRICS
    : {
        activeCodes: rows.filter((r) => r.status === 'active').length,
        activeCodesDelta: null as number | null,
        totalUses: rows.reduce((sum, r) => sum + r.uses, 0),
        totalUsesDelta: null as number | null,
        revenueCents: 0,
        revenueDelta: null as number | null,
        conversionPct: 0,
        conversionDelta: null as number | null,
      };

  const topCodes = useMemo(() => {
    if (useDemo) return [...CREATOR_PROMO_CODES_DEMO_TOP];
    return [...rows]
      .sort((a, b) => b.uses - a.uses || b.revenueCents - a.revenueCents)
      .slice(0, 5)
      .map((r, i) => ({
        rank: i + 1,
        code: r.code,
        uses: r.uses,
        revenueCents: r.revenueCents,
      }));
  }, [useDemo, rows]);

  const deleteTarget = rows.find((r) => r.id === deleteId);

  const reviewCode = code.trim().toUpperCase() || 'CODE';
  const reviewDiscount = Number(discount);
  const reviewBits = [
    Number.isInteger(reviewDiscount) && reviewDiscount >= 1 && reviewDiscount <= 100
      ? `${reviewDiscount}%`
      : null,
    duration === 'forever' ? 'Forever' : 'Once',
    maxUses.trim() ? `max ${maxUses.trim()}` : 'unlimited',
  ].filter(Boolean);

  const handleCreate = async () => {
    if (!creator || saving) return;
    if (useDemo) {
      toast.message('Sample preview — code not created', {
        description: 'Create real promo codes when you leave demo mode (?demo=0).',
      });
      setCreateOpen(false);
      return;
    }
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) {
      toast.error('Codes need at least 3 characters');
      return;
    }
    const d = Number(discount);
    if (!Number.isInteger(d) || d < 1 || d > 100) {
      toast.error('Discount must be a whole number between 1% and 100%');
      return;
    }
    const max = maxUses.trim() ? Number(maxUses) : undefined;
    if (max !== undefined && (Number.isNaN(max) || max < 1)) {
      toast.error('Max uses must be a positive number');
      return;
    }
    setSaving(true);
    try {
      await upsertPromo({
        code: clean,
        discountPercent: d,
        discountDuration: duration,
        maxUses: max,
        isActive: true,
      });
      toast.success(`${clean} created`);
      setCode('');
      setMaxUses('');
      setDuration('once');
      setCreateOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create code';
      if (msg.includes('PROMO_CODE_TAKEN')) toast.error('That code is already taken');
      else if (msg.includes('INVALID_')) toast.error('Invalid promo details');
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row: TableRowModel) => {
    if (row.isDemo || isCreatorPromoCodesDemoId(row.id)) {
      toast.message('Sample preview — status not changed', {
        description: 'Demo rows are mock content for design review.',
      });
      return;
    }
    const next = !row.isActive;
    try {
      await upsertPromo({
        promoId: row.id as Id<'promoCodes'>,
        code: row.code,
        discountPercent: row.discountPercent,
        discountDuration: row.discountDuration,
        maxUses: row.maxUses ?? undefined,
        expiresAt: row.expiresAt,
        isActive: next,
      });
      toast.success(next ? `${row.code} enabled` : `${row.code} paused`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (useDemo || isCreatorPromoCodesDemoId(deleteId)) {
      toast.message('Sample preview — code not deleted', {
        description: 'Demo rows are mock content for design review.',
      });
      setDeleteId(null);
      return;
    }
    setDeleting(true);
    try {
      await removePromo({ promoId: deleteId as Id<'promoCodes'> });
      toast.success('Code removed');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
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

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <h1 className="text-heading font-bold tracking-tight text-foreground">Promo Codes</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Create discount codes to boost conversions and run targeted campaigns.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Percent className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to unlock promo codes.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Promo Codes
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Create discount codes to boost conversions and run targeted campaigns.
          </p>
        </div>
        <Button
          type="button"
          className="min-h-11 shrink-0 rounded-xl"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Promo Code
        </Button>
      </header>

      <MarketingSubnav active="promo-codes" />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — promo codes and KPIs are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Active codes',
              value: metrics.activeCodes.toLocaleString(),
              icon: Tag,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.activeCodesDelta != null ? `↑ ${metrics.activeCodesDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Total uses',
              value: metrics.totalUses.toLocaleString(),
              icon: BarChart3,
              iconClassName: kpiIconTone.sky,
              trendLabel:
                metrics.totalUsesDelta != null ? `↑ ${metrics.totalUsesDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Revenue generated',
              value:
                useDemo || metrics.revenueCents > 0
                  ? money(metrics.revenueCents)
                  : '—',
              icon: TrendingUp,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.revenueDelta != null ? `↑ ${metrics.revenueDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Average conversion rate',
              value:
                useDemo || metrics.conversionPct > 0
                  ? `${metrics.conversionPct}%`
                  : '—',
              icon: Percent,
              iconClassName: kpiIconTone.amber,
              trendLabel:
                metrics.conversionDelta != null ? `↑ ${metrics.conversionDelta}%` : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:col-span-8">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">All codes</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1 sm:w-48">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTablePage(0);
                  }}
                  placeholder="Search codes…"
                  className="h-11 min-h-11 rounded-xl pl-9"
                  aria-label="Search promo codes"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setTablePage(0);
                }}
              >
                <SelectTrigger className="min-h-11 w-full rounded-xl sm:w-[9.5rem]" aria-label="Status filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={productFilter}
                onValueChange={(v) => {
                  setProductFilter(v);
                  setTablePage(0);
                }}
              >
                <SelectTrigger className="min-h-11 w-full rounded-xl sm:w-[10rem]" aria-label="Product filter">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="NBA Picks">NBA Picks</SelectItem>
                  <SelectItem value="VIP Access">VIP Access</SelectItem>
                  <SelectItem value="MLB Picks">MLB Picks</SelectItem>
                  <SelectItem value="Premium Picks">Premium Picks</SelectItem>
                  <SelectItem value="Monthly Pass">Monthly Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-14 text-center sm:px-5">
              <Percent className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-ui font-semibold text-foreground">No promo codes found</p>
              <p className="mt-1 text-support text-muted-foreground">
                {rows.length === 0
                  ? 'Create a percent-off code to boost conversions.'
                  : 'Try a different search or filter.'}
              </p>
              {rows.length === 0 ? (
                <Button
                  type="button"
                  className="mt-4 min-h-11 rounded-xl"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Promo Code
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[56rem]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 pl-4">
                        <Checkbox aria-label="Select all" disabled className="opacity-40" />
                      </TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Applies to</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="pl-4">
                          <Checkbox aria-label={`Select ${row.code}`} disabled className="opacity-40" />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold text-foreground">
                          {row.code}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.discountPercent}% off
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.appliesTo}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.uses.toLocaleString()}
                          {row.maxUses != null ? `/${row.maxUses}` : ''}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.revenueCents > 0 ? money(row.revenueCents) : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.conversionPct > 0 ? `${row.conversionPct}%` : '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                              statusTone(row.status),
                            )}
                          >
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-support text-muted-foreground">
                          {format(row.createdAtMs, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                aria-label={`Actions for ${row.code}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {row.status !== 'expired' ? (
                                <DropdownMenuItem onClick={() => void handleToggle(row)}>
                                  {row.isActive || row.status === 'active' ? 'Pause' : 'Enable'}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(row.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-support text-muted-foreground">
                  Showing {showingFrom}–{showingTo} of {filtered.length} promo codes
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={safePage === 0}
                    onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
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
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Create a Promo Code
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Launch a percent-off code for first month or forever to drive more conversions.
            </p>
            <Button
              type="button"
              className="mt-4 min-h-11 w-full rounded-xl"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Promo Code
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
              Top Performing Codes
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">Last 30 days</p>
            {topCodes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No usage yet — create a code to start ranking.
              </p>
            ) : (
              <ol className="space-y-3">
                {topCodes.map((item) => (
                  <li key={item.code} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-700 dark:text-violet-400">
                      {item.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-bold text-foreground">
                        {item.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.uses.toLocaleString()} uses
                        {item.revenueCents > 0 ? ` · ${money(item.revenueCents)}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-base font-extrabold tracking-tight text-foreground">
              Tips for higher conversions
            </h2>
            <ul className="space-y-2.5">
              {CREATOR_PROMO_CODES_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-400">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create promo code</DialogTitle>
            <DialogDescription>
              Percent off for the first month only, or forever on every renewal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-codes-code">Code</Label>
              <Input
                id="promo-codes-code"
                className="h-11 min-h-11 font-mono uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER_SALE"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-codes-discount">Discount % (1–100)</Label>
              <Input
                id="promo-codes-discount"
                className="h-11 min-h-11"
                type="number"
                min={1}
                max={100}
                step={1}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <fieldset className="space-y-2">
              <Legend className="text-support font-medium text-muted-foreground">
                Discount duration
              </Legend>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="promo-codes-duration"
                  className="mt-1"
                  checked={duration === 'once'}
                  onChange={() => setDuration('once')}
                />
                <span>
                  <span className="block text-ui font-medium text-foreground">Once</span>
                  <span className="text-support text-muted-foreground">First month only</span>
                </span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="promo-codes-duration"
                  className="mt-1"
                  checked={duration === 'forever'}
                  onChange={() => setDuration('forever')}
                />
                <span>
                  <span className="block text-ui font-medium text-foreground">Forever</span>
                  <span className="text-support text-muted-foreground">Every renewal</span>
                </span>
              </label>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="promo-codes-max">Max redemptions (optional)</Label>
              <Input
                id="promo-codes-max"
                className="h-11 min-h-11"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-caption uppercase tracking-wider text-muted-foreground">Preview</p>
              <p className="truncate font-mono text-ui text-foreground">{reviewCode}</p>
              <p className="truncate text-support text-muted-foreground">{reviewBits.join(' · ')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={saving || !code.trim()}
              onClick={() => void handleCreate()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.code}” will be removed from your catalogue. Existing purchases keep their original discount terms.`
                : 'This code will be removed from your catalogue. Existing purchases keep their original discount terms.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

function Legend({ className, children }: { className?: string; children: ReactNode }) {
  return <legend className={className}>{children}</legend>;
}

export default CreatorPromoCodes;
