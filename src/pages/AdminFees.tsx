import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Percent, DollarSign, TrendingUp, Loader2, Crown, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

interface CreatorFee {
  name: string;
  feeEarned: number;
  feePercent: number;
  subCount: number;
}

interface MonthlyFee {
  month: string;
  fees: number;
}

const buildMonthlyFees = (rows: { created_at: string; platform_fee: number | string }[]): MonthlyFee[] => {
  const now = new Date();
  const buckets: MonthlyFee[] = [];
  const index = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    index.set(key, buckets.length);
    buckets.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), fees: 0 });
  }
  rows.forEach(r => {
    const d = new Date(r.created_at);
    const pos = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (pos !== undefined) buckets[pos].fees += Number(r.platform_fee);
  });
  return buckets.map(b => ({ ...b, fees: Number(b.fees.toFixed(2)) }));
};


const AdminFees = () => {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [totalCreatorEarnings, setTotalCreatorEarnings] = useState(0);
  const [introFeeCount, setIntroFeeCount] = useState(0);
  const [standardFeeCount, setStandardFeeCount] = useState(0);
  const [creatorFees, setCreatorFees] = useState<CreatorFee[]>([]);
  const [monthlyFeeData, setMonthlyFeeData] = useState<MonthlyFee[]>([]);
  const [introFee, setIntroFee] = useState('5');
  const [introDays, setIntroDays] = useState('30');
  const [standardFee, setStandardFee] = useState('10');
  const [savingFees, setSavingFees] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('intro_fee_percent, intro_period_days, standard_fee_percent')
        .eq('id', true)
        .maybeSingle();
      if (data) {
        setIntroFee(String(data.intro_fee_percent));
        setIntroDays(String(data.intro_period_days));
        setStandardFee(String(data.standard_fee_percent));
      }
    };
    void loadSettings();
  }, []);

  const saveFeeSettings = async () => {
    const intro = Number(introFee);
    const standard = Number(standardFee);
    const days = Number(introDays);
    if ([intro, standard, days].some(n => Number.isNaN(n)) || intro < 0 || standard < 0 || standard > 50 || days < 1) {
      toast.error('Enter valid fee percentages and an intro period of at least 1 day');
      return;
    }
    setSavingFees(true);
    const { error } = await supabase
      .from('platform_settings')
      .update({ intro_fee_percent: intro, standard_fee_percent: standard, intro_period_days: days })
      .eq('id', true);
    setSavingFees(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Fee rules saved — applied to new subscriptions');
  };

  useEffect(() => {
    const load = async () => {
      const [subsRes, creatorsRes] = await Promise.all([
        supabase.from('subscriptions').select('creator_id, amount, platform_fee, creator_earnings, status, fee_percentage, created_at'),
        supabase.from('creators').select('id, display_name, username, created_at'),
      ]);

      const active = (subsRes.data ?? []).filter(s => s.status === 'active');
      setMonthlyFeeData(buildMonthlyFees(active));
      setTotalRevenue(active.reduce((a, b) => a + Number(b.amount), 0));
      setTotalFees(active.reduce((a, b) => a + Number(b.platform_fee), 0));
      setTotalCreatorEarnings(active.reduce((a, b) => a + Number(b.creator_earnings), 0));
      setIntroFeeCount(active.filter(s => Number(s.fee_percentage) <= 5).length);
      setStandardFeeCount(active.filter(s => Number(s.fee_percentage) > 5).length);

      const creators = creatorsRes.data ?? [];
      const creatorMap = new Map(creators.map(c => [c.id, c]));
      const feeByCreator = new Map<string, { fee: number; count: number; amount: number }>();
      active.forEach(s => {
        const prev = feeByCreator.get(s.creator_id) ?? { fee: 0, count: 0, amount: 0 };
        feeByCreator.set(s.creator_id, {
          fee: prev.fee + Number(s.platform_fee),
          count: prev.count + 1,
          amount: prev.amount + Number(s.amount),
        });
      });

      const cfList: CreatorFee[] = [];
      feeByCreator.forEach((val, creatorId) => {
        const c = creatorMap.get(creatorId);
        // Effective rate from the real billed amounts, never re-derived from account age.
        const effective = val.amount > 0 ? Math.round((val.fee / val.amount) * 1000) / 10 : 0;
        cfList.push({ name: c?.display_name ?? `@${c?.username ?? 'unknown'}`, feeEarned: val.fee, feePercent: effective, subCount: val.count });
      });
      cfList.sort((a, b) => b.feeEarned - a.feeEarned);
      setCreatorFees(cfList);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
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
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Volume</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Percent className="h-4 w-4 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">${totalFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Fees Earned</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">${totalCreatorEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Creator Payouts</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Crown className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold">{introFeeCount + standardFeeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Subscriptions</p>
        </div>
      </div>

      {/* Fee Revenue Chart */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4">Monthly Fee Revenue</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFeeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(value: number) => [`$${value}`, 'Fee Revenue']} />
              <Bar dataKey="fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intro vs Standard Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Intro Fee (5%)</p>
          <p className="text-2xl font-bold text-emerald-400">{introFeeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">subscriptions at intro rate</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Standard Fee (10%)</p>
          <p className="text-2xl font-bold text-amber-400">{standardFeeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">subscriptions at standard rate</p>
        </div>
      </div>

      {/* Fee Earnings by Creator */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Fee Earnings by Creator</h2>
        </div>
        {creatorFees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-1">
            {creatorFees.map((cf, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/20 transition-colors">
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

      {/* Fee Settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium mb-4">Fee Rule Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-xs">Intro Fee (%)</Label>
            <Input type="number" value={introFee} onChange={e => setIntroFee(e.target.value)} className="mt-1" min="0" max="50" step="0.5" />
          </div>
          <div>
            <Label className="text-xs">Intro Duration (days)</Label>
            <Input type="number" value={introDays} onChange={e => setIntroDays(e.target.value)} className="mt-1" min="1" max="365" />
          </div>
          <div>
            <Label className="text-xs">Standard Fee (%)</Label>
            <Input type="number" value={standardFee} onChange={e => setStandardFee(e.target.value)} className="mt-1" min="1" max="50" step="0.5" />
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
