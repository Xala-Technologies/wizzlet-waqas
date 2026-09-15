import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  UserMinus,
  Users,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import {
  CREATOR_SUBSCRIBERS_DEMO_METRICS,
  CREATOR_SUBSCRIBERS_DEMO_ROWS,
  initialsFromName,
  isCreatorSubscribersDemoId,
  shouldUseCreatorSubscribersDemo,
  type DemoSubscriberRow,
} from '@/lib/creatorSubscribersDemo';

const PAGE_SIZE = 50;
const TABLE_PAGE = 10;

type StatusTab = 'all' | 'active' | 'cancelled' | 'trial';
type UiStatus = 'active' | 'cancelled' | 'trial';
type PlanLabel = 'Premium' | 'Monthly' | 'VIP' | '—';

type Row = {
  id: string;
  name: string;
  email: string;
  plan: PlanLabel;
  status: UiStatus;
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
};

function mapPlan(amountCents: number | undefined): PlanLabel {
  if (amountCents == null) return '—';
  if (amountCents >= 5000) return 'VIP';
  if (amountCents >= 2500) return 'Premium';
  return 'Monthly';
}

function mapStatus(status: string): UiStatus {
  if (status === 'active') return 'active';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'trial';
}

function planPill(plan: PlanLabel): string {
  if (plan === 'VIP') return 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400';
  if (plan === 'Premium') return 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400';
  if (plan === 'Monthly') return 'bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-400';
  return 'bg-muted text-muted-foreground border-border';
}

function statusPill(status: UiStatus): string {
  if (status === 'active') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400';
  if (status === 'cancelled') return 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400';
  return 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400';
}

function demoToRow(d: DemoSubscriberRow): Row {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    plan: d.plan,
    status: d.status,
    joinedAtMs: d.joinedAtMs,
    renewalAtMs: d.renewalAtMs,
    totalSpentCents: d.totalSpentCents,
  };
}

const CreatorSubscribers = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const creator = useQuery(api.creators.queries.myCreator);
  const earnings = useQuery(api.creators.earnings.myEarnings);
  const { results: rowsRaw, status: pageStatus, loadMore } = usePaginatedQuery(
    api.subscriptions.mutations.listSubscribersDetailedPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const loading = pageStatus === 'LoadingFirstPage' || creator === undefined;

  const realRows: Row[] = useMemo(
    () =>
      (rowsRaw ?? []).map((s) => ({
        id: s._id,
        name: s.user?.fullName || s.user?.username || 'Subscriber',
        email: s.user?.email || '—',
        plan: mapPlan(s.amountCents),
        status: mapStatus(s.status),
        joinedAtMs: s.createdAt,
        renewalAtMs: s.currentPeriodEnd ?? null,
        totalSpentCents: s.amountCents ?? 0,
      })),
    [rowsRaw],
  );

  const useDemo = shouldUseCreatorSubscribersDemo({
    count: realRows.length,
    forceDemo,
    disableDemo,
  });

  const rows = useDemo ? CREATOR_SUBSCRIBERS_DEMO_ROWS.map(demoToRow) : realRows;

  const [tab, setTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tablePage, setTablePage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === 'active' && r.status !== 'active') return false;
      if (tab === 'cancelled' && r.status !== 'cancelled') return false;
      if (tab === 'trial' && r.status !== 'trial') return false;
      if (planFilter !== 'all' && r.plan !== planFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    });
  }, [rows, tab, search, planFilter, statusFilter]);

  const counts = useMemo(() => {
    if (useDemo) {
      return {
        all: CREATOR_SUBSCRIBERS_DEMO_METRICS.total,
        active: CREATOR_SUBSCRIBERS_DEMO_METRICS.active,
        cancelled: CREATOR_SUBSCRIBERS_DEMO_METRICS.canceled,
        trial: CREATOR_SUBSCRIBERS_DEMO_ROWS.filter((r) => r.status === 'trial').length,
      };
    }
    return {
      all: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      cancelled: rows.filter((r) => r.status === 'cancelled').length,
      trial: rows.filter((r) => r.status === 'trial').length,
    };
  }, [rows, useDemo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * TABLE_PAGE, safePage * TABLE_PAGE + TABLE_PAGE);

  const metrics = useDemo
    ? CREATOR_SUBSCRIBERS_DEMO_METRICS
    : {
        total: counts.all,
        totalDelta: null as number | null,
        active: counts.active,
        activeDelta: null as number | null,
        canceled: counts.cancelled,
        canceledDelta: null as number | null,
        mrrCents: earnings?.grossCents ?? 0,
        mrrDelta: null as number | null,
      };

  const profileReady = Boolean(creator?.username && creator.isPublished);
  const emptyCtaHref = profileReady
    ? creatorProfilePath(creator!.username)
    : creator
      ? '/creator/settings'
      : '/creator/onboarding';

  const exportCsv = () => {
    const header = 'Name,Email,Plan,Status,Joined,Renewal,TotalSpent\n';
    const body = filtered
      .map((r) =>
        [
          r.name,
          r.email,
          r.plan,
          r.status,
          format(r.joinedAtMs, 'yyyy-MM-dd'),
          r.renewalAtMs ? format(r.renewalAtMs, 'yyyy-MM-dd') : '',
          (r.totalSpentCents / 100).toFixed(2),
        ].join(','),
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported subscribers CSV');
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

  const tabs: { id: StatusTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'cancelled', label: 'Canceled', count: counts.cancelled },
    { id: 'trial', label: 'Trial', count: counts.trial },
  ];

  const showingFrom = filtered.length === 0 ? 0 : safePage * TABLE_PAGE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * TABLE_PAGE);

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Your Subscribers
          </h1>
          <p className="mt-1.5 max-w-xl text-support text-muted-foreground">
            Manage your subscribers, view their activity and grow your community.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-xl"
            onClick={() =>
              toast.message('Invite subscribers', {
                description: 'Share your public profile link to grow your list.',
              })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Subscriber
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — not live subscribers. Publish your profile and get real signups to
            replace this, or add <span className="font-mono text-xs">?demo=0</span> for the empty state.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total Subscribers',
              value: String(metrics.total),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel: metrics.totalDelta != null ? `↑ ${Math.abs(metrics.totalDelta)}%` : undefined,
              trendPositive: (metrics.totalDelta ?? 0) >= 0,
            },
            {
              label: 'Active Subscribers',
              value: String(metrics.active),
              icon: Crown,
              iconClassName: kpiIconTone.sky,
              trendLabel: metrics.activeDelta != null ? `↑ ${Math.abs(metrics.activeDelta)}%` : undefined,
              trendPositive: (metrics.activeDelta ?? 0) >= 0,
            },
            {
              label: 'Canceled Subscribers',
              value: String(metrics.canceled),
              icon: UserMinus,
              iconClassName: kpiIconTone.rose,
              trendLabel:
                metrics.canceledDelta != null
                  ? `${metrics.canceledDelta < 0 ? '↓' : '↑'} ${Math.abs(metrics.canceledDelta)}%`
                  : undefined,
              trendPositive: (metrics.canceledDelta ?? 0) <= 0,
            },
            {
              label: 'Monthly Revenue',
              value: `$${((metrics.mrrCents ?? 0) / 100).toLocaleString()}`,
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel: metrics.mrrDelta != null ? `↑ ${Math.abs(metrics.mrrDelta)}%` : undefined,
              trendPositive: (metrics.mrrDelta ?? 0) >= 0,
            },
          ]}
        />
      </div>

      {!useDemo && rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No subscribers yet</h3>
          <p className="mx-auto mb-5 max-w-sm text-support text-muted-foreground">
            Share your profile link to attract subscribers.
          </p>
          <Button asChild className="min-h-11">
            <Link to={emptyCtaHref}>{profileReady ? 'View your profile' : 'Set up your profile'}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className={cn(segmentedTrackClassName, 'w-full overflow-x-auto xl:w-auto')}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={segmentedItemClassName(tab === t.id)}
                  onClick={() => {
                    setTab(t.id);
                    setTablePage(0);
                  }}
                >
                  {t.label} ({t.count})
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
                  placeholder="Search subscribers..."
                  className="h-11 rounded-xl ps-9"
                />
              </div>
              <Select
                value={planFilter}
                onValueChange={(v) => {
                  setPlanFilter(v);
                  setTablePage(0);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl sm:w-[140px]">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setTablePage(0);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Canceled</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const r of pageRows) {
                            if (v === true) next.add(r.id);
                            else next.delete(r.id);
                          }
                          return next;
                        });
                      }}
                      aria-label="Select page"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(v) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(row.id);
                            else next.delete(row.id);
                            return next;
                          });
                        }}
                        aria-label={`Select ${row.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-700 dark:text-violet-300">
                          {initialsFromName(row.name)}
                        </span>
                        <span className="font-semibold text-foreground">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-support text-muted-foreground">{row.email}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                          planPill(row.plan),
                        )}
                      >
                        {row.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                          statusPill(row.status),
                        )}
                      >
                        {row.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {row.status === 'cancelled' ? 'Canceled' : row.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-support text-muted-foreground">
                      {format(row.joinedAtMs, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-support text-muted-foreground">
                      {row.renewalAtMs ? format(row.renewalAtMs, 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      ${(row.totalSpentCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              if (isCreatorSubscribersDemoId(row.id) || useDemo) {
                                toast.message('Sample preview data');
                                return;
                              }
                              toast.message(row.email);
                            }}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.message('Message', {
                                description: 'Open Messages to chat with subscribers.',
                              })
                            }
                          >
                            Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-support text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {filtered.length} subscribers
              </p>
              <div className="flex flex-wrap items-center gap-1">
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
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i).map((i) => (
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
                {!useDemo && (pageStatus === 'CanLoadMore' || pageStatus === 'LoadingMore') ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-1 min-h-9"
                    disabled={pageStatus === 'LoadingMore'}
                    onClick={() => loadMore(PAGE_SIZE)}
                  >
                    {pageStatus === 'LoadingMore' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default CreatorSubscribers;
