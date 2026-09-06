import { useParams, Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';
import { parsePickOdds as parseOdds } from '@/lib/odds';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { createCheckoutSession } from '@/data/payments';
import { trackPageView, trackPostView, trackSubscribeClick } from '@/lib/analytics';
import { Lock, Users, CheckCircle, Loader2, Trophy, TrendingUp, Target, Flame, Clock, XCircle, Minus, Copy } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import PricingCards from '@/components/creator/PricingCards';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  monthly_price: number | null;
}

interface Post {
  id: string;
  title: string;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  result?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  is_featured: boolean;
}

function parsePick(content: string | null) {
  if (!content) return null;
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let notes = '';
  let notesStart = false;
  for (const line of lines) {
    if (line.trim() === '') { notesStart = true; continue; }
    if (notesStart) { notes += (notes ? '\n' : '') + line; continue; }
    const match = line.match(/^(Sport|Event|Type|Pick|Odds|Units):\s*(.+)/i);
    if (match) data[match[1].toLowerCase()] = match[2].trim();
    else notes += (notes ? '\n' : '') + line;
  }
  return {
    sport: data.sport || null, event: data.event || null, pick: data.pick || null,
    odds: data.odds || null, units: data.units || null, notes: notes.trim() || null,
  };
}


const resultConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
  won: { label: 'Won', icon: Trophy, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  lost: { label: 'Lost', icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  push: { label: 'Push', icon: Minus, className: 'bg-muted text-muted-foreground' },
};

const CreatorProfile = () => {
  const { username } = useParams();
  const creatorData = useQuery(
    api.creators.queries.getByUsername,
    username ? { username } : 'skip',
  );
  const postsRaw = useQuery(
    api.posts.queries.listPreviewsByCreator,
    creatorData ? { creatorId: creatorData._id } : 'skip',
  );
  const productsRaw = useQuery(
    api.products.mutations.listPublicByCreator,
    creatorData ? { creatorId: creatorData._id } : 'skip',
  );

  const loading = creatorData === undefined || (creatorData && (postsRaw === undefined || productsRaw === undefined));

  const creator = creatorData
    ? {
        id: creatorData._id,
        username: creatorData.username,
        display_name: creatorData.displayName ?? null,
        bio: creatorData.bio ?? null,
        avatar_url: creatorData.avatarUrl ?? null,
        banner_url: creatorData.bannerUrl ?? null,
        monthly_price: creatorData.monthlyPriceCents != null ? creatorData.monthlyPriceCents / 100 : null,
      }
    : null;

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

  const products = useMemo(
    () => (productsRaw ?? [])
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.priceCents - b.priceCents)
      .map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description ?? null,
        price: p.priceCents / 100,
        billing_period: p.billingPeriod,
        is_featured: p.isFeatured,
      })),
    [productsRaw],
  );

  const subCount = 0;

  useEffect(() => {
    if (!creator) return;
    trackPageView(`creator:${creator.username}`);
    posts.forEach((p) => trackPostView(p.id, creator.id));
  }, [creator?.id, posts.length]);

  // Stats
  const stats = useMemo(() => {
    const settled = posts.filter(p => p.result && p.result !== 'pending');
    const wins = settled.filter(p => p.result === 'won').length;
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0;

    // Calculate units from content
    let totalUnits = 0;
    let unitsWon = 0;
    posts.forEach(p => {
      const pick = parsePick(p.content);
      const u = parseFloat(pick?.units?.replace(/[^0-9.]/g, '') || '1');
      if (p.result === 'won') { totalUnits += u; unitsWon += u * 0.9; }
      else if (p.result === 'lost') { totalUnits += u; unitsWon -= u; }
    });

    const roi = totalUnits > 0 ? Math.round((unitsWon / totalUnits) * 100) : 0;

    // Streak
    let streak = 0;
    for (const p of posts) {
      if (p.result === 'won') streak++;
      else if (p.result === 'lost') break;
    }

    return { wins, settled: settled.length, winRate, totalUnits: Math.abs(unitsWon).toFixed(1), roi, streak };
  }, [posts]);

  // Cumulative units from settled picks (real data — no simulated chart)
  const chartData = useMemo(() => {
    const settled = [...posts]
      .filter((p) => p.result === 'won' || p.result === 'lost' || p.result === 'push')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (settled.length === 0) return [];

    let running = 0;
    return settled.map((p) => {
      const pick = parsePick(p.content);
      const u = parseFloat(pick?.units?.replace(/[^0-9.]/g, '') || '1');
      if (p.result === 'won') running += u * 0.9;
      else if (p.result === 'lost') running -= u;
      return {
        date: format(new Date(p.created_at), 'MMM d'),
        units: parseFloat(running.toFixed(1)),
      };
    });
  }, [posts]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!creator) {
    return (
      <div className="min-h-screen">
        <Seo title="Creator not found — Wizzlet" description="This creator profile doesn't exist or isn't published yet." noindex />
        <Navbar />
        <main id="main-content" className="pt-32 text-center">
          <h1 className="text-2xl font-bold mb-2">Creator not found</h1>
          <p className="text-muted-foreground text-sm">@{username} doesn't exist or isn't published yet.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/creators"><Button variant="outline" size="sm">Browse creators</Button></Link>
            <Link to="/"><Button size="sm">Back home</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const price = (creator.monthly_price ?? 9.99).toFixed(2);
  const hasProducts = products.length > 0;
  const initials = (creator.display_name?.[0] ?? creator.username[0]).toUpperCase();

  return (
    <div className="min-h-screen">
      <Seo
        title={`${creator.display_name ?? creator.username} (@${creator.username}) — Picks & Subscriptions | Wizzlet`}
        description={(creator.bio?.trim() || `Follow @${creator.username} on Wizzlet for verified sports picks, results and subscription access from $${price}/mo.`).slice(0, 155)}
        canonicalPath={`/${creator.username}`}
      />
      <Navbar />

      <main id="main-content">
      {/* Banner */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-secondary mt-16">
        {creator.banner_url ? (
          <img src={creator.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-secondary to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="container max-w-2xl relative -mt-16 z-10 pb-20">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.display_name ?? ''} className="h-24 w-24 rounded-full border-4 border-background object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{initials}</span>
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {creator.display_name ?? creator.username}
            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
            {stats.streak >= 3 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500">
                <Flame className="h-3.5 w-3.5" /> {stats.streak}W
              </span>
            )}
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">@{creator.username}</p>
          {creator.bio && <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">{creator.bio}</p>}

          <div className="flex items-center gap-5 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {subCount} subscriber{subCount !== 1 ? 's' : ''}</span>
            <span>{posts.length} pick{posts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          {[
            { label: 'Win Rate', value: `${stats.winRate}%`, icon: Trophy, color: 'text-emerald-500' },
            { label: 'ROI', value: `${stats.roi >= 0 ? '+' : ''}${stats.roi}%`, icon: TrendingUp, color: stats.roi >= 0 ? 'text-emerald-500' : 'text-red-500' },
            { label: 'Units P/L', value: `${stats.totalUnits}u`, icon: Target, color: 'text-primary' },
            { label: 'Record', value: `${stats.wins}W - ${stats.settled - stats.wins}L`, icon: Trophy, color: 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Performance chart from settled picks */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Performance</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No settled picks yet to chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="units" stroke="hsl(var(--primary))" fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subscribe CTA */}
        {hasProducts ? (
          <div className="mt-8 w-full">
            <PricingCards products={products} creatorId={creator.id} creatorUsername={creator.username} />
          </div>
        ) : (
          <Button variant="hero" size="lg" className="mt-6 text-base px-10 h-12 w-full sm:w-auto"
            onClick={() => { trackSubscribeClick(creator.id); createCheckoutSession(creator.id, creator.username); }}>
            Subscribe — ${price}/mo
          </Button>
        )}

        {/* Posts / Recent Picks */}
        <div className="mt-12 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Recent Picks</h2>

          {posts.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No picks yet. Check back soon!</p>
            </div>
          )}

          {posts.map((post) => {
            const pick = parsePick(post.content);
            const odds = pick ? parseOdds(pick.odds) : { us: null, eu: null };
            const result = (post.result || 'pending') as keyof typeof resultConfig;
            const rc = resultConfig[result] || resultConfig.pending;
            const ResultIcon = rc.icon;

            return (
              <article key={post.id} className="rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-border/80">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    {post.is_premium && !post.content ? (
                      <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                        <Lock className="h-2.5 w-2.5 mr-0.5" /> PREMIUM
                      </Badge>
                    ) : post.is_premium ? (
                      <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                        <Lock className="h-2.5 w-2.5 mr-0.5" /> PREMIUM
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Free</span>
                    )}
                    {pick?.sport && (
                      <Badge variant="outline" className="text-[9px] font-semibold bg-primary/5 text-primary border-primary/15">{pick.sport}</Badge>
                    )}
                    <Badge variant="outline" className={`text-[9px] font-semibold uppercase ${rc.className}`}>
                      <ResultIcon className="h-2.5 w-2.5 mr-0.5" /> {rc.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base mb-2">{pick?.pick || post.title}</h3>

                  {/* Odds display */}
                  {(odds.us || odds.eu) && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1">
                        <span className="text-[10px] text-muted-foreground">Odds:</span>
                        {odds.us && <span className="text-xs font-bold">{odds.us}</span>}
                        {odds.us && odds.eu && <span className="text-[10px] text-muted-foreground">/</span>}
                        {odds.eu && <span className="text-xs font-semibold text-muted-foreground">{odds.eu}</span>}
                      </div>
                      {pick?.units && (
                        <div className="inline-flex items-center rounded-lg bg-muted/50 px-2.5 py-1">
                          <span className="text-xs font-bold">{pick.units}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {post.is_premium && !post.content ? (
                    <div className="relative rounded-lg bg-secondary/40 p-6 text-center overflow-hidden">
                      <div className="absolute inset-0 p-4 select-none pointer-events-none" aria-hidden>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                          <div className="h-3 bg-muted-foreground/10 rounded w-5/6" />
                          <div className="h-3 bg-muted-foreground/10 rounded w-4/6" />
                          <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                          <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
                        </div>
                      </div>
                      <div className="relative z-10 backdrop-blur-[2px]">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Lock className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm font-medium mb-1">Premium Content</p>
                        <p className="text-xs text-muted-foreground mb-3">Subscribe to unlock this pick</p>
                        <Button variant="hero" size="sm" className="text-xs px-5"
                          onClick={(e) => { e.stopPropagation(); trackSubscribeClick(creator.id); createCheckoutSession(creator.id, creator.username); }}>
                          Subscribe — ${price}/mo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {pick?.notes && (
                        <div className="rounded-lg bg-muted/30 p-3 mb-2">
                          <p className="text-sm text-muted-foreground leading-relaxed">{pick.notes}</p>
                        </div>
                      )}
                      {!pick && post.content && <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>}
                    </>
                  )}

                  {/* Copy button */}
                  {post.content && (
                    <div className="pt-2 mt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const p = parsePick(post.content);
                          const text = p ? `${post.title}${p.pick ? ` | ${p.pick}` : ''}${p.odds ? ` | ${p.odds}` : ''}` : post.title;
                          navigator.clipboard.writeText(text);
                          toast.success('Pick copied to clipboard');
                        }}>
                        <Copy className="h-3 w-3 mr-1" /> Copy Pick
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
};

export default CreatorProfile;
