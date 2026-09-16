import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  DollarSign,
  Download,
  Gift,
  Loader2,
  MoreVertical,
  Search,
  Settings2,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { MarketingSubnav } from '@/components/creator/MarketingSubnav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { buildReferralCode, useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_REFERRALS_DEMO_METRICS,
  CREATOR_REFERRALS_DEMO_ROWS,
  CREATOR_REFERRALS_DEMO_TOP,
  CREATOR_REFERRALS_TIPS,
  isCreatorReferralsDemoId,
  shouldUseCreatorReferralsDemo,
  type DemoReferralRow,
  type DemoReferralStatus,
} from '@/lib/creatorReferralsDemo';
import { initialsFromName } from '@/lib/creatorSubscribersDemo';
import { copyToClipboard } from '@/lib/clipboard';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | DemoReferralStatus;

type TableRowModel = DemoReferralRow & {
  isDemo: boolean;
};

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All referrals' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
  { id: 'fraud', label: 'Fraud checks' },
];

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusTone(status: DemoReferralStatus): string {
  if (status === 'paid') return resultPillTone.win;
  if (status === 'approved') return resultPillTone.premium;
  if (status === 'fraud') return resultPillTone.loss;
  return resultPillTone.pending;
}

function statusLabel(status: DemoReferralStatus): string {
  if (status === 'fraud') return 'Fraud';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

const CreatorReferrals = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const liveReferrals = useQuery(api.creators.growth.listMyReferrals);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const [code, setCode] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tablePage, setTablePage] = useState(0);

  useEffect(() => {
    if (creatorLoading || !creator) return;
    const ensureCode = async () => {
      let referralCode = creator.referral_code;
      if (!referralCode) {
        referralCode = buildReferralCode(creator);
        setSavingCode(true);
        try {
          await updateSettings({ referralCode });
        } catch {
          // keep generated code for display even if save fails
        } finally {
          setSavingCode(false);
        }
      }
      setCode(referralCode);
    };
    void ensureCode();
  }, [creator, creatorLoading, updateSettings]);

  const loading =
    creatorLoading || liveReferrals === undefined || (!!creator && (savingCode || !code));

  const liveRows = liveReferrals ?? [];

  const useDemo = shouldUseCreatorReferralsDemo({
    count: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const referrerName = creator?.display_name?.trim() || 'You';
  const referrerHandle = creator?.username
    ? `@${creator.username}`
    : code
      ? code
      : '@you';

  const rows: TableRowModel[] = useMemo(() => {
    if (useDemo) {
      return CREATOR_REFERRALS_DEMO_ROWS.map((r) => ({ ...r, isDemo: true }));
    }
    return liveRows.map((r) => ({
      id: r._id,
      referrerName,
      referrerHandle,
      referredName: r.referredEmail ?? 'Subscriber',
      referredEmail: r.referredEmail ?? null,
      plan: '—',
      revenueCents: 0,
      commissionCents: 0,
      status: (r.converted ? 'approved' : 'pending') as DemoReferralStatus,
      createdAtMs: r.createdAt,
      isDemo: false,
    }));
  }, [useDemo, liveRows, referrerName, referrerHandle]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.referrerName.toLowerCase().includes(q) ||
        r.referrerHandle.toLowerCase().includes(q) ||
        r.referredName.toLowerCase().includes(q) ||
        (r.referredEmail?.toLowerCase().includes(q) ?? false) ||
        r.plan.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(tablePage, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);

  const convertedCount = useMemo(
    () => rows.filter((r) => r.status === 'approved' || r.status === 'paid').length,
    [rows],
  );

  const metrics = useDemo
    ? CREATOR_REFERRALS_DEMO_METRICS
    : {
        totalReferrals: rows.length,
        totalReferralsDelta: null as number | null,
        newSubscribers: convertedCount,
        newSubscribersDelta: null as number | null,
        revenueCents: 0,
        revenueDelta: null as number | null,
        rewardsPaidCents: 0,
        rewardsPaidDelta: null as number | null,
        dateRangeLabel: 'Last 30 days',
        commissionRatePct: CREATOR_REFERRALS_DEMO_METRICS.commissionRatePct,
        cookieDays: CREATOR_REFERRALS_DEMO_METRICS.cookieDays,
        minPayoutCents: CREATOR_REFERRALS_DEMO_METRICS.minPayoutCents,
      };

  const topReferrers = useMemo(() => {
    if (useDemo) return [...CREATOR_REFERRALS_DEMO_TOP];
    if (rows.length === 0) return [];
    return [
      {
        rank: 1,
        name: referrerName,
        handle: referrerHandle,
        referrals: rows.length,
        revenueCents: 0,
      },
    ];
  }, [useDemo, rows, referrerName, referrerHandle]);

  const dateRangeLabel = useDemo
    ? CREATOR_REFERRALS_DEMO_METRICS.dateRangeLabel
    : 'Last 30 days';

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : '';

  const copyReferral = async () => {
    if (!referralLink) return;
    const ok = await copyToClipboard(referralLink);
    if (ok) toast.success('Referral link copied');
    else toast.error('Could not copy — try selecting the text manually');
  };

  const exportCsv = () => {
    if (useDemo) {
      toast.message('Sample preview — export skipped', {
        description: 'CSV export is available for live referral rows (?demo=0).',
      });
      return;
    }
    if (filtered.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    const header = [
      'Referrer',
      'Handle',
      'Referred user',
      'Email',
      'Plan',
      'Revenue',
      'Commission',
      'Status',
      'Date',
    ];
    const lines = filtered.map((r) =>
      [
        r.referrerName,
        r.referrerHandle,
        r.referredName,
        r.referredEmail ?? '',
        r.plan,
        r.revenueCents > 0 ? money(r.revenueCents) : '',
        r.commissionCents > 0 ? money(r.commissionCents) : '',
        statusLabel(r.status),
        format(r.createdAtMs, 'yyyy-MM-dd'),
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${format(Date.now(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const copyEmail = async (row: TableRowModel) => {
    if (!row.referredEmail) {
      toast.message('No email on this referral');
      return;
    }
    if (row.isDemo || isCreatorReferralsDemoId(row.id)) {
      toast.message('Sample preview — email copied from demo data');
    }
    const ok = await copyToClipboard(row.referredEmail);
    if (ok) toast.success('Email copied');
    else toast.error('Could not copy email');
  };

  const viewStub = (row: TableRowModel) => {
    toast.message('Referral detail coming soon', {
      description: row.referredName,
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

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <h1 className="text-heading font-bold tracking-tight text-foreground">Referrals</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Turn your community into a growth engine. Reward your users for bringing in new
            subscribers.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Gift className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to get a referral link.
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
            Referrals
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Turn your community into a growth engine. Reward your users for bringing in new
            subscribers.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {dateRangeLabel}
          </span>
          <Button
            type="button"
            className="min-h-11 shrink-0 rounded-xl"
            disabled={!referralLink}
            onClick={() => void copyReferral()}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy referral link
          </Button>
        </div>
      </header>

      <MarketingSubnav active="referrals" />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — referral activity and KPIs are mock content for design review.
            Add <span className="font-mono text-xs">?demo=0</span> to see empty real states. Your
            referral link stays live.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total referrals',
              value: metrics.totalReferrals.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.totalReferralsDelta != null
                  ? `↑ ${metrics.totalReferralsDelta}%`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'New subscribers',
              value: metrics.newSubscribers.toLocaleString(),
              icon: UserPlus,
              iconClassName: kpiIconTone.sky,
              trendLabel:
                metrics.newSubscribersDelta != null
                  ? `↑ ${metrics.newSubscribersDelta}%`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Revenue from referrals',
              value:
                useDemo || metrics.revenueCents > 0 ? money(metrics.revenueCents) : '—',
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.revenueDelta != null ? `↑ ${metrics.revenueDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Rewards paid',
              value:
                useDemo || metrics.rewardsPaidCents > 0
                  ? money(metrics.rewardsPaidCents)
                  : '—',
              icon: Gift,
              iconClassName: kpiIconTone.amber,
              trendLabel:
                metrics.rewardsPaidDelta != null
                  ? `↑ ${metrics.rewardsPaidDelta}%`
                  : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:col-span-9">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(f.id);
                      setTablePage(0);
                    }}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                      active
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTablePage(0);
                  }}
                  placeholder="Search referrals…"
                  className="h-11 min-h-11 rounded-xl pl-9"
                  aria-label="Search referrals"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 rounded-xl"
                onClick={exportCsv}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-14 text-center sm:px-5">
              <Gift className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-ui font-semibold text-foreground">No referrals found</p>
              <p className="mt-1 text-support text-muted-foreground">
                {rows.length === 0
                  ? 'Share your referral link to attribute signups.'
                  : 'Try a different search or filter.'}
              </p>
              {rows.length === 0 && referralLink ? (
                <Button
                  type="button"
                  className="mt-4 min-h-11 rounded-xl"
                  onClick={() => void copyReferral()}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy referral link
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[64rem]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Referrer</TableHead>
                      <TableHead>Referred user</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-700 dark:text-violet-400">
                              {initialsFromName(row.referrerName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {row.referrerName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {row.referrerHandle}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {row.referredName}
                            </p>
                            {row.referredEmail ? (
                              <p className="truncate text-xs text-muted-foreground">
                                {row.referredEmail}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.plan}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.revenueCents > 0 ? money(row.revenueCents) : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.commissionCents > 0 ? money(row.commissionCents) : '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                              statusTone(row.status),
                            )}
                          >
                            {statusLabel(row.status)}
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
                                aria-label={`Actions for ${row.referredName}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void copyEmail(row)}>
                                Copy email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => viewStub(row)}>
                                View
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
                  Showing {showingFrom}–{showingTo} of {filtered.length} referrals
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

        <aside className="flex flex-col gap-4 xl:col-span-3">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Referral Program Settings
              </h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Commission</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {metrics.commissionRatePct}%
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Cookie window</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {metrics.cookieDays} days
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Min payout</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {money(metrics.minPayoutCents)}
                </dd>
              </div>
            </dl>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11 w-full rounded-xl"
              onClick={() =>
                toast.message('Settings editor coming soon', {
                  description: 'Commission and payout rules will be editable here.',
                })
              }
            >
              Edit Settings
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
              Top Referrers
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">{dateRangeLabel}</p>
            {topReferrers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No referrals yet — share your link to start ranking.
              </p>
            ) : (
              <ol className="space-y-3">
                {topReferrers.map((item) => (
                  <li key={`${item.rank}-${item.handle}`} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-700 dark:text-violet-400">
                      {item.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.handle} · {item.referrals.toLocaleString()} referrals
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
              Tips for more referrals
            </h2>
            <ul className="space-y-2.5">
              {CREATOR_REFERRALS_TIPS.map((tip) => (
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
    </DashboardLayout>
  );
};

export default CreatorReferrals;
