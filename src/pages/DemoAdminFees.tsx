import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Percent, DollarSign, TrendingUp, Crown, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDemoAdminStore } from '@/components/demo/demoAdminStore';

const DemoAdminFees = () => {
  const store = useDemoAdminStore();
  const { settings } = store.state;
  const { metrics } = store;

  const [standard, setStandard] = useState(String(settings.standardFeePercent));
  const [intro, setIntro] = useState(String(settings.introFeePercent));
  const [days, setDays] = useState(String(settings.introPeriodDays));

  useEffect(() => {
    setStandard(String(settings.standardFeePercent));
    setIntro(String(settings.introFeePercent));
    setDays(String(settings.introPeriodDays));
  }, [settings.standardFeePercent, settings.introFeePercent, settings.introPeriodDays]);

  const dirty =
    Number(standard) !== settings.standardFeePercent ||
    Number(intro) !== settings.introFeePercent ||
    Number(days) !== settings.introPeriodDays;

  const save = () => {
    const s = Number(standard), i = Number(intro), d = Number(days);
    if ([s, i].some(v => Number.isNaN(v) || v < 0 || v > 50)) { toast.error('Fees must be between 0% and 50%'); return; }
    if (Number.isNaN(d) || d < 0 || d > 365) { toast.error('Intro period must be 0–365 days'); return; }
    if (i > s) { toast.error('Intro fee should not exceed the standard fee'); return; }
    store.updateSettings({ standardFeePercent: s, introFeePercent: i, introPeriodDays: d });
    toast.success('Fee rules saved — applied across all transactions');
  };

  const discard = () => {
    setStandard(String(settings.standardFeePercent));
    setIntro(String(settings.introFeePercent));
    setDays(String(settings.introPeriodDays));
  };

  const restoreDefaults = () => {
    store.updateSettings({ standardFeePercent: 10, introFeePercent: 5, introPeriodDays: 30 });
    toast.success('Fee rules restored to platform defaults (10% standard, 5% intro for 30 days)');
  };

  /** Simulated platform earnings if the draft (unsaved) rates were applied to current volume. */
  const draftStandard = Number(standard);
  const projected = Number.isNaN(draftStandard) ? null : +(metrics.volume * (draftStandard / 100)).toFixed(2);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Fees</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Commission rules and the revenue they generate</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5"><DollarSign className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">${metrics.volume.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Total Platform Volume</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><Percent className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">${metrics.fees.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Platform Earnings ({metrics.effectiveFeeRate}% effective)</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><TrendingUp className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">${metrics.payouts.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Creator Payouts</p></div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-1">Fee Rules</h2>
        <p className="text-xs text-muted-foreground mb-4">
          New creators pay the intro rate for their first {settings.introPeriodDays} days, then the standard rate. Changes recalculate every figure on this page.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
          <div>
            <Label htmlFor="fee-standard" className="text-xs">Standard fee (%)</Label>
            <Input id="fee-standard" type="number" min="0" max="50" step="0.5" value={standard} onChange={e => setStandard(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="fee-intro" className="text-xs">Intro fee (%)</Label>
            <Input id="fee-intro" type="number" min="0" max="50" step="0.5" value={intro} onChange={e => setIntro(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="fee-days" className="text-xs">Intro period (days)</Label>
            <Input id="fee-days" type="number" min="0" max="365" value={days} onChange={e => setDays(e.target.value)} className="mt-1" />
          </div>
        </div>
        {dirty && projected !== null && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            At {draftStandard}% standard, current volume would have generated ≈ <span className="font-medium text-foreground">${projected.toLocaleString()}</span> in fees (actual: ${metrics.fees.toLocaleString()} at a blended {metrics.effectiveFeeRate}%).
          </p>
        )}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Button size="sm" disabled={!dirty} onClick={save}><Save className="mr-1.5 h-3.5 w-3.5" /> Save fee rules</Button>
          {dirty && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={discard}>Discard changes</Button>
          )}
          {!dirty && (
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={restoreDefaults}>Restore defaults</Button>
          )}
          {dirty && <span className="text-[11px] text-muted-foreground">Unsaved changes</span>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4">Monthly Fee Revenue</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12, color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`$${value}`, 'Fee revenue']}
              />
              <Bar dataKey="fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4"><Crown className="h-4 w-4 text-primary" /><h2 className="text-sm font-medium">Fee Earnings by Creator</h2></div>
        <div className="space-y-1">
          {metrics.byCreator.map((cf, i) => (
            <div key={cf.creator.id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground font-medium w-5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{cf.creator.name}</p>
                  <p className="text-xs text-muted-foreground">{cf.creator.subs} subscribers · {cf.transactions} transactions · ${cf.volume.toLocaleString()} volume</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className="text-[10px]">
                  {cf.feePercent === settings.introFeePercent ? `Intro ${cf.feePercent}%` : `Std ${cf.feePercent}%`}
                </Badge>
                <span className="text-sm font-medium">${cf.fees.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default DemoAdminFees;
