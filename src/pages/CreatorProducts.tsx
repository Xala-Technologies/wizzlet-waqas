import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gem,
  Lightbulb,
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import { kpiIconTone } from '@/lib/kpiIconTones';
import {
  CREATOR_PRODUCTS_DEMO_PLANS,
  CREATOR_PRODUCTS_DEMO_ROWS,
  formatProductPrice,
  isCreatorProductsDemoId,
  shouldUseCreatorProductsDemo,
  type DemoPlanCard,
  type DemoProductRow,
  type ProductBillingType,
} from '@/lib/creatorProductsDemo';

const TABLE_PAGE = 6;

type TypeFilter = 'all' | ProductBillingType;

type LiveProduct = {
  id: string;
  name: string;
  description: string;
  type: ProductBillingType;
  billingPeriod: string;
  priceCents: number;
  subscribers: number;
  status: 'active' | 'inactive';
  createdAtMs: number;
  isFeatured: boolean;
  maxSpots?: number | null;
  isLimited: boolean;
  isClosed: boolean;
};

function productIcon(name: string, type: ProductBillingType, featured: boolean) {
  const n = name.toLowerCase();
  if (n.includes('vip') || n.includes('diamond')) return Gem;
  if (n.includes('premium') || featured || n.includes('star')) return Star;
  if (n.includes('ebook') || n.includes('guide') || n.includes('book')) return BookOpen;
  if (n.includes('video') || n.includes('course')) return Video;
  if (n.includes('community') || (type === 'subscription' && n.includes('private'))) return Users;
  return Crown;
}

function iconTone(Icon: typeof Crown): string {
  if (Icon === Gem) return kpiIconTone.rose;
  if (Icon === Star) return kpiIconTone.amber;
  if (Icon === BookOpen) return kpiIconTone.sky;
  if (Icon === Video) return kpiIconTone.violet;
  if (Icon === Users) return kpiIconTone.emerald;
  return kpiIconTone.violet;
}

function defaultFeatures(name: string, popular: boolean): string[] {
  if (popular) {
    return [
      'Everything in core plan',
      'Exclusive picks',
      'Early releases',
      'Priority support',
      'Weekly strategy notes',
    ];
  }
  if (name.toLowerCase().includes('vip')) {
    return [
      'Everything in Premium',
      '1-on-1 chat (limited)',
      'VIP community',
      'Custom unit sizes',
      'Private Discord role',
    ];
  }
  return [
    'Access to all picks',
    'Daily write-ups',
    'Cancel anytime',
    'Mobile notifications',
    'Community chat',
  ];
}

const CreatorProducts = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const creator = useQuery(api.creators.queries.myCreator);
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const upsertProduct = useMutation(api.products.mutations.upsert);
  const removeProduct = useMutation(api.products.mutations.remove);

  const loading = creator === undefined || (creator && products === undefined);

  const subCountByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs ?? []) {
      if (s.status !== 'active' || !s.productId) continue;
      map.set(s.productId, (map.get(s.productId) ?? 0) + 1);
    }
    return map;
  }, [subs]);

  const liveRows: LiveProduct[] = useMemo(() => {
    return (products ?? []).map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description ?? '',
      type: p.billingPeriod === 'one-time' ? 'one-time' : 'subscription',
      billingPeriod: p.billingPeriod,
      priceCents: p.priceCents,
      subscribers: subCountByProduct.get(p._id) ?? 0,
      status: p.isActive && !p.isClosed ? 'active' : 'inactive',
      createdAtMs: p.createdAt,
      isFeatured: p.isFeatured,
      maxSpots: p.maxSpots,
      isLimited: p.isLimited,
      isClosed: p.isClosed,
    }));
  }, [products, subCountByProduct]);

  const useDemo = shouldUseCreatorProductsDemo({
    count: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const planCards: DemoPlanCard[] = useMemo(() => {
    if (useDemo) return CREATOR_PRODUCTS_DEMO_PLANS;
    const subsOnly = liveRows
      .filter((p) => p.type === 'subscription' && p.status === 'active')
      .sort((a, b) => a.priceCents - b.priceCents)
      .slice(0, 3);
    return subsOnly.map((p, i) => ({
      id: p.id,
      name: p.name,
      priceLabel: formatProductPrice(p.priceCents, p.billingPeriod),
      priceCents: p.priceCents,
      billingPeriod: p.billingPeriod,
      popular: p.isFeatured || i === 1,
      features: defaultFeatures(p.name, p.isFeatured || i === 1),
    }));
  }, [liveRows, useDemo]);

  const tableRows: Array<LiveProduct | DemoProductRow> = useDemo
    ? CREATOR_PRODUCTS_DEMO_ROWS
    : liveRows;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [tablePage, setTablePage] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('9.99');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [isFeatured, setIsFeatured] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tableRows.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [tableRows, search, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * TABLE_PAGE, safePage * TABLE_PAGE + TABLE_PAGE);
  const showingFrom = filtered.length === 0 ? 0 : safePage * TABLE_PAGE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * TABLE_PAGE);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('9.99');
    setBillingPeriod('monthly');
    setIsFeatured(false);
    setEditingId(null);
  };

  const openCreate = () => {
    if (useDemo) {
      toast.message('Sample preview', {
        description: 'Create a real product after leaving demo mode — or add products on an empty account with ?demo=0 then Add Product.',
      });
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (row: LiveProduct | DemoProductRow) => {
    if (useDemo || isCreatorProductsDemoId(row.id)) {
      toast.message('Sample preview data', {
        description: 'Edit is available for live products only.',
      });
      return;
    }
    const live = row as LiveProduct;
    setEditingId(live.id);
    setName(live.name);
    setDescription(live.description);
    setPrice((live.priceCents / 100).toFixed(2));
    setBillingPeriod(live.billingPeriod);
    setIsFeatured(live.isFeatured);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (useDemo || (editingId && isCreatorProductsDemoId(editingId))) {
      toast.message('Sample preview — create real products when not in demo mode');
      return;
    }
    if (!creator?._id) {
      toast.error('Creator profile not ready');
      return;
    }
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const numPrice = parseFloat(price);
    if (Number.isNaN(numPrice) || numPrice <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSaving(true);
    try {
      const existing = editingId
        ? liveRows.find((p) => p.id === editingId)
        : undefined;
      await upsertProduct({
        productId: editingId ? (editingId as Id<'products'>) : undefined,
        creatorId: creator._id,
        name: name.trim(),
        description: description.trim() || undefined,
        priceCents: Math.round(numPrice * 100),
        billingPeriod,
        isFeatured,
        isActive: true,
        isLimited: existing?.isLimited ?? false,
        isClosed: existing?.isClosed ?? false,
        maxSpots: existing?.maxSpots ?? undefined,
      });
      toast.success(editingId ? 'Product updated' : 'Product created');
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
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

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Your Products
          </h1>
          <p className="mt-1.5 max-w-xl text-support text-muted-foreground">
            Set up and manage your subscription plans. Turn your expertise into recurring revenue.
          </p>
        </div>
        <Button type="button" className="min-h-11 shrink-0 rounded-xl" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Product
        </Button>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — plans and table rows are mock content. Add a real product to replace
            them, or use <span className="font-mono text-xs">?demo=0</span> for the empty state.
          </p>
        </div>
      ) : null}

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {planCards.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              'relative flex h-full flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]',
              plan.popular
                ? 'border-primary/50 ring-1 ring-primary/25'
                : 'border-border',
            )}
          >
            {plan.popular ? (
              <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-primary-foreground">
                <Star className="h-3 w-3" aria-hidden />
                Most Popular
              </span>
            ) : null}
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">{plan.name}</h3>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
              {plan.priceLabel}
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-5 min-h-11 w-full rounded-xl"
              onClick={() => {
                const row = tableRows.find((r) => r.id === plan.id || r.name === plan.name);
                if (row) openEdit(row);
                else openCreate();
              }}
            >
              Edit Plan
            </Button>
          </article>
        ))}

        <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-foreground">
            Create a Product.
            <br />
            Grow Your Community.
          </h3>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Flexible pricing
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Easy setup
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Recurring revenue
            </li>
          </ul>
          <Button type="button" variant="outline" className="mt-5 min-h-11 w-full rounded-xl" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Product
          </Button>
        </article>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/creator/access-control"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
        >
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kpiIconTone.rose)}>
            <Lock className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-foreground">Access & capacity</h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cap subscriber spots, close sales to new buyers, and keep existing members.
            </p>
          </div>
        </Link>
        <Link
          to="/creator/smart-pricing"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
        >
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kpiIconTone.amber)}>
            <Lightbulb className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-foreground">List price guidance</h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Heuristic tips for your featured monthly price — sellable tiers still edit here.
            </p>
          </div>
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">All Products</h2>
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
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as TypeFilter);
                setTablePage(0);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-foreground">No products match</p>
            <p className="mt-1 text-sm text-muted-foreground">Try another search or type filter.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
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
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              iconTone(Icon),
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{row.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.description || '—'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                            row.type === 'subscription'
                              ? 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                              : 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
                          )}
                        >
                          {row.type === 'subscription' ? 'Subscription' : 'One-time'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {formatProductPrice(row.priceCents, row.billingPeriod)}
                      </TableCell>
                      <TableCell className="tabular-nums">{row.subscribers}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                            row.status === 'active'
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
                              : 'border-border bg-muted text-muted-foreground',
                          )}
                        >
                          {row.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-support text-muted-foreground">
                        {format(row.createdAtMs, 'MMM d, yyyy')}
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
              <p className="text-support text-muted-foreground">
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
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent
          overlayClassName="bg-black/50"
          className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)] sm:max-w-lg sm:rounded-2xl"
        >
          <DialogHeader className="space-y-3 border-b border-border px-5 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
            <div className="flex items-start gap-3 pr-8">
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  isFeatured ? kpiIconTone.amber : kpiIconTone.violet,
                )}
              >
                {isFeatured ? (
                  <Star className="h-5 w-5" aria-hidden />
                ) : (
                  <Crown className="h-5 w-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Products
                </p>
                <DialogTitle className="mt-1 text-heading font-bold tracking-tight">
                  {editingId ? 'Edit Product' : 'Add Product'}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-support text-muted-foreground">
                  {editingId
                    ? 'Update pricing and details for this plan on your storefront.'
                    : 'Create a subscription or one-time offer. Turn expertise into revenue.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div
              className={cn(
                'relative rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]',
                isFeatured ? 'border-primary/50 ring-1 ring-primary/25' : 'border-border',
              )}
            >
              {isFeatured ? (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-primary-foreground">
                  <Star className="h-3 w-3" aria-hidden />
                  Most Popular
                </span>
              ) : null}
              <p className="text-lg font-extrabold tracking-tight text-foreground">
                {name.trim() || 'Untitled plan'}
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                {formatProductPrice(
                  Math.round((Number.parseFloat(price) || 0) * 100),
                  billingPeriod,
                )}
              </p>
              {description.trim() ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{description.trim()}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Preview updates as you type.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Plan"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-desc">Description</Label>
              <Textarea
                id="product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What subscribers get…"
                rows={3}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (USD)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Billing</Label>
                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Featured / Most Popular</p>
                <p className="text-xs text-muted-foreground">Highlighted on your storefront</p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:space-x-0 sm:gap-2 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              disabled={saving}
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
