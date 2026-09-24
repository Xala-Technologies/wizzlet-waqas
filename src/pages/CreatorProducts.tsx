import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
  DollarSign,
  Gem,
  Gift,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import {
  CREATOR_PRODUCTS_DEMO_METRICS,
  CREATOR_PRODUCTS_DEMO_ROWS,
  formatMoneyCents,
  formatProductPrice,
  isCreatorProductsDemoId,
  shouldUseCreatorProductsDemo,
  type DemoProductRow,
  type ProductBillingType,
  type ProductUiStatus,
} from '@/lib/creatorProductsDemo';
import {
  CreateProductForm,
  type CreateProductInitial,
} from '@/components/creator/CreateProductForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';

const TABLE_PAGE = 10;
const BUNDLE_BANNER_KEY = 'prizelet.creator.products.bundleBanner.dismissed';

type TabFilter = 'all' | ProductBillingType | 'archived';
type StatusFilter = 'all' | ProductUiStatus;

type LiveProduct = {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  type: ProductBillingType;
  billingPeriod: string;
  priceCents: number;
  subscribers: number;
  subscribersLabel?: string;
  revenueMrrCents: number;
  status: ProductUiStatus;
  createdAtMs: number;
  isFeatured: boolean;
  maxSpots?: number | null;
  isLimited: boolean;
  isClosed: boolean;
  isActive: boolean;
  imageStorageId?: Id<'_storage'> | null;
};

const STATUS_TABS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'All Products' },
  { id: 'subscription', label: 'Subscriptions' },
  { id: 'one-time', label: 'One-time Products' },
  { id: 'bundle', label: 'Bundles' },
  { id: 'archived', label: 'Archived' },
];

const statusPillClass: Record<ProductUiStatus, string> = {
  active: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  draft: 'border-border bg-muted text-muted-foreground',
  archived: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
};

const statusLabel: Record<ProductUiStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

const typePillClass: Record<ProductBillingType, string> = {
  subscription: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'one-time': 'border-border bg-muted text-muted-foreground',
  bundle: 'border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300',
};

const typeLabel: Record<ProductBillingType, string> = {
  subscription: 'Subscription',
  'one-time': 'One-time',
  bundle: 'Bundle',
};

function resolveType(billingPeriod: string, name: string): ProductBillingType {
  if (billingPeriod === 'one-time') return 'one-time';
  if (name.toLowerCase().includes('bundle')) return 'bundle';
  return 'subscription';
}

function resolveStatus(p: { isActive: boolean; isClosed: boolean }): ProductUiStatus {
  if (p.isClosed) return 'archived';
  if (!p.isActive) return 'draft';
  return 'active';
}

function productIcon(name: string, type: ProductBillingType, featured: boolean) {
  const n = name.toLowerCase();
  if (type === 'bundle' || n.includes('bundle')) return Package;
  if (n.includes('vip') || n.includes('diamond')) return Gem;
  if (n.includes('premium') || featured || n.includes('star')) return Star;
  if (n.includes('ebook') || n.includes('guide') || n.includes('book')) return BookOpen;
  if (n.includes('video') || n.includes('course')) return Video;
  if (n.includes('community') || n.includes('insight')) return Users;
  return Crown;
}

function iconTone(Icon: typeof Crown): string {
  if (Icon === Gem) return kpiIconTone.rose;
  if (Icon === Star) return kpiIconTone.amber;
  if (Icon === BookOpen) return kpiIconTone.sky;
  if (Icon === Video) return kpiIconTone.violet;
  if (Icon === Users) return kpiIconTone.emerald;
  if (Icon === Package) return kpiIconTone.cyan;
  return kpiIconTone.violet;
}

function formatSignedPct(value: number | null): string | undefined {
  if (value === null) return undefined;
  const sign = value > 0 ? '+' : value < 0 ? '' : '+';
  return `${sign}${value}% vs. last month`;
}

const CreatorProducts = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const queryFromUrl = searchParams.get('q') ?? '';

  const creator = useQuery(api.creators.queries.myCreator);
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const earnings = useQuery(api.creators.earnings.myEarnings);
  const removeProduct = useMutation(api.products.mutations.remove);

  const loading =
    creator === undefined ||
    (creator && products === undefined) ||
    (creator && earnings === undefined);

  const subCountByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs ?? []) {
      if (s.status !== 'active' || !s.productId) continue;
      map.set(s.productId, (map.get(s.productId) ?? 0) + 1);
    }
    return map;
  }, [subs]);

  const liveRows: LiveProduct[] = useMemo(() => {
    return (products ?? []).map((p) => {
      const type = resolveType(p.billingPeriod, p.name);
      const status = resolveStatus(p);
      const subscribers = subCountByProduct.get(p._id) ?? 0;
      const revenueMrrCents =
        type === 'subscription' || type === 'bundle' ? subscribers * p.priceCents : 0;
      return {
        id: p._id,
        name: p.name,
        description: p.description ?? p.shortDescription ?? '',
        shortDescription: p.shortDescription,
        type,
        billingPeriod: p.billingPeriod,
        priceCents: p.priceCents,
        subscribers,
        subscribersLabel:
          type === 'one-time' && subscribers > 0 ? `${subscribers} purchases` : undefined,
        revenueMrrCents,
        status,
        createdAtMs: p.createdAt,
        isFeatured: p.isFeatured,
        maxSpots: p.maxSpots,
        isLimited: p.isLimited,
        isClosed: p.isClosed,
        isActive: p.isActive,
        imageStorageId: p.imageStorageId,
      };
    });
  }, [products, subCountByProduct]);

  const useDemo = shouldUseCreatorProductsDemo({
    count: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const tableRows: Array<LiveProduct | DemoProductRow> = useDemo
    ? CREATOR_PRODUCTS_DEMO_ROWS
    : liveRows;

  const [search, setSearch] = useState(queryFromUrl);
  const [tab, setTab] = useState<TabFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tablePage, setTablePage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bundleDismissed, setBundleDismissed] = useState(
    () => safeGetItem(BUNDLE_BANNER_KEY) === '1',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<CreateProductInitial | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tabCounts = useMemo(() => {
    if (useDemo) {
      return {
        all: CREATOR_PRODUCTS_DEMO_METRICS.totalProducts,
        subscription: CREATOR_PRODUCTS_DEMO_ROWS.filter(
          (r) => r.type === 'subscription' && r.status !== 'archived',
        ).length,
        'one-time': CREATOR_PRODUCTS_DEMO_ROWS.filter(
          (r) => r.type === 'one-time' && r.status !== 'archived',
        ).length,
        bundle: CREATOR_PRODUCTS_DEMO_ROWS.filter(
          (r) => r.type === 'bundle' && r.status !== 'archived',
        ).length,
        archived: CREATOR_PRODUCTS_DEMO_ROWS.filter((r) => r.status === 'archived').length,
      };
    }
    const nonArchived = tableRows.filter((r) => r.status !== 'archived');
    return {
      all: nonArchived.length,
      subscription: nonArchived.filter((r) => r.type === 'subscription').length,
      'one-time': nonArchived.filter((r) => r.type === 'one-time').length,
      bundle: nonArchived.filter((r) => r.type === 'bundle').length,
      archived: tableRows.filter((r) => r.status === 'archived').length,
    };
  }, [tableRows, useDemo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tableRows.filter((r) => {
      if (tab === 'archived') {
        if (r.status !== 'archived') return false;
      } else if (tab === 'all') {
        if (r.status === 'archived') return false;
      } else {
        if (r.status === 'archived' || r.type !== tab) return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [tableRows, search, tab, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * TABLE_PAGE, safePage * TABLE_PAGE + TABLE_PAGE);
  const showingFrom = filtered.length === 0 ? 0 : safePage * TABLE_PAGE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * TABLE_PAGE);

  const pageAllSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  const toggleSelectAllPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of pageRows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const metrics = useMemo(() => {
    if (useDemo) {
      return {
        totalProducts: CREATOR_PRODUCTS_DEMO_METRICS.totalProducts,
        totalProductsDelta: CREATOR_PRODUCTS_DEMO_METRICS.totalProductsDelta,
        totalSubscribers: CREATOR_PRODUCTS_DEMO_METRICS.totalSubscribers,
        totalSubscribersDelta: CREATOR_PRODUCTS_DEMO_METRICS.totalSubscribersDelta,
        mrrCents: CREATOR_PRODUCTS_DEMO_METRICS.mrrCents,
        mrrDelta: CREATOR_PRODUCTS_DEMO_METRICS.mrrDelta,
        totalRevenueCents: CREATOR_PRODUCTS_DEMO_METRICS.totalRevenueCents,
        totalRevenueDelta: CREATOR_PRODUCTS_DEMO_METRICS.totalRevenueDelta,
      };
    }
    const activeSubs = (subs ?? []).filter((s) => s.status === 'active').length;
    const mrrCents = liveRows
      .filter((r) => r.status === 'active' && r.type !== 'one-time')
      .reduce((sum, r) => sum + r.revenueMrrCents, 0);
    return {
      totalProducts: liveRows.filter((r) => r.status !== 'archived').length,
      totalProductsDelta: null as number | null,
      totalSubscribers: activeSubs,
      totalSubscribersDelta: null as number | null,
      mrrCents: earnings?.netCents ?? mrrCents,
      mrrDelta: null as number | null,
      totalRevenueCents: earnings?.grossCents ?? mrrCents,
      totalRevenueDelta: null as number | null,
    };
  }, [earnings?.grossCents, earnings?.netCents, liveRows, subs, useDemo]);

  const openCreate = () => {
    if (useDemo) {
      toast.message('Sample preview', {
        description:
          'You can explore the create form; publishing requires leaving demo (add a real product or use ?demo=0).',
      });
    }
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = (row: LiveProduct | DemoProductRow) => {
    if (useDemo || isCreatorProductsDemoId(row.id)) {
      toast.message('Sample preview data', {
        description: 'Edit is available for live products only.',
      });
      return;
    }
    const live = row as LiveProduct;
    setFormInitial({
      id: live.id,
      name: live.name,
      shortDescription: live.shortDescription,
      description: live.description,
      priceCents: live.priceCents,
      billingPeriod: live.billingPeriod,
      isFeatured: live.isFeatured,
      isActive: live.isActive,
      isLimited: live.isLimited,
      isClosed: live.isClosed,
      maxSpots: live.maxSpots,
      imageStorageId: live.imageStorageId,
    });
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId || isCreatorProductsDemoId(deleteId) || useDemo) {
      toast.message('Sample preview data');
      setDeleteId(null);
      return;
    }
    setDeleting(true);
    try {
      await removeProduct({ productId: deleteId as Id<'products'> });
      toast.success('Product deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
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
        <p className="text-support text-muted-foreground">Creator profile not found.</p>
      </DashboardLayout>
    );
  }

  if (formOpen) {
    return (
      <DashboardLayout type="creator">
        <CreateProductForm
          creatorId={creator._id}
          creatorName={creator.displayName || creator.username || 'Creator'}
          creatorAvatarUrl={null}
          initial={formInitial}
          demoMode={useDemo}
          onCancel={() => {
            setFormOpen(false);
            setFormInitial(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setFormInitial(null);
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="type-page-title text-foreground md:text-[2.75rem] md:leading-[1.1]">
            Products
          </h1>
          <p className="mt-3 max-w-2xl text-body font-medium text-muted-foreground">
            Create and manage your subscriptions, memberships, and digital products.
          </p>
        </div>
        <Button
          type="button"
          className="h-12 w-full shrink-0 gap-2 rounded-[var(--radius-md)] px-6 sm:mt-1 sm:w-auto"
          onClick={openCreate}
        >
          <Plus className="h-5 w-5" aria-hidden />
          Create Product
        </Button>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — metrics and table rows are mock content. Add a real product to
            replace them, or use <span className="font-mono text-xs">?demo=0</span> for the empty
            state.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total products',
              value: String(metrics.totalProducts),
              icon: Package,
              iconClassName: kpiIconTone.violet,
              trendLabel: formatSignedPct(metrics.totalProductsDelta),
              trendPositive: (metrics.totalProductsDelta ?? 0) > 0,
            },
            {
              label: 'Total subscribers',
              value: metrics.totalSubscribers.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.sky,
              trendLabel: formatSignedPct(metrics.totalSubscribersDelta),
              trendPositive: (metrics.totalSubscribersDelta ?? 0) > 0,
              href: '/creator/subscribers',
            },
            {
              label: 'Monthly revenue (MRR)',
              value: formatMoneyCents(metrics.mrrCents),
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel: formatSignedPct(metrics.mrrDelta),
              trendPositive: (metrics.mrrDelta ?? 0) > 0,
              href: '/creator/earnings',
            },
            {
              label: 'Total revenue',
              value: formatMoneyCents(metrics.totalRevenueCents),
              icon: BarChart3,
              iconClassName: kpiIconTone.amber,
              trendLabel: formatSignedPct(metrics.totalRevenueDelta),
              trendPositive: (metrics.totalRevenueDelta ?? 0) > 0,
              href: '/creator/earnings',
            },
          ]}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className={cn(segmentedTrackClassName, 'flex w-full flex-nowrap xl:w-auto')}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(segmentedItemClassName(tab === t.id), 'flex-1 xl:flex-none')}
              onClick={() => {
                setTab(t.id);
                setTablePage(0);
              }}
            >
              {t.label} ({tabCounts[t.id]})
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setTablePage(0);
              }}
              placeholder="Search products..."
              className="h-11 rounded-xl ps-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setTablePage(0);
            }}
          >
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-semibold text-foreground">
              {tableRows.length === 0 ? 'No products yet' : 'No products match'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tableRows.length === 0
                ? 'Create your first product to start selling.'
                : 'Try another tab, status, or search.'}
            </p>
            {tableRows.length === 0 ? (
              <Button
                type="button"
                className="mt-5 h-12 gap-2 rounded-[var(--radius-md)] px-6"
                onClick={openCreate}
              >
                <Plus className="h-5 w-5" aria-hidden />
                Create Product
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={pageAllSelected}
                      onCheckedChange={(v) => toggleSelectAllPage(v === true)}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">Subscribers</TableHead>
                  <TableHead className="hidden lg:table-cell">Revenue (MRR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                  const Icon = productIcon(
                    row.name,
                    row.type,
                    'isFeatured' in row ? row.isFeatured : row.name.includes('Premium'),
                  );
                  const revenue =
                    'revenueMrrCents' in row
                      ? row.revenueMrrCents
                      : row.type === 'one-time'
                        ? 0
                        : row.subscribers * row.priceCents;
                  const subsLabel =
                    row.subscribersLabel ??
                    (row.type === 'one-time'
                      ? `${row.subscribers} purchases`
                      : String(row.subscribers));
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(v) => toggleSelectOne(row.id, v === true)}
                          aria-label={`Select ${row.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                              iconTone(Icon),
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground">{row.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.description || '—'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                            typePillClass[row.type],
                          )}
                        >
                          {typeLabel[row.type]}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {formatProductPrice(row.priceCents, row.billingPeriod)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">
                        {subsLabel}
                      </TableCell>
                      <TableCell className="hidden font-semibold tabular-nums lg:table-cell">
                        {row.type === 'one-time' ? '—' : formatMoneyCents(revenue)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                            statusPillClass[row.status],
                          )}
                        >
                          {statusLabel[row.status]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground xl:table-cell">
                        {format(row.createdAtMs, 'MMM d, yyyy, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(row)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(row.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {filtered.length} products
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
                {Array.from({ length: pageCount }, (_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant={i === safePage ? 'default' : 'outline'}
                    className="h-9 min-w-9 px-2"
                    onClick={() => setTablePage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
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

      {!bundleDismissed ? (
        <section className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            onClick={() => {
              safeSetItem(BUNDLE_BANNER_KEY, '1');
              setBundleDismissed(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 items-start gap-3 pr-8 sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Gift className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold tracking-tight text-foreground">
                Create a bundle and increase your revenue.
              </p>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                Combine multiple products and offer them at a discounted price.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="h-12 w-full shrink-0 gap-2 rounded-[var(--radius-md)] px-6 sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-5 w-5" aria-hidden />
            Create Bundle
          </Button>
        </section>
      ) : null}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent
          overlayClassName="bg-black/50"
          className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)] sm:rounded-2xl"
        >
          <AlertDialogHeader className="space-y-3 px-5 pb-2 pt-5 text-left sm:px-6 sm:pt-6">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  kpiIconTone.rose,
                )}
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Products
                </p>
                <AlertDialogTitle className="mt-1 text-heading font-bold tracking-tight">
                  Delete this product?
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1.5 text-support text-muted-foreground">
                  This removes the product listing from your storefront. Existing subscribers keep
                  access and are not automatically refunded.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:space-x-0 sm:gap-2 sm:px-6">
            <AlertDialogCancel disabled={deleting} className="mt-0 min-h-11 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="min-h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

export default CreatorProducts;
