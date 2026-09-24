import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Eye,
  Globe,
  Heart,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
  Package,
  Search,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  CREATOR_SUBSCRIBERS_DEMO_METRICS,
  CREATOR_SUBSCRIBERS_DEMO_ROWS,
  initialsFromName,
  isCreatorSubscribersDemoId,
  productFromAmount,
  shouldUseCreatorSubscribersDemo,
  type DemoSubscriberActivity,
  type DemoSubscriberRow,
} from '@/lib/creatorSubscribersDemo';

const PAGE_SIZE = 50;
const TABLE_PAGE = 10;

type UiStatus = 'active' | 'cancelled' | 'trial';
type StatusFilter = 'all' | UiStatus;
type SortKey = 'newest' | 'oldest' | 'spent';
type DetailTab = 'overview' | 'activity' | 'payments' | 'messages';

type Row = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  product: string;
  priceLabel: string;
  plan: 'Premium' | 'Monthly' | 'VIP' | '—';
  status: UiStatus;
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
  avatarUrl: string | null;
  country: string;
  countryFlag: string;
  paymentLast4: string | null;
  activity: DemoSubscriberActivity[];
};

function mapStatus(status: string): UiStatus {
  if (status === 'active') return 'active';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'trial';
}

function statusLabel(status: UiStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'cancelled') return 'Cancelled';
  return 'On trial';
}

function statusTone(status: UiStatus): string {
  if (status === 'active') return resultPillTone.active;
  if (status === 'cancelled') return resultPillTone.cancelled;
  return resultPillTone.trial;
}

function avatarTone(plan: Row['plan']): string {
  if (plan === 'VIP') return kpiIconTone.rose;
  if (plan === 'Premium') return kpiIconTone.sky;
  if (plan === 'Monthly') return kpiIconTone.violet;
  return kpiIconTone.amber;
}

function trendLabel(delta: number | null | undefined): string | undefined {
  if (delta == null) return undefined;
  const sign = delta > 0 ? '+' : delta < 0 ? '' : '+';
  return `${sign}${delta}% vs. last month`;
}

function demoToRow(d: DemoSubscriberRow): Row {
  return {
    id: d.id,
    userId: null,
    name: d.name,
    email: d.email,
    product: d.product,
    priceLabel: d.priceLabel,
    plan: d.plan ?? 'Premium',
    status: d.status,
    joinedAtMs: d.joinedAtMs,
    renewalAtMs: d.renewalAtMs,
    totalSpentCents: d.totalSpentCents,
    avatarUrl: d.avatarUrl,
    country: d.country,
    countryFlag: d.countryFlag,
    paymentLast4: d.paymentLast4,
    activity: d.activity,
  };
}

function activityIcon(tone: DemoSubscriberActivity['tone']) {
  if (tone === 'payment') return CreditCard;
  if (tone === 'community') return Users;
  if (tone === 'view') return Eye;
  if (tone === 'like') return Heart;
  return UserPlus;
}

const CreatorSubscribers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const queryFromUrl = searchParams.get('q') ?? '';

  const creator = useQuery(api.creators.queries.myCreator);
  const { results: rowsRaw, status: pageStatus, loadMore } = usePaginatedQuery(
    api.subscriptions.mutations.listSubscribersDetailedPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const loading = pageStatus === 'LoadingFirstPage' || creator === undefined;

  const realRows: Row[] = useMemo(
    () =>
      (rowsRaw ?? []).map((s) => {
        const mapped = productFromAmount(s.amountCents);
        return {
          id: s._id,
          userId: s.userId ?? s.user?._id ?? null,
          name: s.user?.fullName || s.user?.username || 'Subscriber',
          email: s.user?.email || '—',
          product: mapped.product,
          priceLabel: mapped.priceLabel,
          plan: mapped.plan,
          status: mapStatus(s.status),
          joinedAtMs: s.createdAt,
          renewalAtMs: s.currentPeriodEnd ?? null,
          totalSpentCents: s.amountCents ?? 0,
          avatarUrl: s.user?.image ?? null,
          country: '—',
          countryFlag: '',
          paymentLast4: null,
          activity: [],
        };
      }),
    [rowsRaw],
  );

  const useDemo = shouldUseCreatorSubscribersDemo({
    count: realRows.length,
    forceDemo,
    disableDemo,
  });

  const rows = useDemo ? CREATOR_SUBSCRIBERS_DEMO_ROWS.map(demoToRow) : realRows;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState(queryFromUrl);
  const [productFilter, setProductFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [tablePage, setTablePage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  const productsInData = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.product && r.product !== '—') set.add(r.product);
    }
    return Array.from(set).sort();
  }, [rows]);

  const countriesInData = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.country && r.country !== '—') set.add(r.country);
    }
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (productFilter !== 'all' && r.product !== productFilter) return false;
      if (countryFilter !== 'all' && r.country !== countryFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sortKey === 'oldest') return a.joinedAtMs - b.joinedAtMs;
      if (sortKey === 'spent') return b.totalSpentCents - a.totalSpentCents;
      return b.joinedAtMs - a.joinedAtMs;
    });
    return list;
  }, [rows, statusFilter, search, productFilter, countryFilter, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * TABLE_PAGE, safePage * TABLE_PAGE + TABLE_PAGE);

  useEffect(() => {
    if (pageRows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !pageRows.some((r) => r.id === selectedId)) {
      setSelectedId(pageRows[0]!.id);
      setDetailTab('overview');
    }
  }, [pageRows, selectedId]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

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

  const metrics = useDemo
    ? CREATOR_SUBSCRIBERS_DEMO_METRICS
    : {
        total: rows.length,
        totalDelta: null as number | null,
        active: rows.filter((r) => r.status === 'active').length,
        activeDelta: null as number | null,
        trial: rows.filter((r) => r.status === 'trial').length,
        trialDelta: null as number | null,
        canceled: rows.filter((r) => r.status === 'cancelled').length,
        canceledDelta: null as number | null,
      };

  const profileReady = Boolean(creator?.username && creator.isPublished);
  const emptyCtaHref = profileReady
    ? creatorProfilePath(creator!.username)
    : creator
      ? '/creator/settings'
      : '/creator/onboarding';

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

  const messageAll = () => {
    navigate('/creator/messages');
  };

  const exportCsv = () => {
    const header = 'Name,Email,Product,Status,Country,Joined,Revenue\n';
    const body = filtered
      .map((r) =>
        [
          r.name,
          r.email,
          r.product,
          statusLabel(r.status),
          r.country,
          format(r.joinedAtMs, 'yyyy-MM-dd'),
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

  const showingFrom = filtered.length === 0 ? 0 : safePage * TABLE_PAGE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * TABLE_PAGE);
  const totalForPager = useDemo ? CREATOR_SUBSCRIBERS_DEMO_METRICS.total : filtered.length;

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Subscribers
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-medium text-muted-foreground sm:text-base">
            Manage your subscribers, view their activity, and grow your community.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={messageAll}
          >
            <MessageSquare className="mr-1.5 h-4 w-4" /> Message Subscribers
          </Button>
          <Button type="button" className="h-11 rounded-xl" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — not live subscribers. Publish your profile and get real signups to
            replace this, or add <span className="font-mono text-xs">?demo=0</span> for the empty
            state.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total subscribers',
              value: metrics.total.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel: trendLabel(metrics.totalDelta),
              trendPositive: (metrics.totalDelta ?? 0) >= 0,
            },
            {
              label: 'Active subscribers',
              value: metrics.active.toLocaleString(),
              icon: CheckCircle2,
              iconClassName: kpiIconTone.emerald,
              trendLabel: trendLabel(metrics.activeDelta),
              trendPositive: (metrics.activeDelta ?? 0) >= 0,
            },
            {
              label: 'On trial',
              value: String(metrics.trial),
              icon: Clock,
              iconClassName: kpiIconTone.sky,
              trendLabel: trendLabel(metrics.trialDelta),
              trendPositive: (metrics.trialDelta ?? 0) >= 0,
            },
            {
              label: 'Cancelled',
              value: String(metrics.canceled),
              icon: UserMinus,
              iconClassName: kpiIconTone.rose,
              trendLabel: trendLabel(metrics.canceledDelta),
              trendPositive: (metrics.canceledDelta ?? 0) >= 0,
            },
          ]}
        />
      </div>

      {!useDemo && rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <span
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
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
            <Link to={emptyCtaHref}>
              {profileReady ? 'View your profile' : 'Set up your profile'}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
          <div className="xl:col-span-8">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
                <div className="relative min-w-[180px] flex-1">
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
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as StatusFilter);
                    setTablePage(0);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl sm:w-[140px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">On trial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={productFilter}
                  onValueChange={(v) => {
                    setProductFilter(v);
                    setTablePage(0);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {productsInData.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={countryFilter}
                  onValueChange={(v) => {
                    setCountryFilter(v);
                    setTablePage(0);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countriesInData.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortKey}
                  onValueChange={(v) => {
                    setSortKey(v as SortKey);
                    setTablePage(0);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl sm:w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Join date (newest)</SelectItem>
                    <SelectItem value="oldest">Join date (oldest)</SelectItem>
                    <SelectItem value="spent">Highest revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-semibold text-foreground">No subscribers match</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try another search or filter.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-4 xl:hidden">
                    <ul className="space-y-3">
                      {pageRows.map((row) => (
                        <li key={row.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(row.id);
                              setDetailTab('overview');
                            }}
                            className={cn(
                              'w-full rounded-xl border bg-background/60 p-4 text-left shadow-[var(--shadow-card)]',
                              selectedId === row.id
                                ? 'border-primary/50 ring-1 ring-primary/25'
                                : 'border-border',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="h-10 w-10 border border-border">
                                  {row.avatarUrl ? (
                                    <AvatarImage src={row.avatarUrl} alt="" />
                                  ) : null}
                                  <AvatarFallback
                                    className={cn('text-xs font-bold', avatarTone(row.plan))}
                                  >
                                    {initialsFromName(row.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-foreground">
                                    {row.countryFlag ? `${row.countryFlag} ` : ''}
                                    {row.name}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {row.email}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                                  statusTone(row.status),
                                )}
                              >
                                {statusLabel(row.status)}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                              <span>{row.product}</span>
                              <span>·</span>
                              <span className="tabular-nums">
                                ${(row.totalSpentCents / 100).toFixed(2)}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    role="region"
                    aria-label="Subscribers table"
                    className="hidden overflow-x-auto border-t border-border xl:block"
                  >
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
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead className="w-12 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageRows.map((row) => (
                          <TableRow
                            key={row.id}
                            className={cn(
                              'cursor-pointer',
                              selectedId === row.id && 'bg-primary/5',
                            )}
                            onClick={() => {
                              setSelectedId(row.id);
                              setDetailTab('overview');
                            }}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(row.id)}
                                onCheckedChange={(v) => toggleSelectOne(row.id, v === true)}
                                aria-label={`Select ${row.name}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border">
                                  {row.avatarUrl ? (
                                    <AvatarImage src={row.avatarUrl} alt="" />
                                  ) : null}
                                  <AvatarFallback
                                    className={cn('text-xs font-bold', avatarTone(row.plan))}
                                  >
                                    {initialsFromName(row.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-foreground">
                                    {row.name}
                                  </p>
                                  {row.countryFlag ? (
                                    <p className="text-xs text-muted-foreground">
                                      {row.countryFlag} {row.country}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                              {row.email}
                            </TableCell>
                            <TableCell className="text-sm font-semibold">{row.product}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                                  statusTone(row.status),
                                )}
                              >
                                {statusLabel(row.status)}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {format(row.joinedAtMs, 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="font-semibold tabular-nums">
                              ${(row.totalSpentCents / 100).toFixed(2)}
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    aria-label="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedId(row.id);
                                      setDetailTab('overview');
                                    }}
                                  >
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openMessage(row)}>
                                    Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {showingFrom}–{showingTo} of {totalForPager.toLocaleString()}{' '}
                      subscribers
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
                        onClick={() => {
                          setTablePage((p) => Math.min(pageCount - 1, p + 1));
                          if (!useDemo && pageStatus === 'CanLoadMore') loadMore(PAGE_SIZE);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="xl:col-span-4">
            {selectedRow ? (
              <div className="sticky top-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                <div className="relative border-b border-border p-5">
                  <button
                    type="button"
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted xl:hidden"
                    aria-label="Close"
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    <Avatar className="h-12 w-12 border border-border">
                      {selectedRow.avatarUrl ? (
                        <AvatarImage src={selectedRow.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback
                        className={cn('text-sm font-bold', avatarTone(selectedRow.plan))}
                      >
                        {initialsFromName(selectedRow.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-extrabold text-foreground">
                          {selectedRow.name}
                        </p>
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold',
                            statusTone(selectedRow.status),
                          )}
                        >
                          {statusLabel(selectedRow.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {selectedRow.email}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {format(selectedRow.joinedAtMs, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
                    {(
                      [
                        ['overview', 'Overview'],
                        ['activity', 'Activity'],
                        ['payments', 'Payments'],
                        ['messages', 'Messages'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={cn(
                          'flex-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors',
                          detailTab === id
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => setDetailTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-[calc(100dvh-16rem)] space-y-5 overflow-y-auto p-5">
                  {detailTab === 'overview' ? (
                    <>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              kpiIconTone.emerald,
                            )}
                          >
                            <CreditCard className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              Total spent
                            </p>
                            <p className="text-sm font-extrabold tabular-nums">
                              ${(selectedRow.totalSpentCents / 100).toFixed(2)}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              kpiIconTone.violet,
                            )}
                          >
                            <Package className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              Active product
                            </p>
                            <p className="text-sm font-extrabold">{selectedRow.product}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedRow.priceLabel}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              kpiIconTone.sky,
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Status</p>
                            <span
                              className={cn(
                                'mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                                statusTone(selectedRow.status),
                              )}
                            >
                              {statusLabel(selectedRow.status)}
                            </span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              kpiIconTone.amber,
                            )}
                          >
                            <Calendar className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              Next billing date
                            </p>
                            <p className="text-sm font-extrabold">
                              {selectedRow.renewalAtMs
                                ? format(selectedRow.renewalAtMs, 'MMM d, yyyy')
                                : '—'}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              kpiIconTone.rose,
                            )}
                          >
                            <CreditCard className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              Payment method
                            </p>
                            <p className="text-sm font-extrabold">
                              {selectedRow.paymentLast4
                                ? `Visa ending in ${selectedRow.paymentLast4}`
                                : '—'}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              kpiIconTone.cyan,
                            )}
                          >
                            <Globe className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Country</p>
                            <p className="text-sm font-extrabold">
                              {selectedRow.countryFlag
                                ? `${selectedRow.countryFlag} ${selectedRow.country}`
                                : selectedRow.country}
                            </p>
                          </div>
                        </li>
                      </ul>

                      <Button
                        type="button"
                        className="h-11 w-full rounded-xl"
                        onClick={() => openMessage(selectedRow)}
                      >
                        <MessageSquare className="mr-1.5 h-4 w-4" />
                        Message {selectedRow.name.split(' ')[0]}
                      </Button>

                      <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-foreground">Recent Activity</p>
                          <button
                            type="button"
                            className="text-xs font-bold text-primary hover:underline"
                            onClick={() => setDetailTab('activity')}
                          >
                            View all
                          </button>
                        </div>
                        {selectedRow.activity.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                        ) : (
                          <ul className="space-y-3">
                            {selectedRow.activity.slice(0, 5).map((a) => {
                              const Icon = activityIcon(a.tone);
                              return (
                                <li key={a.id} className="flex items-start gap-3">
                                  <span
                                    className={cn(
                                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                      kpiIconTone.violet,
                                    )}
                                  >
                                    <Icon className="h-3.5 w-3.5" aria-hidden />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                      {a.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{a.whenLabel}</p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </>
                  ) : null}

                  {detailTab === 'activity' ? (
                    selectedRow.activity.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                    ) : (
                      <ul className="space-y-3">
                        {selectedRow.activity.map((a) => {
                          const Icon = activityIcon(a.tone);
                          return (
                            <li key={a.id} className="flex items-start gap-3">
                              <span
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                  kpiIconTone.violet,
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" aria-hidden />
                              </span>
                              <div>
                                <p className="text-sm font-semibold">{a.title}</p>
                                <p className="text-xs text-muted-foreground">{a.whenLabel}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : null}

                  {detailTab === 'payments' ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-border px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground">Total spent</p>
                        <p className="mt-1 text-lg font-extrabold tabular-nums">
                          ${(selectedRow.totalSpentCents / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Payment method
                        </p>
                        <p className="mt-1 text-sm font-bold">
                          {selectedRow.paymentLast4
                            ? `Visa ending in ${selectedRow.paymentLast4}`
                            : 'No card on file'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Next billing
                        </p>
                        <p className="mt-1 text-sm font-bold">
                          {selectedRow.renewalAtMs
                            ? format(selectedRow.renewalAtMs, 'MMM d, yyyy')
                            : '—'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {detailTab === 'messages' ? (
                    <div className="text-center">
                      <Mail className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
                      <p className="text-sm font-semibold text-foreground">Message this fan</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Open the inbox to continue the conversation.
                      </p>
                      <Button
                        type="button"
                        className="mt-4 h-11 rounded-xl"
                        onClick={() => openMessage(selectedRow)}
                      >
                        <MessageSquare className="mr-1.5 h-4 w-4" /> Open Messages
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
                Select a subscriber to view details.
              </div>
            )}
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorSubscribers;
