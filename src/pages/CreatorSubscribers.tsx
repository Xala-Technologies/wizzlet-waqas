import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  ExternalLink,
  Loader2,
  MessageSquare,
  MoreVertical,
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
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import { copyToClipboard } from '@/lib/clipboard';
import {
  CREATOR_SUBSCRIBERS_DEMO_METRICS,
  CREATOR_SUBSCRIBERS_DEMO_ROWS,
  initialsFromName,
  isCreatorSubscribersDemoId,
  shouldUseCreatorSubscribersDemo,
  type DemoSubscriberRow,
} from '@/lib/creatorSubscribersDemo';
import { SubscriberDetailDialog } from '@/components/creator/SubscriberDetailDialog';

const PAGE_SIZE = 50;
const TABLE_PAGE = 10;

type StatusTab = 'all' | 'active' | 'cancelled' | 'trial';
type UiStatus = 'active' | 'cancelled' | 'trial';
type PlanLabel = 'Premium' | 'Monthly' | 'VIP' | '—';
type SortKey = 'newest' | 'oldest' | 'spent';

type Row = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  plan: PlanLabel;
  status: UiStatus;
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
  avatarUrl: string | null;
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

function planTone(plan: PlanLabel): string {
  if (plan === 'VIP') return resultPillTone.vip;
  if (plan === 'Premium') return resultPillTone.premium;
  if (plan === 'Monthly') return resultPillTone.monthly;
  return 'bg-muted text-muted-foreground border-border';
}

function statusTone(status: UiStatus): string {
  if (status === 'active') return resultPillTone.active;
  if (status === 'cancelled') return resultPillTone.cancelled;
  return resultPillTone.trial;
}

function avatarTone(plan: PlanLabel): string {
  if (plan === 'VIP') return kpiIconTone.rose;
  if (plan === 'Premium') return kpiIconTone.sky;
  if (plan === 'Monthly') return kpiIconTone.violet;
  return kpiIconTone.amber;
}

function demoToRow(d: DemoSubscriberRow): Row {
  return {
    id: d.id,
    userId: null,
    name: d.name,
    email: d.email,
    plan: d.plan,
    status: d.status,
    joinedAtMs: d.joinedAtMs,
    renewalAtMs: d.renewalAtMs,
    totalSpentCents: d.totalSpentCents,
    avatarUrl: d.avatarUrl,
  };
}

function trendLabel(delta: number | null | undefined): string | undefined {
  if (delta == null) return undefined;
  const arrow = delta < 0 ? '↓' : '↑';
  return `${arrow} ${Math.abs(delta)}%`;
}

const CreatorSubscribers = () => {
  const navigate = useNavigate();
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
        userId: s.userId ?? s.user?._id ?? null,
        name: s.user?.fullName || s.user?.username || 'Subscriber',
        email: s.user?.email || '—',
        plan: mapPlan(s.amountCents),
        status: mapStatus(s.status),
        joinedAtMs: s.createdAt,
        renewalAtMs: s.currentPeriodEnd ?? null,
        totalSpentCents: s.amountCents ?? 0,
        avatarUrl: s.user?.image ?? null,
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
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [tablePage, setTablePage] = useState(0);
  const [detailRow, setDetailRow] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (tab === 'active' && r.status !== 'active') return false;
      if (tab === 'cancelled' && r.status !== 'cancelled') return false;
      if (tab === 'trial' && r.status !== 'trial') return false;
      if (planFilter !== 'all' && r.plan !== planFilter) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sortKey === 'oldest') return a.joinedAtMs - b.joinedAtMs;
      if (sortKey === 'spent') return b.totalSpentCents - a.totalSpentCents;
      return b.joinedAtMs - a.joinedAtMs;
    });
    return list;
  }, [rows, tab, search, planFilter, sortKey]);

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

  const profileUrl =
    typeof window !== 'undefined' && creator?.username
      ? `${window.location.origin}${creatorProfilePath(creator.username)}`
      : null;

  const shareProfile = async () => {
    if (!profileReady || !profileUrl) {
      navigate(emptyCtaHref);
      return;
    }
    const ok = await copyToClipboard(profileUrl);
    if (ok) toast.success('Profile link copied');
    else toast.error('Could not copy — open your profile instead');
  };

  const openMessage = (row: Row) => {
    if (useDemo || isCreatorSubscribersDemoId(row.id) || !row.userId) {
      toast.message('Sample preview', {
        description: 'Messaging works with live subscribers. Open Messages to chat.',
      });
      navigate('/creator/messages');
      return;
    }
    navigate(`/creator/messages?subscriberId=${encodeURIComponent(row.userId)}`);
  };

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
            Manage your audience, track renewals, and grow recurring revenue.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button type="button" className="min-h-11 rounded-xl" onClick={() => void shareProfile()}>
            {profileReady ? (
              <>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Share profile
              </>
            ) : (
              <>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Set up profile
              </>
            )}
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

      <div className={cn(segmentedTrackClassName, "mb-6 w-full overflow-x-auto")}>
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

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: "Total subscribers",
              value: metrics.total.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel: trendLabel(metrics.totalDelta),
              trendPositive: (metrics.totalDelta ?? 0) >= 0,
            },
            {
              label: "Active",
              value: metrics.active.toLocaleString(),
              icon: Crown,
              iconClassName: kpiIconTone.sky,
              trendLabel: trendLabel(metrics.activeDelta),
              trendPositive: (metrics.activeDelta ?? 0) >= 0,
            },
            {
              label: "Canceled",
              value: String(metrics.canceled),
              icon: UserMinus,
              iconClassName: kpiIconTone.rose,
              trendLabel: trendLabel(metrics.canceledDelta),
              trendPositive: (metrics.canceledDelta ?? 0) <= 0,
            },
            {
              label: "Gross revenue",
              value: `$${((metrics.mrrCents ?? 0) / 100).toLocaleString()}`,
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel: trendLabel(metrics.mrrDelta),
              trendPositive: (metrics.mrrDelta ?? 0) >= 0,
            },
          ]}
        />
      </div>

      {!useDemo && rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <span
            className={cn(
              "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
              kpiIconTone.violet,
            )}
          >
            <Users className="h-6 w-6" aria-hidden />
          </span>
          <h3 className="mb-2 text-ui font-semibold text-foreground">No subscribers yet</h3>
          <p className="mx-auto mb-5 max-w-sm text-support text-muted-foreground">
            Share your profile link so fans can subscribe to your picks.
          </p>
          <Button asChild className="min-h-11 rounded-xl">
            <Link to={emptyCtaHref}>{profileReady ? "View your profile" : "Set up your profile"}</Link>
          </Button>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
            <div className="relative min-w-[200px] flex-1">
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
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortKey}
              onValueChange={(v) => {
                setSortKey(v as SortKey);
                setTablePage(0);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-xl sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="spent">Highest spend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-foreground">No subscribers match</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another search, plan, or status tab.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                <MobileRecordCards>
                  {pageRows.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border bg-background/60 p-4 shadow-[var(--shadow-card)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                            <AvatarFallback className={cn("text-xs font-bold", avatarTone(row.plan))}>
                              {initialsFromName(row.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{row.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailRow(row)}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMessage(row)}>Message</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-bold", planTone(row.plan))}>
                          {row.plan}
                        </span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold capitalize", statusTone(row.status))}>
                          {row.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : null}
                          {row.status === "cancelled" ? "Canceled" : row.status}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                          ${(row.totalSpentCents / 100).toFixed(2)} spent
                        </span>
                      </div>
                    </li>
                  ))}
                </MobileRecordCards>
              </div>

              <DesktopTableRegion label="Subscribers table" className="rounded-none border-0 border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Subscriber</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                      <TableHead className="hidden md:table-cell">Renewal</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
                              <AvatarFallback className={cn("text-xs font-bold", avatarTone(row.plan))}>
                                {initialsFromName(row.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{row.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-bold", planTone(row.plan))}>
                            {row.plan}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold capitalize", statusTone(row.status))}>
                            {row.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {row.status === "cancelled" ? "Canceled" : row.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-support text-muted-foreground lg:table-cell">
                          {format(row.joinedAtMs, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-support text-muted-foreground md:table-cell">
                          {row.renewalAtMs ? format(row.renewalAtMs, "MMM d, yyyy") : "—"}
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
                              <DropdownMenuItem onClick={() => setDetailRow(row)}>View details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMessage(row)}>Message</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DesktopTableRegion>

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
                      variant={i === safePage ? "default" : "outline"}
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
                  {!useDemo && (pageStatus === "CanLoadMore" || pageStatus === "LoadingMore") ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="ml-1 min-h-9"
                      disabled={pageStatus === "LoadingMore"}
                      onClick={() => loadMore(PAGE_SIZE)}
                    >
                      {pageStatus === "LoadingMore" ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Load more
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <SubscriberDetailDialog
        row={detailRow}
        open={!!detailRow}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
        onMessage={() => {
          const row = detailRow;
          setDetailRow(null);
          if (row) openMessage(row);
        }}
      />
    </DashboardLayout>
  );
};

export default CreatorSubscribers;
