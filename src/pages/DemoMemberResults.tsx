import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  TrendingUp, Target, Trophy, BarChart3, Zap, CheckCircle2, XCircle, Clock, Plus, Trash2, Download,
} from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore, unitsFor, usToDecimal, PickResult } from '@/components/demo/demoMemberStore';

const DemoMemberResults = () => {
  const store = useDemoMemberStore();
  const { state, metrics } = store;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ event: '', sport: 'NFL', usOdds: '-110', units: '1', creatorId: '' });

  const rows = useMemo(
    () => [...state.tracked].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [state.tracked],
  );

  const weekly = useMemo(() => {
    const buckets = new Map<string, { plays: number; wins: number }>();
    rows.forEach(t => {
      if (t.result === 'pending') return;
      const d = new Date(t.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = format(monday, 'MMM d');
      const b = buckets.get(key) ?? { plays: 0, wins: 0 };
      b.plays++;
      if (t.result === 'won') b.wins++;
      buckets.set(key, b);
    });
    return [...buckets.entries()].map(([week, v]) => ({ week, ...v })).reverse();
  }, [rows]);

  const addPick = () => {
    if (!form.event.trim()) { toast.error('Add an event name'); return; }
    store.trackPick({
      postId: null,
      creatorId: form.creatorId || state.subscribedCreatorIds[0] || state.creators[0].id,
      event: form.event.trim(),
      sport: form.sport,
      usOdds: form.usOdds,
      units: Number(form.units) || 1,
    });
    toast.success('Pick added');
    setOpen(false);
    setForm({ event: '', sport: 'NFL', usOdds: '-110', units: '1', creatorId: '' });
  };

  const exportCsv = () => {
    const csv = [
      'Date,Event,Sport,Odds,Units,Result,Units P/L',
      ...rows.map(t => [format(new Date(t.date), 'yyyy-MM-dd'), `"${t.event}"`, t.sport, t.usOdds, t.units, t.result, unitsFor(t)].join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'my-results.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DemoMemberShell
      title="My Results"
      subtitle="Every pick you tracked, with live profit and ROI"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={exportCsv}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" className="text-xs" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add pick</Button>
        </div>
      }
    >
      {/* Win rate hero */}
      <div className="rounded-xl border border-primary/20 bg-card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative flex items-center justify-center">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray={`${metrics.winRate}, 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-2xl font-bold text-primary">{metrics.winRate}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">Your Win Rate</p>
            <p className="text-xs text-muted-foreground mb-2">Based on {metrics.settledPicks} settled picks ({metrics.pending} pending)</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={`text-[9px] ${metrics.unitsNet >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                {metrics.unitsNet >= 0 ? '+' : ''}{metrics.unitsNet}u · {metrics.roi}% ROI
              </Badge>
              {metrics.streak > 0 && (
                <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                  <Zap className="h-2.5 w-2.5 mr-0.5" /> {metrics.streak}W streak
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Picks', value: metrics.totalPicks, icon: BarChart3 },
          { label: 'Wins', value: metrics.wins, icon: Trophy },
          { label: 'Losses', value: metrics.losses, icon: Target },
          { label: 'Best Creator', value: metrics.bestCreator ? `${metrics.bestCreator.winRate}%` : '—', icon: TrendingUp, sub: metrics.bestCreator?.creator.name },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground mb-2" />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
            {stat.sub && <p className="text-[10px] text-primary mt-0.5 truncate">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Weekly */}
      {weekly.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Weekly Breakdown</h2>
          <div className="space-y-3">
            {weekly.map(w => (
              <div key={w.week} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-16">{w.week}</span>
                <div className="flex-1"><Progress value={(w.wins / w.plays) * 100} className="h-2" /></div>
                <span className="text-xs font-medium w-24 text-right">{w.wins}/{w.plays} ({Math.round((w.wins / w.plays) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By creator */}
      {metrics.byCreator.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Performance by Creator</h2>
          <div className="space-y-2">
            {metrics.byCreator.map(c => (
              <div key={c.creator.id} className="flex items-center gap-3 text-xs">
                <span className="flex-1 font-medium truncate">{c.creator.name}</span>
                <span className="text-muted-foreground w-16 text-right">{c.picks} picks</span>
                <span className="w-12 text-right">{c.winRate}%</span>
                <span className={`w-16 text-right font-medium ${c.units >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {c.units >= 0 ? '+' : ''}{c.units}u
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rows */}
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Tracked Picks</h2>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No picks tracked yet — use “Track” on any feed post.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {rows.map((t, i) => {
            const pl = unitsFor(t);
            return (
              <div key={t.id} className={`flex flex-wrap items-center gap-3 px-5 py-3.5 ${i < rows.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/20 transition-colors`}>
                {t.result === 'won' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : t.result === 'lost' ? <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-medium">{t.event}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {store.creatorById(t.creatorId)?.name} · {t.sport} · {t.units}u @ {t.usOdds} ({usToDecimal(t.usOdds)?.toFixed(2) ?? '—'})
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(t.date), 'MMM d')}</span>
                <span className={`text-xs font-medium w-14 text-right ${pl > 0 ? 'text-emerald-500' : pl < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {pl > 0 ? '+' : ''}{pl}u
                </span>
                {t.result === 'pending' ? (
                  <div className="flex gap-1">
                    {(['won', 'lost', 'push'] as PickResult[]).map(r => (
                      <Button key={r} size="sm" variant="outline" className="h-6 px-2 text-[10px] capitalize"
                        onClick={() => { store.setTrackedResult(t.id, r); toast.success(`Marked ${r}`); }}>{r}</Button>
                    ))}
                  </div>
                ) : (
                  <Badge variant="outline" className={`text-[9px] ${
                    t.result === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : t.result === 'lost' ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-muted text-muted-foreground'
                  }`}>{t.result.toUpperCase()}</Badge>
                )}
                <button aria-label="Remove pick from tracker" title="Remove pick" onClick={() => { store.removeTracked(t.id); toast.info('Pick removed'); }} className="p-2 -m-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add a pick manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Event</Label>
              <Input value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} className="mt-1" placeholder="Chiefs vs Raiders" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sport</Label>
                <Input value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Units</Label>
                <Input type="number" min="0.5" step="0.5" value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">US odds</Label>
              <Input value={form.usOdds} onChange={e => setForm({ ...form, usOdds: e.target.value })} className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">EU odds: {usToDecimal(form.usOdds)?.toFixed(2) ?? '—'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={addPick}>Add pick</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoMemberShell>
  );
};

export default DemoMemberResults;
