import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { kpiIconTone } from '@/lib/kpiIconTones';
import {
  ArrowLeft,
  DollarSign,
  BarChart3,
  Target,
  Lightbulb,
  Loader2,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
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

  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);

  const creatorId = creator?.id;
  const savedListPrice = creator?.monthly_price ?? null;

  // Draft input only re-syncs when the persisted list price changes — not on every
  // reactive subs/analytics/posts/market refresh (that was wiping typing).
  useEffect(() => {
    if (!creatorId) return;
    setPriceInput((savedListPrice ?? 9.99).toFixed(2));
  }, [creatorId, savedListPrice]);

  const queriesLoading =
    !!creator &&
    (subs === undefined ||
      analytics === undefined ||
      posts === undefined ||
      marketPage === undefined);
  const loading = creatorLoading || queriesLoading;

  const data = useMemo((): PricingData | null => {
    if (!creator || subs === undefined || analytics === undefined || posts === undefined || marketPage === undefined) {
      return null;
    }
    const market = marketPage.items;
    const activeSubs = subs.filter((s) => s.status === 'active');
    const price = creator.monthly_price ?? 9.99;
    const settled = posts.filter((p) => p.result === 'won' || p.result === 'lost');
    const wins = settled.filter((p) => p.result === 'won').length;
    const marketPrices = market
      .map((m) => (m.monthlyPriceCents ?? 0) / 100)
      .filter((p) => p > 0);

    return {
      price,
      activeSubs: activeSubs.length,
      monthlyRevenue: activeSubs.reduce((a, b) => a + b.amountCents / 100, 0),
      profileViews: analytics.filter((e) => e.eventType === 'profile_view').length,
      winRate: settled.length ? (wins / settled.length) * 100 : 0,
      settledPicks: settled.length,
      marketAverage: marketPrices.length
        ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length
        : price,
    };
  }, [creator, subs, analytics, posts, marketPage]);

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
    const direction = suggested > data.price ? 'higher' : suggested < data.price ? 'lower' : 'similar';

    return { suggested, conversion, direction, multiplier };
  }, [data]);

  const savePrice = async () => {
    if (!creator || saving) return;
    const next = Number(priceInput);
    if (!next || next < 1) {
      toast.error('Enter a valid price');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({ monthlyPriceCents: Math.round(next * 100) });
      setPriceInput(next.toFixed(2));
      toast.success('Featured / list price updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update price');
    } finally {
      setSaving(false);
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

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Products
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground">
            Smart Pricing
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Illustrative pricing guidance from your live metrics — not a guarantee.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <DollarSign className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to see pricing guidance and set your list price.
          </p>
          <Button asChild size="sm">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !suggestion) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const insights = [
    data.settledPicks >= 10
      ? `Your ${data.winRate.toFixed(1)}% win rate across ${data.settledPicks} settled picks ${data.winRate >= 53 ? 'can support testing a higher list price' : 'suggests holding price until results improve'}.`
      : `Only ${data.settledPicks} settled picks so far — publish more results before making large price moves.`,
    data.profileViews > 0
      ? `About ${suggestion.conversion.toFixed(1)}% of your ${data.profileViews} tracked profile views become subscribers (illustrative conversion).`
      : 'No profile views tracked yet — promote your links to build demand data.',
    `Market average across published creators is about $${data.marketAverage.toFixed(2)}/mo — you are ${data.price >= data.marketAverage ? 'above' : 'below'} it. Treat this as a rough benchmark only.`,
  ];

  const impactLabel =
    suggestion.direction === 'higher'
      ? 'Exploring a higher list price'
      : suggestion.direction === 'lower'
        ? 'Exploring a lower list price'
        : 'Current price looks aligned';

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Products
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Smart Pricing
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Illustrative pricing guidance from your live metrics — not a guarantee.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/creator/products">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Products
          </Link>
        </Button>
      </header>

      <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-ui font-semibold text-foreground">Edit sellable product prices in Products</p>
            <p className="mt-0.5 text-support text-muted-foreground">
              Subscription tiers and product pricing live on the Products page. Use the control below
              only for your featured / list monthly price.
            </p>
          </div>
        </div>
        <Button variant="hero" asChild className="min-h-11 shrink-0">
          <Link to="/creator/products">
            Go to Products <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <DashboardKpiStrip
          items={[
            {
              label: 'Current list price',
              value: `$${data.price.toFixed(2)}`,
              icon: DollarSign,
              iconClassName: kpiIconTone.emerald,
            },
            {
              label: 'Suggested range',
              value: `$${suggestion.suggested.toFixed(2)}`,
              icon: TrendingUp,
              iconClassName: kpiIconTone.sky,
            },
            {
              label: 'Illustrative impact',
              value: impactLabel,
              icon: Target,
              iconClassName: kpiIconTone.amber,
            },
          ]}
        />
        <p className="mt-2 text-support text-muted-foreground">
          {data.activeSubs} active subscribers · heuristic from win rate, demand and market data ·
          impact is directional only.
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="flex items-center gap-2 text-ui font-semibold text-foreground">
          <DollarSign className="h-4 w-4 text-primary" /> Update featured / list price
        </h2>
        <p className="text-support text-muted-foreground">
          Applies your monthly featured price shown on your public profile and creator list. For
          sellable product prices, use Products. Changing the input alone does not save until you
          apply.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="list-price" className="text-support text-muted-foreground">
              Monthly price ($)
            </Label>
            <Input
              id="list-price"
              type="number"
              min={1}
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="h-11 min-h-11 w-full text-ui sm:w-40"
            />
          </div>
          <Button
            type="button"
            variant="hero"
            size="sm"
            onClick={() => void savePrice()}
            disabled={saving || !priceInput.trim()}
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Apply list price
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPriceInput(suggestion.suggested.toFixed(2))}
          >
            <Target className="mr-1.5 h-3.5 w-3.5" /> Use suggested
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-ui font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" /> Live metrics
          </h2>
          <div className="space-y-3">
            {[
              ['Monthly recurring revenue', `$${data.monthlyRevenue.toFixed(2)}`],
              ['Active subscribers', String(data.activeSubs)],
              ['Profile views', String(data.profileViews)],
              ['View → subscriber rate', `${suggestion.conversion.toFixed(1)}%`],
              ['Win rate', `${data.winRate.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <span className="text-support text-muted-foreground">{label}</span>
                <span className="text-ui font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-ui font-semibold text-foreground">
            <Lightbulb className="h-4 w-4 text-muted-foreground" /> Recommendations
          </h2>
          <div className="space-y-3">
            {insights.map((text, i) => (
              <div key={i} className="flex gap-3">
                <Badge variant="outline" className="h-5 shrink-0 text-caption">
                  {i + 1}
                </Badge>
                <p className="text-support leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorSmartPricing;
