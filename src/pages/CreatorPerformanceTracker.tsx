import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { format, subDays } from 'date-fns';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChevronDown,
  Loader2,
  Percent,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
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
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { americanToDecimal, decimalToAmerican, profitUnits } from '@/lib/odds';
import { parsePostContent } from '@/lib/postContent';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { sportVisual } from '@/lib/sportVisual';
import { cn } from '@/lib/utils';
import {
  CREATOR_PERFORMANCE_DEMO_METRICS,
  CREATOR_PERFORMANCE_DEMO_MONTHLY,
  CREATOR_PERFORMANCE_DEMO_PRACTICE,
  CREATOR_PERFORMANCE_DEMO_PROFIT_BY_SPORT,
  CREATOR_PERFORMANCE_DEMO_PROFIT_SERIES,
  CREATOR_PERFORMANCE_DEMO_RECENT,
  CREATOR_PERFORMANCE_DEMO_RESULTS,
  CREATOR_PERFORMANCE_DEMO_WINRATE_BY_SPORT,
  isCreatorPerformanceDemoId,
  shouldUseCreatorPerformanceDemo,
  type PerformanceResult,
} from '@/lib/creatorPerformanceDemo';

type DateRangeKey = '7' | '30' | '90';

type AnalyticsPick = {
  id: string;
  dateMs: number;
  dateLabel: string;
  match: string;
  pick: string;
  sport: string;
  result: PerformanceResult;
  units: number;
  usOdds: string;
  profit: number;
};

type PracticePick = {
  id: string;
  date: string;
  pickEvent: string;
  sport: string;
  usOdds: string;
  euOdds: number | null;
  unitsRisked: number;
  result: string;
  unitsWonLost: number;
};

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'MMA', 'Tennis', 'Other'];
const RESULTS = ['won', 'lost', 'push', 'pending'] as const;

const defaultForm = {
  date: new Date().toISOString().split('T')[0]!,
  pickEvent: '',
  sport: 'NFL',
  euOdds: '',
  usOdds: '',
  unitsRisked: '1',
  result: 'pending',
  unitsWonLost: '0',
};

function normalizeResult(raw: string | undefined | null): PerformanceResult {
  if (raw === 'won' || raw === 'win') return 'won';
  if (raw === 'lost' || raw === 'loss') return 'lost';
  if (raw === 'push') return 'push';
  return 'pending';
}

function resultLabel(result: PerformanceResult): string {
  if (result === 'won') return 'Win';
  if (result === 'lost') return 'Loss';
  if (result === 'push') return 'Push';
  return 'Pending';
}

function fmtUnits(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}u`;
}

function MatchCell({ match, sport }: { match: string; sport: string }) {
  const visual = sportVisual(sport);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base',
          visual.chipClass,
        )}
        aria-hidden
        title={sport || 'Sport'}
      >
        {visual.emoji}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{match || '—'}</p>
        {sport ? (
          <p className="truncate text-xs font-medium text-muted-foreground">{sport}</p>
        ) : null}
      </div>
    </div>
  );
}

const CreatorPerformanceTracker = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const picksRaw = useQuery(api.picks.mutations.listMine);
  const postsRaw = useQuery(api.posts.queries.listMine);
  const upsertPick = useMutation(api.picks.mutations.upsert);
  const removePick = useMutation(api.picks.mutations.remove);

  const [dateRange, setDateRange] = useState<DateRangeKey>('30');
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading = picksRaw === undefined || postsRaw === undefined;

  const useDemo = shouldUseCreatorPerformanceDemo({
    pickCount: picksRaw?.length ?? 0,
    postCount: postsRaw?.length ?? 0,
    forceDemo,
    disableDemo,
  });

  const practicePicks: PracticePick[] = useMemo(() => {
    if (useDemo) {
      return CREATOR_PERFORMANCE_DEMO_PRACTICE.map((p) => ({
        id: p.id,
        date: p.date,
        pickEvent: p.pickEvent,
        sport: p.sport,
        usOdds: p.usOdds,
        euOdds: p.euOdds,
        unitsRisked: p.unitsRisked,
        result: p.result,
        unitsWonLost: p.unitsWonLost,
      }));
    }
    return (picksRaw ?? []).map((p) => ({
      id: p._id,
      date: p.date,
      pickEvent: p.pickEvent,
      sport: p.sport,
      usOdds: p.usOdds ?? '',
      euOdds: p.euOdds ?? null,
      unitsRisked: p.unitsRisked,
      result: normalizeResult(p.result),
      unitsWonLost: p.unitsWonLost ?? 0,
    }));
  }, [picksRaw, useDemo]);

  const liveAnalyticsPicks: AnalyticsPick[] = useMemo(() => {
    const fromPosts: AnalyticsPick[] = (postsRaw ?? []).map((p) => {
      const parsed = parsePostContent(p.content ?? null);
      const result = normalizeResult(p.result);
      const units = Number.parseFloat(parsed.units) || 1;
      const usOdds = parsed.usOdds || '-110';
      const profit = profitUnits(result, units, usOdds);
      return {
        id: p._id,
        dateMs: p.createdAt,
        dateLabel: format(p.createdAt, 'MMM d'),
        match: parsed.event || p.title,
        pick: parsed.pick || p.title,
        sport: parsed.sport || 'Other',
        result,
        units,
        usOdds,
        profit,
      };
    });

    if (fromPosts.length > 0) return fromPosts;

    return (picksRaw ?? []).map((p) => {
      const result = normalizeResult(p.result);
      const usOdds = p.usOdds || (p.euOdds != null ? decimalToAmerican(p.euOdds) : '-110');
      const profit =
        p.unitsWonLost != null
          ? p.unitsWonLost
          : profitUnits(result, p.unitsRisked, usOdds || '-110');
      const dateMs = Date.parse(p.date) || p.createdAt;
      return {
        id: p._id,
        dateMs,
        dateLabel: format(dateMs, 'MMM d'),
        match: p.pickEvent,
        pick: p.pickEvent,
        sport: p.sport || 'Other',
        result,
        units: p.unitsRisked,
        usOdds: usOdds || '-110',
        profit,
      };
    });
  }, [postsRaw, picksRaw]);

  const rangeCutoffMs = useMemo(
    () => subDays(new Date(), Number(dateRange)).getTime(),
    [dateRange],
  );

  const rangedPicks = useMemo(
    () => liveAnalyticsPicks.filter((p) => p.dateMs >= rangeCutoffMs),
    [liveAnalyticsPicks, rangeCutoffMs],
  );

  const metrics = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_METRICS;

    const settled = rangedPicks.filter((p) => p.result === 'won' || p.result === 'lost');
    const wins = settled.filter((p) => p.result === 'won').length;
    const winRate = settled.length > 0 ? Number(((wins / settled.length) * 100).toFixed(1)) : 0;
    const totalProfit = Number(rangedPicks.reduce((s, p) => s + p.profit, 0).toFixed(1));
    const risked = settled.reduce((s, p) => s + p.units, 0);
    const roi = risked > 0 ? Number(((totalProfit / risked) * 100).toFixed(1)) : 0;

    return {
      winRate,
      winRateDelta: null as number | null,
      settledPicks: settled.length,
      settledDelta: null as number | null,
      totalProfit,
      profitDelta: null as number | null,
      roi,
      roiDelta: null as number | null,
    };
  }, [useDemo, rangedPicks]);

  const profitSeries = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_PROFIT_SERIES;
    const settled = [...rangedPicks]
      .filter((p) => p.result !== 'pending')
      .sort((a, b) => a.dateMs - b.dateMs);
    let running = 0;
    return settled.map((p) => {
      running += p.profit;
      return { label: p.dateLabel, profit: Number(running.toFixed(1)) };
    });
  }, [useDemo, rangedPicks]);

  const resultsPie = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_RESULTS;
    const wins = rangedPicks.filter((p) => p.result === 'won').length;
    const losses = rangedPicks.filter((p) => p.result === 'lost').length;
    const pushes = rangedPicks.filter((p) => p.result === 'push').length;
    return [
      { name: 'Wins', value: wins, color: 'hsl(160 84% 39%)' },
      { name: 'Losses', value: losses, color: 'hsl(0 84% 60%)' },
      { name: 'Pushes', value: pushes, color: 'hsl(215 16% 55%)' },
    ].filter((d) => d.value > 0);
  }, [useDemo, rangedPicks]);

  const profitBySport = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_PROFIT_BY_SPORT;
    const map = new Map<string, number>();
    for (const p of rangedPicks) {
      if (p.result === 'pending') continue;
      map.set(p.sport, (map.get(p.sport) ?? 0) + p.profit);
    }
    return Array.from(map.entries())
      .map(([sport, profit]) => ({ sport, profit: Number(profit.toFixed(1)) }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [useDemo, rangedPicks]);

  const winRateBySport = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_WINRATE_BY_SPORT;
    const map = new Map<string, { wins: number; settled: number }>();
    for (const p of rangedPicks) {
      if (p.result !== 'won' && p.result !== 'lost') continue;
      const cur = map.get(p.sport) ?? { wins: 0, settled: 0 };
      cur.settled += 1;
      if (p.result === 'won') cur.wins += 1;
      map.set(p.sport, cur);
    }
    return Array.from(map.entries())
      .map(([sport, d]) => ({
        sport,
        winRate: d.settled > 0 ? Math.round((d.wins / d.settled) * 100) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 6);
  }, [useDemo, rangedPicks]);

  const recentRows = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_RECENT;
    return [...rangedPicks].sort((a, b) => b.dateMs - a.dateMs).slice(0, 10);
  }, [useDemo, rangedPicks]);

  const monthlyRows = useMemo(() => {
    if (useDemo) return CREATOR_PERFORMANCE_DEMO_MONTHLY;
    const map = new Map<
      string,
      { label: string; picks: number; wins: number; settled: number; risked: number; profit: number }
    >();
    for (const p of liveAnalyticsPicks) {
      const key = format(p.dateMs, 'yyyy-MM');
      const label = format(p.dateMs, 'MMM yyyy');
      const cur = map.get(key) ?? {
        label,
        picks: 0,
        wins: 0,
        settled: 0,
        risked: 0,
        profit: 0,
      };
      cur.picks += 1;
      if (p.result === 'won' || p.result === 'lost') {
        cur.settled += 1;
        if (p.result === 'won') cur.wins += 1;
        cur.risked += p.units;
      }
      if (p.result !== 'pending') cur.profit += p.profit;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([, d]) => {
        const winRate =
          d.settled > 0 ? Number(((d.wins / d.settled) * 100).toFixed(1)) : 0;
        const roi = d.risked > 0 ? Number(((d.profit / d.risked) * 100).toFixed(1)) : 0;
        return {
          month: d.label,
          picks: d.picks,
          wins: d.wins,
          winRate,
          risked: Number(d.risked.toFixed(1)),
          profit: Number(d.profit.toFixed(1)),
          roi,
        };
      });
  }, [useDemo, liveAnalyticsPicks]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setDialogOpen(false);
  };

  const handleEuChange = useCallback((val: string) => {
    const eu = parseFloat(val);
    setForm((f) => ({
      ...f,
      euOdds: val,
      usOdds: !Number.isNaN(eu) && eu > 1 ? decimalToAmerican(eu) : f.usOdds,
    }));
  }, []);

  const handleUsChange = useCallback((val: string) => {
    const eu = americanToDecimal(val);
    setForm((f) => ({
      ...f,
      usOdds: val,
      euOdds: eu !== null ? String(eu) : f.euOdds,
    }));
  }, []);

  const openAdd = () => {
    setForm(defaultForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (pick: PracticePick) => {
    if (isCreatorPerformanceDemoId(pick.id)) {
      toast.message('Sample data — create a real practice pick to edit.');
      return;
    }
    setForm({
      date: pick.date,
      pickEvent: pick.pickEvent,
      sport: pick.sport,
      euOdds: pick.euOdds != null ? String(pick.euOdds) : '',
      usOdds: pick.usOdds,
      unitsRisked: String(pick.unitsRisked),
      result: normalizeResult(pick.result),
      unitsWonLost: String(pick.unitsWonLost),
    });
    setEditId(pick.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editId && isCreatorPerformanceDemoId(editId)) {
      toast.message('Sample data — create a real practice pick instead.');
      return;
    }
    if (!form.pickEvent.trim()) {
      toast.error('Pick / event is required');
      return;
    }
    if (!form.euOdds && !form.usOdds) {
      toast.error('Enter EU or US odds');
      return;
    }
    setSaving(true);
    try {
      await upsertPick({
        pickId: editId ? (editId as Id<'pickTracker'>) : undefined,
        date: form.date,
        pickEvent: form.pickEvent.trim(),
        sport: form.sport,
        euOdds: form.euOdds ? parseFloat(form.euOdds) : undefined,
        usOdds: form.usOdds || undefined,
        unitsRisked: parseFloat(form.unitsRisked) || 1,
        unitsWonLost: parseFloat(form.unitsWonLost) || 0,
        result: form.result,
      });
      toast.success(editId ? 'Pick updated' : 'Pick added');
      resetForm();
    } catch {
      toast.error('Failed to save pick');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (isCreatorPerformanceDemoId(deleteId)) {
      toast.message('Sample data — nothing to delete.');
      setDeleteId(null);
      return;
    }
    setDeleting(true);
    try {
      await removePick({ pickId: deleteId as Id<'pickTracker'> });
      toast.success('Pick deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete');
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

  const chartTooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: 13,
  };

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Performance
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Your Performance
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Win rate, profit, and sport breakdowns from your settled picks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeKey)}>
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild className="min-h-11 rounded-xl">
            <Link to="/creator/posts">
              <Plus className="mr-1.5 h-4 w-4" /> Add Pick
            </Link>
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
            Sample preview data — charts and tables are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'Win Rate',
              value: `${metrics.winRate}%`,
              icon: Trophy,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.winRateDelta != null ? `↑ ${metrics.winRateDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Settled Picks',
              value: String(metrics.settledPicks),
              icon: Target,
              iconClassName: kpiIconTone.sky,
              trendLabel:
                metrics.settledDelta != null ? `↑ ${metrics.settledDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Total Profit',
              value: fmtUnits(metrics.totalProfit),
              icon: TrendingUp,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.profitDelta != null ? `↑ ${metrics.profitDelta}%` : undefined,
              trendPositive: metrics.totalProfit >= 0,
            },
            {
              label: 'ROI%',
              value: `${metrics.roi >= 0 ? '+' : ''}${metrics.roi}%`,
              icon: Percent,
              iconClassName: kpiIconTone.amber,
              trendLabel: metrics.roiDelta != null ? `↑ ${metrics.roiDelta}%` : undefined,
              trendPositive: metrics.roi >= 0,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-8">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Profit over time
          </h2>
          <div className="h-72 min-w-0 w-full">
            {profitSeries.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">No settled picks yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profitSeries}>
                  <defs>
                    <linearGradient id="perfProfitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}u`}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v: number) => [`${v}u`, 'Profit']}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="none"
                    fill="url(#perfProfitGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(160 84% 39%)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-4">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Pick Results
          </h2>
          <div className="h-56 min-w-0 w-full">
            {resultsPie.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No results yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultsPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {resultsPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            {resultsPie.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs font-medium text-muted-foreground">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Profit by Sport
          </h2>
          <div className="h-64 min-w-0 w-full">
            {profitBySport.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No sport data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitBySport} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}u`}
                  />
                  <YAxis
                    type="category"
                    dataKey="sport"
                    width={64}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v: number) => [`${v}u`, 'Profit']}
                  />
                  <Bar dataKey="profit" radius={[0, 6, 6, 0]} fill="hsl(239 84% 67%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Win Rate by Sport
          </h2>
          <div className="h-64 min-w-0 w-full">
            {winRateBySport.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No sport data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winRateBySport} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="sport"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v: number) => [`${v}%`, 'Win rate']}
                  />
                  <Bar dataKey="winRate" radius={[6, 6, 0, 0]} fill="hsl(199 89% 48%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Recent Picks Performance
          </h2>
          <Button asChild variant="outline" className="min-h-10 rounded-xl">
            <Link to="/creator/posts">Manage picks</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-5">Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Pick</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="px-5 text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No picks in this range.{' '}
                    <Link to="/creator/posts" className="font-semibold text-primary underline-offset-2 hover:underline">
                      Add a pick
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                recentRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-5 text-sm text-muted-foreground">
                      {format(row.dateMs, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <MatchCell match={row.match} sport={row.sport} />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{row.pick}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                          resultPillTone[row.result],
                        )}
                      >
                        {resultLabel(row.result)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-5 text-right text-sm font-bold tabular-nums',
                        row.profit > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : row.profit < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      {row.result === 'pending' ? '—' : fmtUnits(row.profit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Monthly Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-5">Month</TableHead>
                <TableHead className="text-right">Picks</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
                <TableHead className="text-right">Risked</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="px-5 text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No monthly history yet.
                  </TableCell>
                </TableRow>
              ) : (
                monthlyRows.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="px-5 text-sm font-semibold">{m.month}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{m.picks}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{m.winRate}%</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{m.risked}u</TableCell>
                    <TableCell
                      className={cn(
                        'text-right text-sm font-bold tabular-nums',
                        m.profit > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : m.profit < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      {fmtUnits(m.profit)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-5 text-right text-sm font-bold tabular-nums',
                        m.roi > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : m.roi < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      {m.roi >= 0 ? '+' : ''}
                      {m.roi}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Collapsible open={practiceOpen} onOpenChange={setPracticeOpen}>
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Manage practice picks
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Private ledger separate from published posts — {practicePicks.length} pick
                  {practicePicks.length === 1 ? '' : 's'}.
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                  practiceOpen && 'rotate-180',
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border px-5 py-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <Button type="button" className="min-h-10 rounded-xl" onClick={openAdd}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add practice pick
                </Button>
                <Button asChild variant="outline" className="min-h-10 rounded-xl">
                  <Link to="/creator/posts">Go to Your Picks</Link>
                </Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="px-4">Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">P/L</TableHead>
                      <TableHead className="px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {practicePicks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No practice picks yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      practicePicks.map((p) => {
                        const result = normalizeResult(p.result);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="px-4 text-sm text-muted-foreground">
                              {p.date}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{p.pickEvent}</TableCell>
                            <TableCell className="text-sm">{p.sport}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                                  resultPillTone[result],
                                )}
                              >
                                {resultLabel(result)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {fmtUnits(p.unitsWonLost)}
                            </TableCell>
                            <TableCell className="px-4 text-right">
                              <div className="inline-flex gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9"
                                  onClick={() => openEdit(p)}
                                  aria-label="Edit pick"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 text-rose-600"
                                  onClick={() => setDeleteId(p.id)}
                                  aria-label="Delete pick"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit practice pick' : 'Add practice pick'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Date</label>
                <Input
                  type="date"
                  className="h-11"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Sport</label>
                <Select
                  value={form.sport}
                  onValueChange={(v) => setForm((f) => ({ ...f, sport: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Pick / Event</label>
              <Input
                className="h-11"
                placeholder="Chiefs -3.5"
                value={form.pickEvent}
                onChange={(e) => setForm((f) => ({ ...f, pickEvent: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">EU Odds</label>
                <Input
                  type="number"
                  step="0.01"
                  min="1.01"
                  className="h-11"
                  placeholder="1.91"
                  value={form.euOdds}
                  onChange={(e) => handleEuChange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">US Odds</label>
                <Input
                  className="h-11"
                  placeholder="-110"
                  value={form.usOdds}
                  onChange={(e) => handleUsChange(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Units</label>
                <Input
                  type="number"
                  step="0.5"
                  className="h-11"
                  value={form.unitsRisked}
                  onChange={(e) => setForm((f) => ({ ...f, unitsRisked: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Result</label>
                <Select
                  value={form.result}
                  onValueChange={(v) => setForm((f) => ({ ...f, result: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {resultLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">P/L (u)</label>
                <Input
                  type="number"
                  step="0.1"
                  className="h-11"
                  value={form.unitsWonLost}
                  onChange={(e) => setForm((f) => ({ ...f, unitsWonLost: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Add pick'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete practice pick?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the pick from your private ledger. This cannot be undone.
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
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CreatorPerformanceTracker;
