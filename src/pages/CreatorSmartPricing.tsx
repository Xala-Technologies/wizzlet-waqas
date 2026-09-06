import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { DollarSign, Zap, BarChart3, ArrowUpRight, ArrowDownRight, Target, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PricingData {
  price: number;
  activeSubs: number;
  monthlyRevenue: number;
  profileViews: number;
  winRate: number;
  settledPicks: number;
  marketAverage: number;
}

const CreatorSmartPricing = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const posts = useQuery(api.posts.queries.listMine);
  const marketPage = useQuery(api.creators.queries.listPublished, {});
  const updateSettings = useMutation(api.creators.queries.updateSettings);

  const [data, setData] = useState<PricingData | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (creatorLoading || !creator) return;
    if (subs === undefined || analytics === undefined || posts === undefined || marketPage === undefined) return;
    const market = marketPage.items;

    const activeSubs = subs.filter((s) => s.status === 'active');
    const price = creator.monthly_price ?? 9.99;
    const settled = posts.filter((p) => p.result === 'won' || p.result === 'lost');
    const wins = settled.filter((p) => p.result === 'won').length;
    const marketPrices = market
      .map((m) => (m.monthlyPriceCents ?? 0) / 100)
      .filter((p) => p > 0);

    setData({
      price,
      activeSubs: activeSubs.length,
      monthlyRevenue: activeSubs.reduce((a, b) => a + b.amountCents / 100, 0),
      profileViews: analytics.filter((e) => e.eventType === 'profile_view').length,
      winRate: settled.length ? (wins / settled.length) * 100 : 0,
      settledPicks: settled.length,
      marketAverage: marketPrices.length ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length : price,
    });
    setPriceInput(price.toFixed(2));
  }, [creator, creatorLoading, subs, analytics, posts, marketPage]);

  const loading = creatorLoading || !creator || subs === undefined || analytics === undefined || posts === undefined || marketPage === undefined;

  const suggestion = useMemo(() => {
    if (!data) return null;
    const conversion = data.profileViews > 0 ? (data.activeSubs / data.profileViews) * 100 : 0;
    let multiplier = 1;
    if (data.winRate >= 58 && data.settledPicks >= 20) multiplier += 0.35;
    else if (data.winRate >= 53 && data.settledPicks >= 10) multiplier += 0.15;
    else if (data.settledPicks >= 10 && data.winRate < 48) multiplier -= 0.15;
    if (conversion >= 8) multiplier += 0.15;
    else if (data.profileViews > 200 && conversion < 2) multiplier -= 0.1;
    if (data.price < data.marketAverage * 0.8) multiplier += 0.1;

    const suggested = Math.max(4.99, Math.round(data.price * multiplier * 100) / 100);
    const projectedSubs = data.activeSubs * (suggested > data.price ? 0.9 : 1.1);
    const revenueImpact = data.monthlyRevenue > 0
      ? ((suggested * projectedSubs - data.monthlyRevenue) / data.monthlyRevenue) * 100
      : 0;

    return { suggested, conversion, revenueImpact, multiplier };
  }, [data]);

  const savePrice = async () => {
    if (!creator) return;
    const next = Number(priceInput);
    if (!next || next < 1) { toast.error('Enter a valid price'); return; }
    setSaving(true);
    try {
      await updateSettings({ monthlyPriceCents: Math.round(next * 100) });
      setData((d) => d ? { ...d, price: next } : d);
      toast.success('Subscription price updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data || !suggestion) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const insights = [
    data.settledPicks >= 10
      ? `Your ${data.winRate.toFixed(1)}% win rate across ${data.settledPicks} settled picks ${data.winRate >= 53 ? 'supports a premium price' : 'suggests holding price until results improve'}.`
      : `Only ${data.settledPicks} settled picks so far — publish more results to unlock stronger pricing power.`,
    data.profileViews > 0
      ? `${suggestion.conversion.toFixed(1)}% of your ${data.profileViews} profile views convert into subscribers.`
      : 'No profile views tracked yet — promote your links to build demand data.',
    `Market average across published creators is $${data.marketAverage.toFixed(2)}/mo — you are ${data.price >= data.marketAverage ? 'above' : 'below'} it.`,
  ];

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Smart Pricing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Pricing guidance based on your live performance data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Current Price</p>
          <p className="text-3xl font-bold">${data.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.activeSubs} active subscribers</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-card p-5 ring-1 ring-primary/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">Suggested Price</p>
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">${suggestion.suggested.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">From win rate, demand and market data</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Projected Impact</p>
          <p className={`text-3xl font-bold flex items-center gap-1 ${suggestion.revenueImpact >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
            {suggestion.revenueImpact >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            {suggestion.revenueImpact >= 0 ? '+' : ''}{suggestion.revenueImpact.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Monthly revenue at suggested price</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Update Your Price</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Monthly price ($)</label>
            <Input type="number" min="1" step="0.01" value={priceInput} onChange={e => setPriceInput(e.target.value)} className="mt-1.5 w-40" />
          </div>
          <Button variant="hero" size="sm" onClick={savePrice} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Price
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPriceInput(suggestion.suggested.toFixed(2))}>
            <Target className="mr-1.5 h-3.5 w-3.5" /> Use suggested
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Live Metrics</h2>
          <div className="space-y-3 text-sm">
            {[
              ['Monthly recurring revenue', `$${data.monthlyRevenue.toFixed(2)}`],
              ['Active subscribers', String(data.activeSubs)],
              ['Profile views', String(data.profileViews)],
              ['View → subscriber rate', `${suggestion.conversion.toFixed(1)}%`],
              ['Win rate', `${data.winRate.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Recommendations</h2>
          <div className="space-y-3">
            {insights.map((text, i) => (
              <div key={i} className="flex gap-3">
                <Badge variant="outline" className="h-5 shrink-0 text-[10px]">{i + 1}</Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorSmartPricing;
