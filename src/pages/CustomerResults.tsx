import { useState, useMemo, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ListFilter, Download, Upload, BarChart3, Activity, Calendar, Award, TrendingDown,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { downloadCsv, readFileAsText } from '@/lib/csv';
import { PICK_CSV_HEADERS, parsePickCsv } from '@/lib/pickCsv';

// --- Types ---
interface PickEntry {
  id: string;
  date: string;
  pick_event: string;
  sport: string;
  eu_odds: number | null;
  us_odds: string | null;
  units_risked: number;
  result: string;
  units_won_lost: number | null;
  notes: string | null;
}

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'MMA', 'Tennis', 'Other'];
const RESULTS = ['win', 'loss', 'push', 'pending'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// --- Odds Conversion ---
function euToUs(eu: number): string {
  if (eu >= 2) return `+${Math.round((eu - 1) * 100)}`;
  if (eu > 1) return `-${Math.round(100 / (eu - 1))}`;
  return '';
}

function usToEu(us: string): number | null {
  const n = parseFloat(us);
  if (isNaN(n)) return null;
  if (n > 0) return parseFloat((n / 100 + 1).toFixed(3));
  if (n < 0) return parseFloat((100 / Math.abs(n) + 1).toFixed(3));
  return null;
}

const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  pick_event: '',
  sport: 'NFL',
  eu_odds: '',
  us_odds: '',
  units_risked: '1',
  result: 'pending',
  units_won_lost: '0',
  notes: '',
  lastOddsField: '' as 'eu' | 'us' | '',
};

// --- Component ---
const CustomerResults = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSport, setFilterSport] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');

  const { data: picks = [], isLoading } = useQuery({
    queryKey: ['pick_tracker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pick_tracker' as any)
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PickEntry[];
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async (entry: any) => {
      if (editId) {
        const { error } = await supabase.from('pick_tracker' as any).update(entry).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pick_tracker' as any).insert({ ...entry, user_id: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pick_tracker'] });
      toast.success(editId ? 'Pick updated' : 'Pick added');
      resetForm();
    },
    onError: () => toast.error('Failed to save pick'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pick_tracker' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pick_tracker'] });
      toast.success('Pick deleted');
    },
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); setDialogOpen(false); setQuickAddOpen(false); };

  // --- CSV import / export ---
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExportCSV = () => {
    if (picks.length === 0) { toast.error('No picks to export'); return; }
    downloadCsv(
      `my-results-${new Date().toISOString().split('T')[0]}.csv`,
      PICK_CSV_HEADERS,
      picks.map(p => [p.date, p.pick_event, p.sport, p.eu_odds ?? '', p.us_odds ?? '', p.units_risked, p.result, p.units_won_lost ?? 0, p.notes ?? '']),
    );
    toast.success(`Exported ${picks.length} picks`);
  };

  const handleImportCSV = async (file: File | undefined) => {
    if (!file) return;
    if (!user?.id) { toast.error('You must be signed in to import'); return; }
    setImporting(true);
    try {
      const { rows, skipped } = parsePickCsv(await readFileAsText(file));
      if (rows.length === 0) { toast.error('No valid rows found in that CSV'); return; }
      const { error } = await supabase
        .from('pick_tracker' as any)
        .insert(rows.map(r => ({ ...r, user_id: user.id })));
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['pick_tracker'] });
      toast.success(`Imported ${rows.length} picks${skipped ? ` — ${skipped} rows skipped` : ''}`);
    } catch {
      toast.error('Import failed — check the CSV format');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleEuChange = useCallback((val: string) => {
    const eu = parseFloat(val);
    setForm(f => ({
      ...f,
      eu_odds: val,
      us_odds: !isNaN(eu) && eu > 1 ? euToUs(eu) : f.us_odds,
      lastOddsField: 'eu',
    }));
  }, []);

  const handleUsChange = useCallback((val: string) => {
    const eu = usToEu(val);
    setForm(f => ({
      ...f,
      us_odds: val,
      eu_odds: eu !== null ? String(eu) : f.eu_odds,
      lastOddsField: 'us',
    }));
  }, []);

  const handleEdit = (pick: PickEntry) => {
    setForm({
      date: pick.date,
      pick_event: pick.pick_event,
      sport: pick.sport,
      eu_odds: pick.eu_odds ? String(pick.eu_odds) : '',
      us_odds: pick.us_odds || '',
      units_risked: String(pick.units_risked),
      result: pick.result,
      units_won_lost: String(pick.units_won_lost || 0),
      notes: pick.notes || '',
      lastOddsField: '',
    });
    setEditId(pick.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.pick_event.trim()) { toast.error('Pick/Event is required'); return; }
    if (!form.eu_odds && !form.us_odds) { toast.error('Enter EU or US odds'); return; }
    const euVal = form.eu_odds ? parseFloat(form.eu_odds) : null;
    const usVal = form.us_odds || null;
    upsertMutation.mutate({
      date: form.date,
      pick_event: form.pick_event,
      sport: form.sport,
      eu_odds: euVal,
      us_odds: usVal,
      units_risked: parseFloat(form.units_risked) || 1,
      result: form.result,
      units_won_lost: parseFloat(form.units_won_lost) || 0,
      notes: form.notes || null,
    });
  };

  // --- Derived Data ---
  const filtered = useMemo(() => picks.filter(p => {
    if (filterSport !== 'all' && p.sport !== filterSport) return false;
    if (filterResult !== 'all' && p.result !== filterResult) return false;
    return true;
  }), [picks, filterSport, filterResult]);

  const picksWithRunning = useMemo(() => {
    let running = 0;
    return filtered.map(p => { running += (p.units_won_lost || 0); return { ...p, runningTotal: running }; });
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

    // Streaks
    const sortedDesc = [...picks].reverse().filter(p => p.result === 'win' || p.result === 'loss');
    let streak = 0, streakType = '';
    for (const p of sortedDesc) {
      if (!streakType) { streakType = p.result; streak = 1; }
      else if (p.result === streakType) streak++;
      else break;
    }

    // Longest streaks
    let longestWin = 0, longestLoss = 0, curWin = 0, curLoss = 0;
    for (const p of picks) {
      if (p.result === 'win') { curWin++; curLoss = 0; longestWin = Math.max(longestWin, curWin); }
      else if (p.result === 'loss') { curLoss++; curWin = 0; longestLoss = Math.max(longestLoss, curLoss); }
      else { curWin = 0; curLoss = 0; }
    }

    return { totalPicks: picks.length, settled: settled.length, wins, losses, pushes, totalRisked, totalWonLost, winRate, roi, streak, streakType, longestWin, longestLoss, avgRisked };
  }, [picks]);

  const totals = useMemo(() => {
    const risked = filtered.reduce((s, p) => s + (p.units_risked || 0), 0);
    const wonLost = filtered.reduce((s, p) => s + (p.units_won_lost || 0), 0);
    return { risked, wonLost };
  }, [filtered]);

  // Profit chart
  const profitChartData = useMemo(() => {
    let running = 0;
    return picks.filter(p => p.result !== 'pending').map(p => {
      running += (p.units_won_lost || 0);
      return { date: p.date, profit: parseFloat(running.toFixed(1)) };
    });
  }, [picks]);

  const pieData = useMemo(() => [
    { name: 'Wins', value: stats.wins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Losses', value: stats.losses, color: 'hsl(0, 84%, 60%)' },
    { name: 'Pushes', value: stats.pushes, color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0), [stats]);

  // --- Sport Breakdown ---
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

  // --- Monthly Breakdown ---
  const monthlyBreakdown = useMemo(() => {
    const map: Record<string, { picks: number; wins: number; profit: number; risked: number }> = {};
    picks.forEach(p => {
      const m = p.date.substring(0, 7); // YYYY-MM
      if (!map[m]) map[m] = { picks: 0, wins: 0, profit: 0, risked: 0 };
      map[m].picks++;
      if (p.result === 'win') map[m].wins++;
      map[m].profit += (p.units_won_lost || 0);
      if (p.result !== 'pending') map[m].risked += (p.units_risked || 0);
    });
    return Object.entries(map).map(([month, d]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...d,
      winRate: d.picks > 0 ? Math.round((d.wins / d.picks) * 100) : 0,
      roi: d.risked > 0 ? Math.round((d.profit / d.risked) * 100) : 0,
    })).sort((a, b) => b.month.localeCompare(a.month));
  }, [picks]);

  // --- Performance Insights ---
  const insights = useMemo(() => {
    if (picks.length === 0) return null;
    const settled = picks.filter(p => p.result !== 'pending');

    // Best / worst sport
    const best = sportBreakdown.length > 0 ? sportBreakdown[0] : null;
    const worst = sportBreakdown.length > 0 ? sportBreakdown[sportBreakdown.length - 1] : null;

    // Biggest win / loss
    const sortedByUnits = [...settled].sort((a, b) => (b.units_won_lost || 0) - (a.units_won_lost || 0));
    const biggestWin = sortedByUnits.find(p => (p.units_won_lost || 0) > 0) || null;
    const biggestLoss = [...sortedByUnits].reverse().find(p => (p.units_won_lost || 0) < 0) || null;

    // Best / worst day of week
    const dayMap: Record<number, { wins: number; total: number }> = {};
    settled.forEach(p => {
      const d = new Date(p.date).getDay();
      if (!dayMap[d]) dayMap[d] = { wins: 0, total: 0 };
      dayMap[d].total++;
      if (p.result === 'win') dayMap[d].wins++;
    });
    let bestDay = '', worstDay = '', bestDayRate = -1, worstDayRate = 101;
    Object.entries(dayMap).forEach(([d, v]) => {
      const rate = v.total > 0 ? v.wins / v.total * 100 : 0;
      if (rate > bestDayRate) { bestDayRate = rate; bestDay = DAYS[parseInt(d)]; }
      if (rate < worstDayRate) { worstDayRate = rate; worstDay = DAYS[parseInt(d)]; }
    });

    // Most common result
    const resultCounts: Record<string, number> = {};
    settled.forEach(p => { resultCounts[p.result] = (resultCounts[p.result] || 0) + 1; });
    const mostCommon = Object.entries(resultCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { best, worst, biggestWin, biggestLoss, bestDay, worstDay, bestDayRate, worstDayRate, mostCommon };
  }, [picks, sportBreakdown]);

  // --- Odds form fields component ---
  const OddsFields = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className={compact ? 'w-[75px]' : ''}>
        <label className={`text-muted-foreground mb-0.5 block ${compact ? 'text-[10px]' : 'text-xs mb-1'}`}>EU Odds</label>
        <Input
          type="number"
          step="0.01"
          min="1.01"
          placeholder="1.91"
          className={compact ? 'h-8 text-xs' : ''}
          value={form.eu_odds}
          onChange={e => handleEuChange(e.target.value)}
        />
      </div>
      <div className={compact ? 'w-[75px]' : ''}>
        <label className={`text-muted-foreground mb-0.5 block ${compact ? 'text-[10px]' : 'text-xs mb-1'}`}>US Odds</label>
        <Input
          placeholder="-110"
          className={compact ? 'h-8 text-xs' : ''}
          value={form.us_odds}
          onChange={e => handleUsChange(e.target.value)}
        />
      </div>
    </>
  );

  const valColor = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-destructive' : 'text-muted-foreground';
  const fmtUnit = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;

  return (
    <DashboardLayout type="member">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Results</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Advanced pick tracker & performance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleImportCSV(e.target.files?.[0])} />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" disabled={importing} onClick={() => importInputRef.current?.click()}>
            <Upload className="h-3 w-3" /> {importing ? 'Importing…' : 'Import'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleExportCSV}>
            <Download className="h-3 w-3" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => { resetForm(); setQuickAddOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Add Pick
          </Button>
        </div>
      </div>

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
              <div className="flex items-center gap-1 mb-1">
                <s.icon className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={`text-base font-bold leading-none ${color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Biggest Win / Loss Cards */}
      {insights && (insights.biggestWin || insights.biggestLoss) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          {insights.biggestWin && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
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
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v}u`, 'Profit']} />
                <Area type="monotone" dataKey="profit" stroke="hsl(142, 71%, 45%)" fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Distribution</h3>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[9px] text-muted-foreground">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Bar */}
      {quickAddOpen && (
        <div className="rounded-lg border border-primary/20 bg-card p-3 mb-4">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="w-[100px]">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Date</label>
              <Input type="date" className="h-8 text-xs" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Pick / Event</label>
              <Input className="h-8 text-xs" placeholder="Chiefs -3.5" value={form.pick_event} onChange={e => setForm(f => ({ ...f, pick_event: e.target.value }))} />
            </div>
            <div className="w-[80px]">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Sport</label>
              <Select value={form.sport} onValueChange={v => setForm(f => ({ ...f, sport: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <OddsFields compact />
            <div className="w-[60px]">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Risked</label>
              <Input type="number" step="0.5" className="h-8 text-xs" value={form.units_risked} onChange={e => setForm(f => ({ ...f, units_risked: e.target.value }))} />
            </div>
            <div className="w-[85px]">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Result</label>
              <Select value={form.result} onValueChange={v => setForm(f => ({ ...f, result: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-[65px]">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">+/−</label>
              <Input type="number" step="0.5" className="h-8 text-xs" value={form.units_won_lost} onChange={e => setForm(f => ({ ...f, units_won_lost: e.target.value }))} />
            </div>
            <Button size="sm" className="h-8 text-xs px-3" onClick={handleSubmit} disabled={upsertMutation.isPending}>Add</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setQuickAddOpen(false)}>✕</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <ListFilter className="h-3 w-3 text-muted-foreground" />
        <Select value={filterSport} onValueChange={setFilterSport}>
          <SelectTrigger className="w-[100px] h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Sports</SelectItem>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterResult} onValueChange={setFilterResult}>
          <SelectTrigger className="w-[100px] h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Results</SelectItem>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} pick{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tracker Table */}
      {picks.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-semibold mb-1">Start tracking your picks</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">Log every pick to track your win rate, ROI, and profit. Your personal performance spreadsheet.</p>
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
                <TableRow key={pick.id} className={`hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/8'}`}>
                  <TableCell className="text-[10px] py-1 px-2 font-mono text-muted-foreground">{pick.date}</TableCell>
                  <TableCell className="text-[10px] py-1 px-2 font-medium">{pick.pick_event}</TableCell>
                  <TableCell className="py-1 px-2"><span className="text-[8px] font-medium text-muted-foreground bg-muted/50 rounded px-1 py-0.5">{pick.sport}</span></TableCell>
                  <TableCell className="text-[10px] py-1 px-2 text-right font-mono text-muted-foreground">{pick.eu_odds || '—'}</TableCell>
                  <TableCell className="text-[10px] py-1 px-2 text-right font-mono text-muted-foreground">{pick.us_odds || '—'}</TableCell>
                  <TableCell className="text-[10px] py-1 px-2 text-right font-mono">{pick.units_risked}u</TableCell>
                  <TableCell className="py-1 px-2">
                    <span className={`text-[9px] font-bold uppercase ${
                      pick.result === 'win' ? 'text-emerald-400' : pick.result === 'loss' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {pick.result === 'win' ? '✓ W' : pick.result === 'loss' ? '✗ L' : pick.result === 'push' ? '— P' : '⏳'}
                    </span>
                  </TableCell>
                  <TableCell className={`text-[10px] py-1 px-2 text-right font-mono font-medium ${valColor(pick.units_won_lost || 0)}`}>
                    {fmtUnit(pick.units_won_lost || 0)}
                  </TableCell>
                  <TableCell className={`text-[10px] py-1 px-2 text-right font-mono font-semibold ${valColor(pick.runningTotal)}`}>
                    {fmtUnit(pick.runningTotal)}
                  </TableCell>
                  <TableCell className="text-[9px] py-1 px-2 text-muted-foreground/60 max-w-[80px] truncate">{pick.notes || ''}</TableCell>
                  <TableCell className="py-1 px-1">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-30 hover:opacity-100" onClick={() => handleEdit(pick)}><Pencil className="h-2.5 w-2.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-30 hover:opacity-100 text-destructive" onClick={() => deleteMutation.mutate(pick.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                    </div>
                  </TableCell>
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
                <TableCell colSpan={2} className="py-1.5 px-2"></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Analytics Tabs */}
      {picks.length > 0 && (
        <Tabs defaultValue="sport" className="mt-2">
          <TabsList className="bg-muted/50 h-8">
            <TabsTrigger value="sport" className="text-[11px] h-6">By Sport</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[11px] h-6">Monthly</TabsTrigger>
            <TabsTrigger value="insights" className="text-[11px] h-6">Insights</TabsTrigger>
          </TabsList>

          {/* Sport Breakdown */}
          <TabsContent value="sport">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
              {sportBreakdown.map(s => (
                <div key={s.sport} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">{s.sport}</span>
                    <span className="text-[9px] text-muted-foreground">{s.picks} picks</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Win Rate</p>
                      <p className="text-sm font-bold">{s.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Profit</p>
                      <p className={`text-sm font-bold ${valColor(s.profit)}`}>{fmtUnit(s.profit)}u</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">ROI</p>
                      <p className={`text-sm font-bold ${valColor(s.roi)}`}>{s.roi >= 0 ? '+' : ''}{s.roi}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Monthly Breakdown */}
          <TabsContent value="monthly">
            <div className="rounded-lg border border-border overflow-hidden mt-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3">Month</TableHead>
                    <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Picks</TableHead>
                    <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Win Rate</TableHead>
                    <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Risked</TableHead>
                    <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">Profit</TableHead>
                    <TableHead className="text-[9px] font-semibold uppercase py-1.5 px-3 text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
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

          {/* Performance Insights */}
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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sport</label>
                <Select value={form.sport} onValueChange={v => setForm(f => ({ ...f, sport: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pick / Event</label>
              <Input value={form.pick_event} onChange={e => setForm(f => ({ ...f, pick_event: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <OddsFields />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Units Risked</label>
                <Input type="number" step="0.5" value={form.units_risked} onChange={e => setForm(f => ({ ...f, units_risked: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Result</label>
                <Select value={form.result} onValueChange={v => setForm(f => ({ ...f, result: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESULTS.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Units Won/Lost</label>
                <Input type="number" step="0.5" value={form.units_won_lost} onChange={e => setForm(f => ({ ...f, units_won_lost: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
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

export default CustomerResults;
