import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  Loader2,
  MoreVertical,
  MousePointerClick,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
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
  CREATOR_LINKS_DEMO_METRICS,
  CREATOR_LINKS_DEMO_ROWS,
  CREATOR_LINKS_DEMO_TOP,
  CREATOR_LINKS_TIPS,
  isCreatorLinksDemoId,
  shouldUseCreatorLinksDemo,
  type DemoCreatorLink,
  type DemoLinkStatus,
} from '@/lib/creatorLinksDemo';
import { copyToClipboard } from '@/lib/clipboard';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type TableRowModel = DemoCreatorLink & {
  isDemo: boolean;
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function statusTone(status: DemoLinkStatus): string {
  if (status === 'active') return resultPillTone.active;
  return resultPillTone.pending;
}

function destinationHost(raw: string): string {
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).host;
  } catch {
    return raw.length > 28 ? `${raw.slice(0, 28)}…` : raw;
  }
}

function shortSlugFromLive(id: string, name: string): string {
  const fromName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 12);
  if (fromName.length >= 2) return fromName;
  return id.slice(-6);
}

function shortPath(row: Pick<TableRowModel, 'id' | 'shortSlug' | 'isDemo'>): string {
  if (row.isDemo || row.shortSlug) return `/go/${row.shortSlug || row.id}`;
  return `/go/${row.id}`;
}

const CreatorLinks = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const links = useQuery(api.creators.growth.listMyLinks);
  const upsertLink = useMutation(api.creators.growth.upsertLink);
  const removeLink = useMutation(api.creators.growth.removeLink);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tablePage, setTablePage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading = creatorLoading || links === undefined;
  const liveRows = links ?? [];

  const useDemo = shouldUseCreatorLinksDemo({
    count: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const rows: TableRowModel[] = useMemo(() => {
    if (useDemo) {
      return CREATOR_LINKS_DEMO_ROWS.map((r) => ({ ...r, isDemo: true }));
    }
    return liveRows.map((l) => ({
      id: l._id,
      name: l.name,
      shortSlug: shortSlugFromLive(l._id, l.name),
      url: l.url,
      clicks: l.clicks,
      signUps: l.conversions,
      conversions: l.conversions,
      revenueCents: 0,
      status: 'active' as const,
      isDemo: false,
    }));
  }, [useDemo, liveRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        r.shortSlug.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);

  const metrics = useDemo
    ? CREATOR_LINKS_DEMO_METRICS
    : {
        totalClicks: rows.reduce((sum, r) => sum + r.clicks, 0),
        totalClicksDelta: null as number | null,
        signUps: rows.reduce((sum, r) => sum + r.signUps, 0),
        signUpsDelta: null as number | null,
        paidConversions: rows.reduce((sum, r) => sum + r.conversions, 0),
        paidConversionsDelta: null as number | null,
        revenueCents: 0,
        revenueDelta: null as number | null,
        dateRangeLabel: 'Last 30 days',
      };

  const topLinks = useMemo(() => {
    if (useDemo) return [...CREATOR_LINKS_DEMO_TOP];
    return [...rows]
      .sort((a, b) => b.clicks - a.clicks || b.revenueCents - a.revenueCents)
      .slice(0, 5)
      .map((r, i) => ({
        rank: i + 1,
        name: r.name,
        shortSlug: r.shortSlug,
        clicks: r.clicks,
        revenueCents: r.revenueCents,
      }));
  }, [useDemo, rows]);

  const deleteTarget = rows.find((r) => r.id === deleteId);

  const trackingUrl = (row: TableRowModel) => {
    if (row.isDemo || isCreatorLinksDemoId(row.id)) {
      return `${window.location.origin}/go/${row.shortSlug || row.id}`;
    }
    return `${window.location.origin}/go/${row.id}`;
  };

  const reviewName = name.trim() || 'Untitled link';
  const reviewHost = destinationHost(url.trim() || 'https://…');

  const handleCreate = async () => {
    if (!creator || saving) return;
    if (!name.trim() || !url.trim()) {
      toast.error('Fill in all fields');
      return;
    }
    if (useDemo) {
      toast.message('Sample preview — link not created', {
        description: 'Add a real tracking link when you leave demo mode (?demo=0).',
      });
      setName('');
      setUrl('');
      setCreateOpen(false);
      return;
    }
    setSaving(true);
    try {
      await upsertLink({ name: name.trim(), url: url.trim() });
      setName('');
      setUrl('');
      setCreateOpen(false);
      toast.success('Tracking link created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (useDemo || isCreatorLinksDemoId(deleteId)) {
      toast.message('Sample preview — link not deleted', {
        description: 'Demo rows are mock content for design review.',
      });
      setDeleteId(null);
      return;
    }
    setDeleting(true);
    try {
      await removeLink({ linkId: deleteId as Id<'creatorLinks'> });
      toast.success('Link deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete link');
    } finally {
      setDeleting(false);
    }
  };

  const copyTracking = async (row: TableRowModel) => {
    if (row.isDemo || isCreatorLinksDemoId(row.id)) {
      toast.message('Sample preview — copy uses a demo path', {
        description: 'Live /go/… URLs appear when you create real links.',
      });
    }
    const ok = await copyToClipboard(trackingUrl(row));
    if (ok) toast.success('Tracking link copied');
    else toast.error('Could not copy — try selecting the text manually');
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
          <h1 className="text-heading font-bold tracking-tight text-foreground">Links</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Create and manage trackable links to share your content anywhere.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Link2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to create trackable links.
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
      <header className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="type-page-title text-foreground md:text-[2.75rem] md:leading-[1.1]">
            Links
          </h1>
          <p className="mt-3 max-w-2xl text-body font-medium text-muted-foreground">
            Create and manage trackable links to share your content anywhere.
          </p>
        </div>
        <Button
          type="button"
          className="h-12 w-full shrink-0 gap-2 rounded-[var(--radius-md)] px-6 sm:mt-1 sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-5 w-5" aria-hidden />
          Create Link
        </Button>
      </header>

      <MarketingSubnav active="links" />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — links and KPIs are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total clicks',
              value: metrics.totalClicks.toLocaleString(),
              icon: MousePointerClick,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.totalClicksDelta != null ? `↑ ${metrics.totalClicksDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Sign ups from links',
              value: metrics.signUps.toLocaleString(),
              icon: UserPlus,
              iconClassName: kpiIconTone.sky,
              trendLabel:
                metrics.signUpsDelta != null ? `↑ ${metrics.signUpsDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Paid conversions',
              value: metrics.paidConversions.toLocaleString(),
              icon: TrendingUp,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.paidConversionsDelta != null
                  ? `↑ ${metrics.paidConversionsDelta}%`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Revenue from links',
              value:
                useDemo || metrics.revenueCents > 0 ? money(metrics.revenueCents) : '—',
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.revenueDelta != null ? `↑ ${metrics.revenueDelta}%` : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:col-span-8">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">All links</h2>
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {metrics.dateRangeLabel}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTablePage(0);
                  }}
                  placeholder="Search links…"
                  className="h-11 min-h-11 rounded-xl pl-9"
                  aria-label="Search links"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="min-h-11 w-full rounded-xl sm:w-[9.5rem]" aria-label="Type filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="bio">Bio</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger
                  className="min-h-11 w-full rounded-xl sm:w-[10rem]"
                  aria-label="Product filter"
                >
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="NBA Picks">NBA Picks</SelectItem>
                  <SelectItem value="VIP Access">VIP Access</SelectItem>
                  <SelectItem value="Premium Picks">Premium Picks</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setTablePage(0);
                }}
              >
                <SelectTrigger
                  className="min-h-11 w-full rounded-xl sm:w-[9.5rem]"
                  aria-label="Status filter"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-14 text-center sm:px-5">
              <Link2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-ui font-semibold text-foreground">No links found</p>
              <p className="mt-1 text-support text-muted-foreground">
                {rows.length === 0
                  ? 'Create a trackable link to share anywhere.'
                  : 'Try a different search or filter.'}
              </p>
              {rows.length === 0 ? (
                <Button
                  type="button"
                  className="mt-4 min-h-11 rounded-xl"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Link
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[64rem]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 pl-4">
                        <Checkbox aria-label="Select all" disabled className="opacity-40" />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Short link</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Sign ups</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((row) => {
                      const path = shortPath(row);
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="pl-4">
                            <Checkbox
                              aria-label={`Select ${row.name}`}
                              disabled
                              className="opacity-40"
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{row.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-muted-foreground">{path}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                aria-label={`Copy ${path}`}
                                onClick={() => void copyTracking(row)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[10rem] truncate text-muted-foreground">
                            {destinationHost(row.url)}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {row.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {row.signUps.toLocaleString()}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {row.conversions.toLocaleString()}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {row.revenueCents > 0 ? money(row.revenueCents) : '—'}
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
                          <TableCell className="pr-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9"
                                  aria-label={`Actions for ${row.name}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => void copyTracking(row)}>
                                  Copy link
                                </DropdownMenuItem>
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-support text-muted-foreground">
                  Showing {showingFrom}–{showingTo} of {filtered.length} links
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
              Create New Link
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a short trackable URL you can share on social, email, or anywhere fans are.
            </p>
            <Button
              type="button"
              className="mt-4 min-h-11 w-full rounded-xl"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Link
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
              Top Performing Links
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {useDemo ? CREATOR_LINKS_DEMO_METRICS.dateRangeLabel : 'Last 30 days'}
            </p>
            {topLinks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No clicks yet — create a link to start ranking.
              </p>
            ) : (
              <ol className="space-y-3">
                {topLinks.map((item) => (
                  <li key={`${item.rank}-${item.name}`} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-700 dark:text-violet-400">
                      {item.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.clicks.toLocaleString()} clicks
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
              Tips for better results
            </h2>
            <ul className="space-y-2.5">
              {CREATOR_LINKS_TIPS.map((tip) => (
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

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setName('');
            setUrl('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create link</DialogTitle>
            <DialogDescription>
              Name your link and set the destination fans land on after `/go/…`.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="creator-link-name">Link name</Label>
              <Input
                id="creator-link-name"
                className="h-11 min-h-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Instagram Bio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator-link-url">Destination URL</Label>
              <Input
                id="creator-link-url"
                className="h-11 min-h-11"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-caption uppercase tracking-wider text-muted-foreground">Preview</p>
              <p className="truncate text-ui text-foreground">{reviewName}</p>
              <p className="truncate text-support text-muted-foreground">{reviewHost}</p>
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
              disabled={saving || !name.trim() || !url.trim()}
              onClick={() => void handleCreate()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create link
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
            <AlertDialogTitle>Delete this tracking link?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” and its /go/… URL will stop working. Past click counts are not rewritten.`
                : 'This tracking link will stop working. Past click counts are not rewritten.'}
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

export default CreatorLinks;
