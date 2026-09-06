import { useState, useMemo, useCallback, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, Trophy, Target, DollarSign, Zap, Plus, Pencil, Trash2,
  ListFilter, Download, Upload, BarChart3, Activity, Award, TrendingDown,
  ArrowUpRight, ArrowDownRight, Lightbulb, FileText, Eye, MousePointerClick,
  Copy, ShieldCheck, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { downloadCsv, readFileAsText } from '@/lib/csv';
import { PICK_CSV_HEADERS, parsePickCsv } from '@/lib/pickCsv';
import { americanToDecimal, decimalToAmerican } from '@/lib/odds';

interface PickEntry {
  id: string; date: string; pick_event: string; sport: string;
  eu_odds: number | null; us_odds: string | null; units_risked: number;
  result: string; units_won_lost: number | null; notes: string | null;
}

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'MMA', 'Tennis', 'Other'];
const RESULTS = ['win', 'loss', 'push', 'pending'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultForm = {
  date: new Date().toISOString().split('T')[0], pick_event: '', sport: 'NFL',
  eu_odds: '', us_odds: '', units_risked: '1', result: 'pending',
  units_won_lost: '0', notes: '',
};

function uiPickResult(result: string): string {
  if (result === 'won') return 'win';
  if (result === 'lost') return 'loss';
  return result;
}

function toConvexPick(entry: Omit<PickEntry, 'id'> & { id?: string }) {
  return {
    pickId: entry.id as Id<'pickTracker'> | undefined,
    date: entry.date,
    pickEvent: entry.pick_event,
    sport: entry.sport,
    euOdds: entry.eu_odds,
    usOdds: entry.us_odds ?? undefined,
    unitsRisked: entry.units_risked,
    unitsWonLost: entry.units_won_lost ?? undefined,
    result: entry.result === 'win' ? 'won' : entry.result === 'loss' ? 'lost' : entry.result,
    notes: entry.notes ?? undefined,
  };
}

function fromConvexPick(p: {
  _id: Id<'pickTracker'>;
  date: string;
  pickEvent: string;
  sport: string;
  euOdds?: number;
  usOdds?: string;
  unitsRisked: number;
  result: string;
  unitsWonLost?: number;
  notes?: string;
}): PickEntry {
  return {
    id: p._id,
    date: p.date,
    pick_event: p.pickEvent,
    sport: p.sport,
    eu_odds: p.euOdds ?? null,
    us_odds: p.usOdds ?? null,
    units_risked: p.unitsRisked,
    result: uiPickResult(p.result),
    units_won_lost: p.unitsWonLost ?? null,
    notes: p.notes ?? null,
  };
}

const CreatorPerformanceTracker = () => {
  const creatorProfile = useQuery(api.creators.queries.myCreator);
  const picksRaw = useQuery(api.picks.mutations.listMine);
  const postsRaw = useQuery(api.posts.queries.listMine);
  const analyticsRaw = useQuery(api.analytics.mutations.listForMyCreator);
  const upsertPick = useMutation(api.picks.mutations.upsert);
  const removePick = useMutation(api.picks.mutations.remove);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSport, setFilterSport] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const picks = useMemo(() => (picksRaw ?? []).map(fromConvexPick).sort((a, b) => a.date.localeCompare(b.date)), [picksRaw]);
  const posts = useMemo(
    () => (postsRaw ?? []).map((p) => ({
      id: p._id,
      title: p.title,
      content: p.content,
      is_premium: p.isPremium,
      created_at: new Date(p.createdAt).toISOString(),
      result: p.result,
    })),
    [postsRaw],
  );
  const analyticsEvents = useMemo(
    () => (analyticsRaw ?? []).map((e) => ({
      id: e._id,
      post_id: e.postId,
      event_type: e.eventType,
      created_at: new Date(e.createdAt).toISOString(),
    })),
    [analyticsRaw],
  );
  const isLoading = picksRaw === undefined;

  const upsertMutation = {
    isPending: false,
    mutate: async (entry: Omit<PickEntry, 'id'> & { id?: string }) => {
      try {
        await upsertPick(toConvexPick(entry));
        toast.success(editId ? 'Updated' : 'Added');
        resetForm();
      } catch {
        toast.error('Failed to save');
      }
    },
  };

  const deleteMutation = {
    mutate: async (id: string) => {
      try {
        await removePick({ pickId: id as Id<'pickTracker'> });
        toast.success('Deleted');
      } catch {
        toast.error('Failed to delete');
      }
    },
  };

  const resetForm = () => { setForm(defaultForm); setEditId(null); setDialogOpen(false); setQuickAddOpen(false); };

  // Duplicate pick - pre-fill form with last pick's sport/units
  const handleDuplicate = (pick: PickEntry) => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      pick_event: '',
      sport: pick.sport,
      eu_odds: pick.eu_odds ? String(pick.eu_odds) : '',
      us_odds: pick.us_odds || '',
      units_risked: String(pick.units_risked),
      result: 'pending',
      units_won_lost: '0',
      notes: '',
    });
    setEditId(null);
    setQuickAddOpen(true);
    toast.info('Pre-filled from previous pick');
  };

  // Smart pre-fill from last pick
  const handleSmartAdd = () => {
    const last = picks[picks.length - 1];
    if (last) {
      setForm({
        ...defaultForm,
        sport: last.sport,
        units_risked: String(last.units_risked),
      });
    } else {
      setForm(defaultForm);
    }
    setEditId(null);
    setQuickAddOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (picks.length === 0) { toast.error('No picks to export'); return; }
    downloadCsv(
      `picks-export-${new Date().toISOString().split('T')[0]}.csv`,
      PICK_CSV_HEADERS,
      picks.map(p => [p.date, p.pick_event, p.sport, p.eu_odds ?? '', p.us_odds ?? '', p.units_risked, p.result, p.units_won_lost ?? 0, p.notes ?? '']),
    );
    toast.success(`Exported ${picks.length} picks`);
  };

  // CSV Import
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImportCSV = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const { rows, skipped } = parsePickCsv(await readFileAsText(file));
      if (rows.length === 0) { toast.error('No valid rows found in that CSV'); return; }
      for (const r of rows) {
        await upsertPick({
          date: r.date,
          pickEvent: r.pick_event,
          sport: r.sport,
          euOdds: r.eu_odds,
          usOdds: r.us_odds ?? undefined,
          unitsRisked: r.units_risked,
          unitsWonLost: r.units_won_lost ?? undefined,
          result: r.result === 'win' ? 'won' : r.result === 'loss' ? 'lost' : r.result,
          notes: r.notes ?? undefined,
        });
      }
      toast.success(`Imported ${rows.length} picks${skipped ? ` — ${skipped} rows skipped` : ''}`);
    } catch {
      toast.error('Import failed — check the CSV format');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  // Verification status
  const verificationStatus = useMemo(() => {
    const settled = picks.filter(p => p.result !== 'pending');
    const minPicks = 50;
    const minWinRate = 52;
    const currentWinRate = settled.length > 0 ? Math.round((settled.filter(p => p.result === 'win').length / settled.length) * 100) : 0;
    const isVerified = settled.length >= minPicks && currentWinRate >= minWinRate;
    const progress = Math.min(100, Math.round((settled.length / minPicks) * 100));
    return { isVerified, settled: settled.length, minPicks, currentWinRate, minWinRate, progress };
  }, [picks]);

  const handleEuChange = useCallback((val: string) => {
    const eu = parseFloat(val);
    setForm(f => ({ ...f, eu_odds: val, us_odds: !isNaN(eu) && eu > 1 ? decimalToAmerican(eu) : f.us_odds }));
  }, []);

  const handleUsChange = useCallback((val: string) => {
    const eu = americanToDecimal(val);
    setForm(f => ({ ...f, us_odds: val, eu_odds: eu !== null ? String(eu) : f.eu_odds }));
  }, []);

  const handleEdit = (pick: PickEntry) => {
    setForm({
      date: pick.date, pick_event: pick.pick_event, sport: pick.sport,
      eu_odds: pick.eu_odds ? String(pick.eu_odds) : '', us_odds: pick.us_odds || '',
      units_risked: String(pick.units_risked), result: pick.result,
      units_won_lost: String(pick.units_won_lost || 0), notes: pick.notes || '',
    });
    setEditId(pick.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.pick_event.trim()) { toast.error('Pick/Event is required'); return; }
    if (!form.eu_odds && !form.us_odds) { toast.error('Enter EU or US odds'); return; }
    upsertMutation.mutate({
      id: editId ?? undefined,
      date: form.date, pick_event: form.pick_event, sport: form.sport,
      eu_odds: form.eu_odds ? parseFloat(form.eu_odds) : null, us_odds: form.us_odds || null,
      units_risked: parseFloat(form.units_risked) || 1, result: form.result,
      units_won_lost: parseFloat(form.units_won_lost) || 0, notes: form.notes || null,
    });
  };

  const filtered = useMemo(() => picks.filter(p => {
    if (filterSport !== 'all' && p.sport !== filterSport) return false;
    if (filterResult !== 'all' && p.result !== filterResult) return false;
    return true;
  }), [picks, filterSport, filterResult]);

  const picksWithRunning = useMemo(() => {
    let r = 0;
    return filtered.map(p => { r += (p.units_won_lost || 0); return { ...p, runningTotal: r }; });
  }, [filtered]);

  const displayPicks = useMemo(() => [...picksWithRunning].reverse(), [picksWithRunning]);

  const stats = useMemo(() => {
    const settled = picks.filter(p => p.result !== 'pending');
    const wins = settled.filter(p => p.result === 'win').length;
    const losses = settled.filter(p => p.result === 'loss').length;
    const pushes = settled.filter(p => p.result === 'push').length;
    const totalRisked = settled.reduce((s, p) => s + (p.units_risked || 0), 0);
    const totalWonLost = picks.reduce((s, p) => s + (p.units_won_lost || 0), 0);
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0;
    const roi = totalRisked > 0 ? Math.round((totalWonLost / totalRisked) * 100) : 0;
    const avgRisked = settled.length > 0 ? totalRisked / settled.length : 0;

    const sortedDesc = [...picks].reverse().filter(p => p.result === 'win' || p.result === 'loss');
    let streak = 0, streakType = '';
    for (const p of sortedDesc) { if (!streakType) { streakType = p.result; streak = 1; } else if (p.result === streakType) streak++; else break; }

    let longestWin = 0, longestLoss = 0, cw = 0, cl = 0;
    for (const p of picks) {
      if (p.result === 'win') { cw++; cl = 0; longestWin = Math.max(longestWin, cw); }
      else if (p.result === 'loss') { cl++; cw = 0; longestLoss = Math.max(longestLoss, cl); }
      else { cw = 0; cl = 0; }
    }

    return { totalPicks: picks.length, wins, losses, pushes, totalRisked, totalWonLost, winRate, roi, streak, streakType, longestWin, longestLoss, avgRisked };
  }, [picks]);

  const totals = useMemo(() => {
    const risked = filtered.reduce((s, p) => s + (p.units_risked || 0), 0);
    const wonLost = filtered.reduce((s, p) => s + (p.units_won_lost || 0), 0);
    return { risked, wonLost };
  }, [filtered]);

  const profitChartData = useMemo(() => {
    let r = 0;
    return picks.filter(p => p.result !== 'pending').map(p => { r += (p.units_won_lost || 0); return { date: p.date, profit: parseFloat(r.toFixed(1)) }; });
  }, [picks]);

  const pieData = useMemo(() => [
    { name: 'Wins', value: stats.wins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Losses', value: stats.losses, color: 'hsl(0, 84%, 60%)' },
    { name: 'Pushes', value: stats.pushes, color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0), [stats]);

  const sportBreakdown = useMemo(() => {
    const map: Record<string, { picks: number; wins: number; profit: number; risked: number }> = {};
    picks.forEach(p => {
      if (!map[p.sport]) map[p.sport] = { picks: 0, wins: 0, profit: 0, risked: 0 };
      map[p.sport].picks++;
      if (p.result === 'win') map[p.sport].wins++;
      map[p.sport].profit += (p.units_won_lost || 0);
      if (p.result !== 'pending') map[p.sport].risked += (p.units_risked || 0);
    });
    return Object.entries(map).map(([sport, d]) => ({
      sport, ...d,
      winRate: d.picks > 0 ? Math.round((d.wins / d.picks) * 100) : 0,
      roi: d.risked > 0 ? Math.round((d.profit / d.risked) * 100) : 0,
    })).sort((a, b) => b.profit - a.profit);
  }, [picks]);

  const monthlyBreakdown = useMemo(() => {
    const map: Record<string, { picks: number; wins: number; profit: number; risked: number }> = {};
    picks.forEach(p => {
      const m = p.date.substring(0, 7);
      if (!map[m]) map[m] = { picks: 0, wins: 0, profit: 0, risked: 0 };
      map[m].picks++;
      if (p.result === 'win') map[m].wins++;
      map[m].profit += (p.units_won_lost || 0);
      if (p.result !== 'pending') map[m].risked += (p.units_risked || 0);
    });
    return Object.entries(map).map(([month, d]) => ({
      month, label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...d, winRate: d.picks > 0 ? Math.round((d.wins / d.picks) * 100) : 0,
      roi: d.risked > 0 ? Math.round((d.profit / d.risked) * 100) : 0,
    })).sort((a, b) => b.month.localeCompare(a.month));
  }, [picks]);

  const insights = useMemo(() => {
    if (picks.length === 0) return null;
    const settled = picks.filter(p => p.result !== 'pending');
    const best = sportBreakdown.length > 0 ? sportBreakdown[0] : null;
    const worst = sportBreakdown.length > 0 ? sportBreakdown[sportBreakdown.length - 1] : null;
    const sorted = [...settled].sort((a, b) => (b.units_won_lost || 0) - (a.units_won_lost || 0));
    const biggestWin = sorted.find(p => (p.units_won_lost || 0) > 0) || null;
    const biggestLoss = [...sorted].reverse().find(p => (p.units_won_lost || 0) < 0) || null;
    const dayMap: Record<number, { wins: number; total: number }> = {};
    settled.forEach(p => { const d = new Date(p.date).getDay(); if (!dayMap[d]) dayMap[d] = { wins: 0, total: 0 }; dayMap[d].total++; if (p.result === 'win') dayMap[d].wins++; });
    let bestDay = '', worstDay = '', bestDayRate = -1, worstDayRate = 101;
    Object.entries(dayMap).forEach(([d, v]) => { const rate = v.total > 0 ? v.wins / v.total * 100 : 0; if (rate > bestDayRate) { bestDayRate = rate; bestDay = DAYS[parseInt(d)]; } if (rate < worstDayRate) { worstDayRate = rate; worstDay = DAYS[parseInt(d)]; } });
    const resultCounts: Record<string, number> = {};
    settled.forEach(p => { resultCounts[p.result] = (resultCounts[p.result] || 0) + 1; });
    const mostCommon = Object.entries(resultCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    return { best, worst, biggestWin, biggestLoss, bestDay, worstDay, bestDayRate, worstDayRate, mostCommon };
  }, [picks, sportBreakdown]);

  // Content Performance analytics
  const contentPerformance = useMemo(() => {
    if (posts.length === 0) return { postStats: [], topPost: null, insights: [] as string[], engagementByType: [] as { type: string; views: number; conversions: number }[] };

    const postStats = posts.map(post => {
      const postViews = analyticsEvents.filter(e => e.post_id === post.id && e.event_type === 'post_view').length;
      const postClicks = analyticsEvents.filter(e => e.post_id === post.id && e.event_type === 'subscribe_click').length;
      const conversionRate = postViews > 0 ? Math.round((postClicks / postViews) * 100) : 0;
      const contentType = post.is_premium ? 'Premium' : 'Free';
      const dayOfWeek = new Date(post.created_at).getDay();

      // Find picks posted on same day to correlate
      const postDate = post.created_at.split('T')[0];
      const relatedPicks = picks.filter(p => p.date === postDate);
      const pickProfit = relatedPicks.reduce((s, p) => s + (p.units_won_lost || 0), 0);

      return {
        id: post.id, title: post.title, date: post.created_at, is_premium: post.is_premium,
        views: postViews, conversions: postClicks, conversionRate, contentType,
        dayOfWeek, relatedPicks: relatedPicks.length, pickProfit,
        engagementScore: Math.min(100, postViews * 2 + postClicks * 10),
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore);

    const topPost = postStats[0] || null;

    // Generate insights
    const insightsList: string[] = [];

    // Premium vs Free performance
    const premiumPosts = postStats.filter(p => p.is_premium);
    const freePosts = postStats.filter(p => !p.is_premium);
    const avgPremiumEng = premiumPosts.length > 0 ? premiumPosts.reduce((s, p) => s + p.engagementScore, 0) / premiumPosts.length : 0;
    const avgFreeEng = freePosts.length > 0 ? freePosts.reduce((s, p) => s + p.engagementScore, 0) / freePosts.length : 0;
    if (premiumPosts.length > 0 && freePosts.length > 0) {
      if (avgPremiumEng > avgFreeEng * 1.2) insightsList.push('Premium content outperforms free content — consider creating more exclusive picks posts.');
      else if (avgFreeEng > avgPremiumEng * 1.2) insightsList.push('Free content drives more engagement — use it as a funnel to convert subscribers.');
    }

    // Best posting day
    const dayMap: Record<number, number[]> = {};
    postStats.forEach(p => { if (!dayMap[p.dayOfWeek]) dayMap[p.dayOfWeek] = []; dayMap[p.dayOfWeek].push(p.engagementScore); });
    let bestPostDay = '', bestPostDayAvg = 0;
    Object.entries(dayMap).forEach(([d, scores]) => { const avg = scores.reduce((a, b) => a + b, 0) / scores.length; if (avg > bestPostDayAvg) { bestPostDayAvg = avg; bestPostDay = DAYS[parseInt(d)]; } });
    if (bestPostDay) insightsList.push(`Posts published on ${bestPostDay} get the highest engagement — schedule your best content for that day.`);

    // Conversion insight
    const highConvPosts = postStats.filter(p => p.conversionRate > 10);
    if (highConvPosts.length > 0) insightsList.push(`${highConvPosts.length} post(s) have >10% conversion rate — analyze what makes them compelling and replicate the format.`);

    // Pick-content correlation
    const postsWithPicks = postStats.filter(p => p.relatedPicks > 0);
    const postsWithoutPicks = postStats.filter(p => p.relatedPicks === 0);
    if (postsWithPicks.length > 0 && postsWithoutPicks.length > 0) {
      const avgWithPicks = postsWithPicks.reduce((s, p) => s + p.engagementScore, 0) / postsWithPicks.length;
      const avgWithout = postsWithoutPicks.reduce((s, p) => s + p.engagementScore, 0) / postsWithoutPicks.length;
      if (avgWithPicks > avgWithout) insightsList.push('Posts published on days you log picks perform better — your audience values picks-driven content.');
    }

    // Top post insight
    if (topPost && topPost.engagementScore > 0) insightsList.push(`"${topPost.title}" is your top-performing post — create more content in this style.`);

    if (insightsList.length === 0) insightsList.push('Publish more content and track picks to unlock AI-powered insights about what makes you money.');

    // Engagement by type chart
    const engagementByType = [
      { type: 'Premium', views: premiumPosts.reduce((s, p) => s + p.views, 0), conversions: premiumPosts.reduce((s, p) => s + p.conversions, 0) },
      { type: 'Free', views: freePosts.reduce((s, p) => s + p.views, 0), conversions: freePosts.reduce((s, p) => s + p.conversions, 0) },
    ].filter(d => d.views > 0 || d.conversions > 0);

    return { postStats, topPost, insights: insightsList, engagementByType };
  }, [posts, analyticsEvents, picks]);

  const valColor = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-destructive' : 'text-muted-foreground';
  const fmtUnit = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;

  const OddsFields = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className={compact ? 'w-[75px]' : ''}>
        <label className={`text-muted-foreground mb-0.5 block ${compact ? 'text-[10px]' : 'text-xs mb-1'}`}>EU Odds</label>
        <Input type="number" step="0.01" min="1.01" placeholder="1.91" className={compact ? 'h-8 text-xs' : ''} value={form.eu_odds} onChange={e => handleEuChange(e.target.value)} />
      </div>
      <div className={compact ? 'w-[75px]' : ''}>
        <label className={`text-muted-foreground mb-0.5 block ${compact ? 'text-[10px]' : 'text-xs mb-1'}`}>US Odds</label>
        <Input placeholder="-110" className={compact ? 'h-8 text-xs' : ''} value={form.us_odds} onChange={e => handleUsChange(e.target.value)} />
      </div>
    </>
  );

  return (
    <DashboardLayout type="creator">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Performance Tracker
            {verificationStatus.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track, analyze, and optimize your picks</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleImportCSV(e.target.files?.[0])} />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" disabled={importing} onClick={() => importInputRef.current?.click()}><Upload className="h-3 w-3" /> {importing ? 'Importing…' : 'Import'}</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleExportCSV}><Download className="h-3 w-3" /> Export</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleSmartAdd}><Flame className="h-3 w-3" /> Smart Add</Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => { resetForm(); setQuickAddOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add Pick</Button>
        </div>
      </div>

      {/* Verification Progress */}
      {!verificationStatus.isVerified && (
        <div className="rounded-lg border border-border bg-card p-3 mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Verified Performance Progress</p>
              <p className="text-[10px] text-muted-foreground">{verificationStatus.settled}/{verificationStatus.minPicks} picks · {verificationStatus.currentWinRate}% win rate (need {verificationStatus.minWinRate}%)</p>
            </div>
            <Progress value={verificationStatus.progress} className="h-1.5" />
            <p className="text-[9px] text-muted-foreground mt-1">
              {verificationStatus.settled < verificationStatus.minPicks
                ? `Track ${verificationStatus.minPicks - verificationStatus.settled} more picks to become verified`
                : `Improve win rate to ${verificationStatus.minWinRate}%+ to become verified`}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
        {[
          { label: 'Net Profit', value: fmtUnit(stats.totalWonLost) + 'u', icon: DollarSign, positive: stats.totalWonLost >= 0 },
          { label: 'Total Picks', value: stats.totalPicks, icon: Target, neutral: true },
          { label: 'Win Rate', value: `${stats.winRate}%`, icon: Trophy, neutral: true },
          { label: 'ROI', value: `${stats.roi >= 0 ? '+' : ''}${stats.roi}%`, icon: TrendingUp, positive: stats.roi >= 0 },
          { label: 'Risked', value: `${stats.totalRisked.toFixed(1)}u`, icon: Activity, neutral: true },
          { label: 'Streak', value: `${stats.streak}${stats.streakType === 'win' ? 'W' : stats.streakType === 'loss' ? 'L' : '—'}`, icon: Zap, positive: stats.streakType === 'win' },
          { label: 'Best Run', value: `${stats.longestWin}W`, icon: ArrowUpRight, positive: true },
          { label: 'Worst Run', value: `${stats.longestLoss}L`, icon: ArrowDownRight, positive: false },
        ].map(s => {
          const color = s.neutral ? 'text-foreground' : (s.positive ? 'text-emerald-400' : 'text-destructive');
          return (
            <div key={s.label} className="rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-center gap-1 mb-1"><s.icon className="h-2.5 w-2.5 text-muted-foreground" /><span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</span></div>
              <p className={`text-base font-bold leading-none ${color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Biggest Win / Loss */}
      {insights && (insights.biggestWin || insights.biggestLoss) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          {insights.biggestWin && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><Award className="h-4 w-4 text-emerald-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-medium">Biggest Win</p>
                <p className="text-sm font-semibold truncate">{insights.biggestWin.pick_event}</p>
                <p className="text-[10px] text-muted-foreground">{insights.biggestWin.date}</p>
              </div>
              <p className="text-lg font-bold text-emerald-400">+{(insights.biggestWin.units_won_lost || 0).toFixed(1)}u</p>
            </div>
          )}
          {insights.biggestLoss && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10"><TrendingDown className="h-4 w-4 text-destructive" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-destructive/70 uppercase tracking-wider font-medium">Biggest Loss</p>
                <p className="text-sm font-semibold truncate">{insights.biggestLoss.pick_event}</p>
                <p className="text-[10px] text-muted-foreground">{insights.biggestLoss.date}</p>
              </div>
              <p className="text-lg font-bold text-destructive">{(insights.biggestLoss.units_won_lost || 0).toFixed(1)}u</p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {picks.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 mb-5">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cumulative Profit</h3>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={profitChartData}>
                <defs><linearGradient id="cpGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v}u`, 'Profit']} />
                <Area type="monotone" dataKey="profit" stroke="hsl(142, 71%, 45%)" fill="url(#cpGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Distribution</h3>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3}>{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} /></PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-1">{pieData.map(d => (<div key={d.name} className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: d.color }} /><span className="text-[9px] text-muted-foreground">{d.name} ({d.value})</span></div>))}</div>
          </div>
        </div>
      )}

      {/* Quick Add */}
      {quickAddOpen && (
        <div className="rounded-lg border border-primary/20 bg-card p-3 mb-4">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="w-[100px]"><label className="text-[10px] text-muted-foreground mb-0.5 block">Date</label><Input type="date" className="h-8 text-xs" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="flex-1 min-w-[120px]"><label className="text-[10px] text-muted-foreground mb-0.5 block">Pick / Event</label><Input className="h-8 text-xs" placeholder="Chiefs -3.5" value={form.pick_event} onChange={e => setForm(f => ({ ...f, pick_event: e.target.value }))} /></div>
            <div className="w-[80px]"><label className="text-[10px] text-muted-foreground mb-0.5 block">Sport</label><Select value={form.sport} onValueChange={v => setForm(f => ({ ...f, sport: v }))}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <OddsFields compact />
            <div className="w-[60px]"><label className="text-[10px] text-muted-foreground mb-0.5 block">Risked</label><Input type="number" step="0.5" className="h-8 text-xs" value={form.units_risked} onChange={e => setForm(f => ({ ...f, units_risked: e.target.value }))} /></div>
            <div className="w-[85px]"><label className="text-[10px] text-muted-foreground mb-0.5 block">Result</label><Select value={form.result} onValueChange={v => setForm(f => ({ ...f, result: v }))}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-[65px]"><label className="text-[10px] text-muted-foreground mb-0.5 block">+/−</label><Input type="number" step="0.5" className="h-8 text-xs" value={form.units_won_lost} onChange={e => setForm(f => ({ ...f, units_won_lost: e.target.value }))} /></div>
            <Button size="sm" className="h-8 text-xs px-3" onClick={handleSubmit} disabled={upsertMutation.isPending}>Add</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setQuickAddOpen(false)}>✕</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <ListFilter className="h-3 w-3 text-muted-foreground" />
        <Select value={filterSport} onValueChange={setFilterSport}><SelectTrigger className="w-[100px] h-7 text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Sports</SelectItem>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={filterResult} onValueChange={setFilterResult}><SelectTrigger className="w-[100px] h-7 text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Results</SelectItem>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent></Select>
        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} pick{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {picks.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-semibold mb-1">Start tracking your performance</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">Log your picks to get real-time analytics on win rate, ROI, and profitability across sports and time.</p>
          <Button size="sm" onClick={() => { resetForm(); setQuickAddOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add First Pick</Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto max-h-[420px] mb-5">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[78px]">Date</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2">Pick / Event</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[55px]">Sport</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[52px] text-right">EU</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[52px] text-right">US</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[52px] text-right">Risk</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[48px]">Res</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[52px] text-right">+/−</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[56px] text-right">Net</TableHead>
                <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[80px]">Notes</TableHead>
                <TableHead className="py-1.5 px-1 w-[48px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayPicks.map((pick, i) => (
                <TableRow key={pick.id} className={`hover:bg-muted/30 transition-colors ${i % 2 ? 'bg-muted/8' : ''}`}>
                  <TableCell className="text-[10px] py-1 px-2 font-mono text-muted-foreground">{pick.date}</TableCell>
                  <TableCell className="text-[10px] py-1 px-2 font-medium">{pick.pick_event}</TableCell>
                  <TableCell className="py-1 px-2"><span className="text-[8px] font-medium text-muted-foreground bg-muted/50 rounded px-1 py-0.5">{pick.sport}</span></TableCell>
                  <TableCell className="text-[10px] py-1 px-2 text-right font-mono text-muted-foreground">{pick.eu_odds || '—'}</TableCell>
                  <TableCell className="text-[10px] py-1 px-2 text-right font-mono text-muted-foreground">{pick.us_odds || '—'}</TableCell>
                  <TableCell className="text-[10px] py-1 px-2 text-right font-mono">{pick.units_risked}u</TableCell>
                  <TableCell className="py-1 px-2"><span className={`text-[9px] font-bold uppercase ${pick.result === 'win' ? 'text-emerald-400' : pick.result === 'loss' ? 'text-destructive' : 'text-muted-foreground'}`}>{pick.result === 'win' ? '✓ W' : pick.result === 'loss' ? '✗ L' : pick.result === 'push' ? '— P' : '⏳'}</span></TableCell>
                  <TableCell className={`text-[10px] py-1 px-2 text-right font-mono font-medium ${valColor(pick.units_won_lost || 0)}`}>{fmtUnit(pick.units_won_lost || 0)}</TableCell>
                  <TableCell className={`text-[10px] py-1 px-2 text-right font-mono font-semibold ${valColor(pick.runningTotal)}`}>{fmtUnit(pick.runningTotal)}</TableCell>
                  <TableCell className="text-[9px] py-1 px-2 text-muted-foreground/60 max-w-[80px] truncate">{pick.notes || ''}</TableCell>
                  <TableCell className="py-1 px-1"><div className="flex gap-0.5"><Button variant="ghost" size="icon" className="h-5 w-5 opacity-30 hover:opacity-100" onClick={() => handleDuplicate(pick)} title="Duplicate"><Copy className="h-2.5 w-2.5" /></Button><Button variant="ghost" size="icon" className="h-5 w-5 opacity-30 hover:opacity-100" onClick={() => handleEdit(pick)}><Pencil className="h-2.5 w-2.5" /></Button><Button variant="ghost" size="icon" className="h-5 w-5 opacity-30 hover:opacity-100 text-destructive" onClick={() => deleteMutation.mutate(pick.id)}><Trash2 className="h-2.5 w-2.5" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-t-2 border-border">
                <TableCell colSpan={5} className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2">Totals</TableCell>
                <TableCell className="text-[10px] py-1.5 px-2 text-right font-mono font-bold">{totals.risked.toFixed(1)}u</TableCell>
                <TableCell className="py-1.5 px-2"></TableCell>
                <TableCell className={`text-[10px] py-1.5 px-2 text-right font-mono font-bold ${valColor(totals.wonLost)}`}>{fmtUnit(totals.wonLost)}</TableCell>
                <TableCell className={`text-[10px] py-1.5 px-2 text-right font-mono font-bold ${valColor(totals.wonLost)}`}>{fmtUnit(totals.wonLost)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Analytics Tabs */}
      {picks.length > 0 && (
        <Tabs defaultValue="content" className="mt-2">
          <TabsList className="bg-muted/50 h-8">
            <TabsTrigger value="content" className="text-[11px] h-6">Content</TabsTrigger>
            <TabsTrigger value="sport" className="text-[11px] h-6">By Sport</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[11px] h-6">Monthly</TabsTrigger>
            <TabsTrigger value="insights" className="text-[11px] h-6">Insights</TabsTrigger>
          </TabsList>

          {/* Content Performance Tab */}
          <TabsContent value="content">
            <div className="space-y-4 mt-3">
              {/* AI Insights Banner */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Content Intelligence</h3>
                </div>
                <div className="space-y-2">
                  {contentPerformance.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-primary mt-0.5">→</span>
                      <span className="text-muted-foreground">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement by Type Chart */}
              {contentPerformance.engagementByType.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Engagement by Content Type</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={contentPerformance.engagementByType}>
                      <XAxis dataKey="type" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="views" name="Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conversions" name="Conversions" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Post Performance Table */}
              {contentPerformance.postStats.length > 0 ? (
                <div className="rounded-lg border border-border overflow-auto max-h-[360px]">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="bg-muted/60 hover:bg-muted/60">
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2">Post</TableHead>
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[50px]">Type</TableHead>
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[50px] text-right"><Eye className="h-2.5 w-2.5 inline" /></TableHead>
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[50px] text-right"><MousePointerClick className="h-2.5 w-2.5 inline" /></TableHead>
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[50px] text-right">CVR</TableHead>
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[60px] text-right">Picks</TableHead>
                        <TableHead className="text-[9px] font-semibold uppercase tracking-wider py-1.5 px-2 w-[110px]">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentPerformance.postStats.map((post, i) => (
                        <TableRow key={post.id} className={`hover:bg-muted/30 ${i % 2 ? 'bg-muted/8' : ''}`}>
                          <TableCell className="py-1.5 px-2">
                            <p className="text-[10px] font-medium truncate max-w-[200px]">{post.title}</p>
                            <p className="text-[8px] text-muted-foreground">{new Date(post.date).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <span className={`text-[8px] font-medium rounded px-1.5 py-0.5 ${post.is_premium ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {post.contentType}
                            </span>
                          </TableCell>
                          <TableCell className="text-[10px] py-1.5 px-2 text-right font-mono">{post.views}</TableCell>
                          <TableCell className="text-[10px] py-1.5 px-2 text-right font-mono">{post.conversions}</TableCell>
                          <TableCell className="text-[10px] py-1.5 px-2 text-right font-mono">{post.conversionRate}%</TableCell>
                          <TableCell className="text-[10px] py-1.5 px-2 text-right">
                            {post.relatedPicks > 0 ? (
                              <span className={`font-mono ${valColor(post.pickProfit)}`}>{post.relatedPicks}p · {fmtUnit(post.pickProfit)}u</span>
                            ) : <span className="text-muted-foreground/40">—</span>}
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <Progress value={post.engagementScore} className="h-1 flex-1" />
                              <span className="text-[9px] font-bold text-muted-foreground w-[20px] text-right">{post.engagementScore}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">No posts yet</p>
                  <p className="text-xs text-muted-foreground">Publish content to see which posts drive the most engagement and revenue.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sport">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
              {sportBreakdown.map(s => (
                <div key={s.sport} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold">{s.sport}</span><span className="text-[9px] text-muted-foreground">{s.picks} picks</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><p className="text-[9px] text-muted-foreground uppercase">Win Rate</p><p className="text-sm font-bold">{s.winRate}%</p></div>
                    <div><p className="text-[9px] text-muted-foreground uppercase">Profit</p><p className={`text-sm font-bold ${valColor(s.profit)}`}>{fmtUnit(s.profit)}u</p></div>
                    <div><p className="text-[9px] text-muted-foreground uppercase">ROI</p><p className={`text-sm font-bold ${valColor(s.roi)}`}>{s.roi >= 0 ? '+' : ''}{s.roi}%</p></div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="rounded-lg border border-border overflow-hidden mt-3">
              <Table>
                <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3">Month</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Picks</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Win Rate</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Risked</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Profit</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">ROI</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {monthlyBreakdown.map((m, i) => (
                    <TableRow key={m.month} className={i % 2 ? 'bg-muted/8' : ''}>
                      <TableCell className="text-[11px] py-1.5 px-3 font-medium">{m.label}</TableCell>
                      <TableCell className="text-[11px] py-1.5 px-3 text-right font-mono">{m.picks}</TableCell>
                      <TableCell className="text-[11px] py-1.5 px-3 text-right font-mono">{m.winRate}%</TableCell>
                      <TableCell className="text-[11px] py-1.5 px-3 text-right font-mono">{m.risked.toFixed(1)}u</TableCell>
                      <TableCell className={`text-[11px] py-1.5 px-3 text-right font-mono font-medium ${valColor(m.profit)}`}>{fmtUnit(m.profit)}u</TableCell>
                      <TableCell className={`text-[11px] py-1.5 px-3 text-right font-mono font-medium ${valColor(m.roi)}`}>{m.roi >= 0 ? '+' : ''}{m.roi}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            {insights && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                {[
                  { label: 'Best Sport', value: insights.best?.sport || 'N/A', sub: insights.best ? `${insights.best.winRate}% WR · ${fmtUnit(insights.best.profit)}u` : '' },
                  { label: 'Worst Sport', value: insights.worst?.sport || 'N/A', sub: insights.worst ? `${insights.worst.winRate}% WR · ${fmtUnit(insights.worst.profit)}u` : '' },
                  { label: 'Best Day', value: insights.bestDay || 'N/A', sub: `${Math.round(insights.bestDayRate)}% win rate` },
                  { label: 'Worst Day', value: insights.worstDay || 'N/A', sub: `${Math.round(insights.worstDayRate)}% win rate` },
                  { label: 'Avg Risked', value: `${stats.avgRisked.toFixed(1)}u`, sub: 'per pick' },
                  { label: 'Most Common', value: insights.mostCommon.toUpperCase(), sub: 'result type' },
                  { label: 'Longest W Streak', value: `${stats.longestWin}`, sub: 'consecutive wins' },
                  { label: 'Longest L Streak', value: `${stats.longestLoss}`, sub: 'consecutive losses' },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                    {item.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Pick</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Date</label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Sport</label><Select value={form.sport} onValueChange={v => setForm(f => ({ ...f, sport: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Pick / Event</label><Input value={form.pick_event} onChange={e => setForm(f => ({ ...f, pick_event: e.target.value }))} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><OddsFields /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Units Risked</label><Input type="number" step="0.5" value={form.units_risked} onChange={e => setForm(f => ({ ...f, units_risked: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Result</label><Select value={form.result} onValueChange={v => setForm(f => ({ ...f, result: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Units Won/Lost</label><Input type="number" step="0.5" value={form.units_won_lost} onChange={e => setForm(f => ({ ...f, units_won_lost: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={handleSubmit} disabled={upsertMutation.isPending}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CreatorPerformanceTracker;
