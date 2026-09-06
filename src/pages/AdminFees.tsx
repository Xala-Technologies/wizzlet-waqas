import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Percent, DollarSign, TrendingUp, Loader2, Crown, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const AdminFees = () => {
  const [introFee, setIntroFee] = useState('5');
  const [introDays, setIntroDays] = useState('30');
  const [standardFee, setStandardFee] = useState('10');
  const [savingFees, setSavingFees] = useState(false);
  const [nowMs] = useState(() => Date.now());

  const platformSettings = useQuery(api.platform.mutations.get);
  const overview = useQuery(api.admin.snapshots.feesOverview, { nowMs });
  const upsertSettings = useMutation(api.platform.mutations.upsert);

  const loading = platformSettings === undefined || overview === undefined;

  useEffect(() => {
    if (platformSettings) {
      setIntroFee(String(platformSettings.introFeePercent));
      setIntroDays(String(platformSettings.introFeeDays));
      setStandardFee(String(platformSettings.standardFeePercent));
    }
  }, [platformSettings]);

  const saveFeeSettings = async () => {
    const intro = Number(introFee);
    const standard = Number(standardFee);
    const days = Number(introDays);
    if ([intro, standard, days].some((n) => Number.isNaN(n)) || intro < 0 || standard < 0 || standard > 50 || days < 1) {
      toast.error('Enter valid fee percentages and an intro period of at least 1 day');
      return;
    }
    setSavingFees(true);
    try {
      await upsertSettings({
        introFeePercent: intro,
        standardFeePercent: standard,
        introFeeDays: days,
        branding: platformSettings?.branding,
        payoutDefaults: platformSettings?.payoutDefaults,
        featureFlags: platformSettings?.featureFlags,
      });
      toast.success('Fee rules saved — applied to new subscriptions');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save fee settings');
    } finally {
      setSavingFees(false);
    }
  };

  if (loading || !overview) {
    return (
      <DashboardLayout type="admin">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Fees</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Revenue from platform commission</p>
        {overview.truncated && (
          <p className="text-amber-600 text-xs mt-2">
            Showing up to {overview.listLimit.toLocaleString()} rows per table — totals may be incomplete at this scale.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">${overview.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Volume</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Percent className="h-4 w-4 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">${overview.totalFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Fees Earned</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">${overview.totalCreatorEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Creator Payouts</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Crown className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold">{overview.introFeeCount + overview.standardFeeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Subscriptions</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6 min-w-0">
        <h2 className="text-sm font-medium mb-4">Monthly Fee Revenue</h2>
        <div className="h-64 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.monthlyFees}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(value: number) => [`$${value}`, 'Fee Revenue']} />
              <Bar dataKey="fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Intro Fee (5%)</p>
          <p className="text-2xl font-bold text-emerald-400">{overview.introFeeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">subscriptions at intro rate</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Standard Fee (10%)</p>
          <p className="text-2xl font-bold text-amber-400">{overview.standardFeeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">subscriptions at standard rate</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Fee Earnings by Creator</h2>
        </div>
        {overview.creatorFees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-1">
            {overview.creatorFees.map((cf, i) => (
              <div key={`${cf.name}-${i}`} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground font-medium w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{cf.name}</p>
                    <p className="text-xs text-muted-foreground">{cf.subCount} subscriber{cf.subCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cf.feePercent <= 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {cf.feePercent}%
                  </span>
                  <span className="text-sm font-medium text-emerald-400 w-20 text-right">${cf.feeEarned.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium mb-4">Fee Rule Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-xs">Intro Fee (%)</Label>
            <Input type="number" value={introFee} onChange={(e) => setIntroFee(e.target.value)} className="mt-1" min="0" max="50" step="0.5" />
          </div>
          <div>
            <Label className="text-xs">Intro Duration (days)</Label>
            <Input type="number" value={introDays} onChange={(e) => setIntroDays(e.target.value)} className="mt-1" min="1" max="365" />
          </div>
          <div>
            <Label className="text-xs">Standard Fee (%)</Label>
            <Input type="number" value={standardFee} onChange={(e) => setStandardFee(e.target.value)} className="mt-1" min="1" max="50" step="0.5" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Applied automatically to every new subscription</p>
          <Button size="sm" onClick={saveFeeSettings} disabled={savingFees}>
            {savingFees ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />} Save
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminFees;
