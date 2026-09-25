import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/landing/Navbar';
import { createCheckoutSession } from '@/data/payments';
import { trackPageView, trackPostView, trackSubscribeClick } from '@/lib/analytics';
import {
  BadgeCheck,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  Gem,
  Heart,
  Loader2,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { subscriptionGrantsContentAccess } from '../../convex/lib/contentAccess';
import {
  CREATOR_PUBLIC_PROFILE_DEMO,
  isCreatorProfileDemoProductId,
  shouldUseCreatorPublicProfileDemo,
  type CreatorProfileDemoProduct,
} from '@/lib/creatorPublicProfileDemo';
import { cn } from '@/lib/utils';
import { SweephLogo } from '@/components/SweephLogo';

function parsePick(content: string | null) {
  if (!content) return null;
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let notes = '';
  let notesStart = false;
  for (const line of lines) {
    if (line.trim() === '') {
      notesStart = true;
      continue;
    }
    if (notesStart) {
      notes += (notes ? '\n' : '') + line;
      continue;
    }
    const match = line.match(/^(Sport|Event|Type|Pick|Odds|Units):\s*(.+)/i);
    if (match) data[match[1]!.toLowerCase()] = match[2]!.trim();
    else notes += (notes ? '\n' : '') + line;
  }
  return {
    sport: data.sport || null,
    units: data.units || null,
  };
}

function formatFollowers(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K followers`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K followers`;
  return `${n} follower${n === 1 ? '' : 's'}`;
}

function formatSubscribersKpi(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function money(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

const PRODUCT_ICONS = {
  chart: BarChart3,
  gem: Gem,
  users: Users,
} as const;

const PILLAR_ICONS = {
  chart: BarChart3,
  users: Users,
  shield: ShieldCheck,
  heart: Heart,
} as const;

const CreatorProfile = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const { isAuthenticated } = useConvexAuth();
  const [liked, setLiked] = useState(false);

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
  const subCountRaw = useQuery(
    api.subscriptions.mutations.countActiveByCreator,
    creatorData ? { creatorId: creatorData._id } : 'skip',
  );
  const mySubs = useQuery(
    api.subscriptions.mutations.mySubscriptions,
    isAuthenticated ? {} : 'skip',
  );

  const loading =
    creatorData === undefined ||
    (creatorData && (postsRaw === undefined || productsRaw === undefined));

  const livePosts = useMemo(() => postsRaw ?? [], [postsRaw]);
  const liveProducts = useMemo(
    () =>
      [...(productsRaw ?? [])].sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.priceCents - b.priceCents,
      ),
    [productsRaw],
  );

  const liveStats = useMemo(() => {
    const settled = livePosts.filter((p) => p.result && p.result !== 'pending');
    const wins = settled.filter((p) => p.result === 'won').length;
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0;
    let totalUnits = 0;
    let unitsWon = 0;
    livePosts.forEach((p) => {
      const pick = parsePick(p.content);
      const u = parseFloat(pick?.units?.replace(/[^0-9.]/g, '') || '1');
      if (p.result === 'won') {
        totalUnits += u;
        unitsWon += u * 0.9;
      } else if (p.result === 'lost') {
        totalUnits += u;
        unitsWon -= u;
      }
    });
    const roi = totalUnits > 0 ? Math.round((unitsWon / totalUnits) * 1000) / 10 : 0;
    return {
      winRate,
      totalProfitUnits: Math.round(unitsWon * 10) / 10,
      roiPct: roi,
      settled: settled.length,
    };
  }, [livePosts]);

  const hasMeaningfulContent = liveProducts.length > 0 || liveStats.settled > 0;

  const useDemo = shouldUseCreatorPublicProfileDemo({
    forceDemo,
    disableDemo,
    hasMeaningfulContent,
  });

  const demo = CREATOR_PUBLIC_PROFILE_DEMO;
  const subCount = subCountRaw ?? 0;

  const isSubscribed = Boolean(
    creatorData &&
      mySubs?.some(
        (s) =>
          s.creatorId === creatorData._id &&
          subscriptionGrantsContentAccess(
            {
              status: s.status,
              billingStatus: s.billingStatus,
              currentPeriodEnd: s.currentPeriodEnd,
              cancelAtPeriodEnd: s.cancelAtPeriodEnd,
            },
            Date.now(),
          ),
      ),
  );

  useEffect(() => {
    if (!creatorData) return;
    trackPageView(`creator:${creatorData.username}`);
    for (const p of livePosts) {
      trackPostView(p._id, creatorData._id);
    }
  }, [creatorData, livePosts]);

  if (loading && !useDemo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!creatorData && !useDemo) {
    return (
      <div className="min-h-screen">
        <Seo
          title="Creator not found — Prizelet"
          description="This creator profile doesn't exist or isn't published yet."
          noindex
        />
        <Navbar />
        <main id="main-content" className="pt-32 text-center">
          <h1 className="mb-2 text-2xl font-bold">Creator not found</h1>
          <p className="text-sm text-muted-foreground">
            @{username} doesn&apos;t exist or isn&apos;t published yet.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/creators">
              <Button variant="outline" size="sm">
                Browse creators
              </Button>
            </Link>
            <Link to="/">
              <Button size="sm">Back home</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayName = useDemo
    ? demo.displayName
    : (creatorData!.displayName?.trim() || creatorData!.username);
  const handle = useDemo ? demo.username : creatorData!.username;
  const bio = useDemo
    ? demo.bio
    : (creatorData!.bio?.trim() ||
      'Sports picks and analysis on Prizelet.');
  const about = useDemo
    ? demo.about
    : (creatorData!.bio?.trim() ||
      `${displayName} shares data-driven sports picks and analysis on Prizelet.`);
  const avatarUrl = useDemo ? demo.avatarUrl : creatorData!.avatarUrl;
  const bannerUrl = useDemo ? demo.bannerUrl : creatorData!.bannerUrl;
  const tags = useDemo
    ? demo.tags
    : (() => {
        const found: string[] = [];
        const hay = `${bio} ${handle}`.toLowerCase();
        for (const t of ['NBA', 'NFL', 'UFC', 'Tennis', 'MLB', 'Soccer']) {
          if (hay.includes(t.toLowerCase())) found.push(t);
        }
        return found.length > 0 ? found : ['Sports'];
      })();
  const followersLabel = useDemo ? demo.followersLabel : formatFollowers(subCount);
  const memberSinceLabel = useDemo
    ? demo.memberSinceLabel
    : creatorData?.createdAt
      ? `Member since ${format(new Date(creatorData.createdAt), 'MMM yyyy')}`
      : 'Member on Prizelet';
  const winRate = useDemo ? demo.winRate : liveStats.winRate;
  const totalProfit = useDemo ? demo.totalProfitUnits : liveStats.totalProfitUnits;
  const roiPct = useDemo ? demo.roiPct : liveStats.roiPct;
  const subscribersLabel = useDemo
    ? demo.subscribersLabel
    : formatSubscribersKpi(subCount);

  const products: CreatorProfileDemoProduct[] = useDemo
    ? demo.products
    : liveProducts.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description ?? 'Subscription access to premium picks.',
        priceCents: p.priceCents,
        billingPeriod: 'monthly' as const,
        isFeatured: p.isFeatured,
        ctaLabel: p.priceCents === 0 ? 'Join Free' : 'Get Started',
        icon: p.isFeatured ? ('chart' as const) : ('gem' as const),
        features: (p.description ?? '')
          .split(/[.;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
          .concat(
            ['Daily picks with analysis', 'Access to private community', 'Early access to plays'].slice(
              0,
              Math.max(0, 4 - (p.description?.split(/[.;\n]/).filter(Boolean).length ?? 0)),
            ),
          )
          .slice(0, 4),
      }));

  const featured = products.find((p) => p.isFeatured) ?? products[0];
  const heroPriceCents = useDemo
    ? demo.subscribePriceCents
    : (featured?.priceCents ??
      (creatorData?.monthlyPriceCents != null ? creatorData.monthlyPriceCents : 2999));

  const checkout = (productId?: string) => {
    if (!creatorData || (productId && isCreatorProfileDemoProductId(productId))) {
      toast.message('Sample preview', {
        description: 'Subscribe on a live creator profile (?demo=0) to checkout.',
      });
      return;
    }
    trackSubscribeClick(creatorData._id);
    void createCheckoutSession(
      creatorData._id,
      creatorData.username,
      productId && !isCreatorProfileDemoProductId(productId) ? productId : featured?.id,
    );
  };

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      <Seo
        title={`${displayName} (@${handle}) — Picks & Subscriptions | Prizelet`}
        description={bio.slice(0, 155)}
        canonicalPath={`/${handle}`}
      />
      <Navbar />

      <main id="main-content">
        {/* Hero */}
        <section className="relative mt-16 overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0">
            {bannerUrl ? (
              <img src={bannerUrl} alt="" className="h-full w-full object-cover opacity-50" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/40" />
          </div>

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 md:flex-row md:items-end md:justify-between md:px-8 lg:py-16">
            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative shrink-0 self-start sm:self-end">
                <div className="h-28 w-28 overflow-hidden rounded-full border-[3px] border-primary shadow-xl sm:h-32 sm:w-32">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/30 text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                {(useDemo ? demo.online : true) ? (
                  <span
                    className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-500"
                    aria-label="Online"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {displayName}
                  </h1>
                  <BadgeCheck className="h-6 w-6 shrink-0 text-sky-400" aria-label="Verified" />
                </div>
                <p className="mt-1 text-sm font-medium text-slate-300">@{handle}</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
                  {bio}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 shrink-0" aria-hidden />
                    {followersLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                    {memberSinceLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-end">
              {isSubscribed && !useDemo ? (
                <Button
                  asChild
                  size="lg"
                  className="min-h-12 rounded-xl px-6 text-base font-semibold"
                >
                  <Link to="/dashboard/subscriptions-billing">
                    Manage subscription
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="min-h-12 rounded-xl px-6 text-base font-semibold"
                  onClick={() => checkout(featured?.id)}
                >
                  Subscribe {money(heroPriceCents)} / month
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn(
                  'h-12 w-12 shrink-0 rounded-xl border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white',
                  liked && 'border-rose-400/50 text-rose-400',
                )}
                aria-label={liked ? 'Unfavorite' : 'Favorite'}
                aria-pressed={liked}
                onClick={() => {
                  setLiked((v) => !v);
                  toast.message(liked ? 'Removed from favorites' : 'Saved to favorites', {
                    description: useDemo
                      ? 'Sample preview — favorites sync when you leave demo mode.'
                      : undefined,
                  });
                }}
              >
                <Heart className={cn('h-5 w-5', liked && 'fill-current')} />
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:px-8">
          {useDemo ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
              <Sparkles
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                Sample creator profile for design review. Add{' '}
                <code className="rounded bg-amber-500/20 px-1">?demo=0</code> to see live data
                only.
              </p>
            </div>
          ) : null}

          {/* KPI strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              {
                label: 'Win Rate',
                value: `${winRate}%`,
                icon: LineChart,
              },
              {
                label: 'Total Profit',
                value: `${totalProfit >= 0 ? '+' : ''}${totalProfit}u`,
                icon: Trophy,
              },
              {
                label: 'ROI',
                value: `${roiPct}%`,
                icon: BarChart3,
              },
              {
                label: 'Subscribers',
                value: subscribersLabel,
                icon: Users,
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                      {kpi.value}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <kpi.icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Creator Products */}
          <section className="mt-10">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Creator Products
            </h2>
            {products.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">No products yet.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {products.map((product) => {
                  const Icon = PRODUCT_ICONS[product.icon] ?? BarChart3;
                  return (
                    <article
                      key={product.id}
                      className={cn(
                        'relative flex flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]',
                        product.isFeatured
                          ? 'border-primary ring-1 ring-primary/30'
                          : 'border-border',
                      )}
                    >
                      {product.isFeatured ? (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                          Most Popular
                        </span>
                      ) : null}
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="mt-4 text-lg font-extrabold text-foreground">
                        {product.name}
                      </h3>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>
                      <p className="mt-4 text-2xl font-extrabold text-foreground">
                        {money(product.priceCents)}
                        <span className="text-sm font-medium text-muted-foreground"> / month</span>
                      </p>
                      <Button
                        type="button"
                        variant={product.isFeatured ? 'default' : 'secondary'}
                        className="mt-4 min-h-11 w-full rounded-xl font-semibold"
                        onClick={() => checkout(product.id)}
                      >
                        {product.ctaLabel}
                      </Button>
                      <ul className="mt-5 space-y-2.5">
                        {product.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                              aria-hidden
                            />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* About */}
          <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              About {displayName}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {about}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(useDemo ? demo.pillars : CREATOR_PUBLIC_PROFILE_DEMO.pillars).map((pillar) => {
                const Icon = PILLAR_ICONS[pillar.icon];
                return (
                  <div key={pillar.title} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="pt-2 text-sm font-semibold text-foreground">{pillar.title}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Mock-aligned footer strip */}
        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
            <div>
              <SweephLogo size="sm" />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                CREATE. GROW. EARN.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link to="/support" className="hover:text-foreground">
                Refund Policy
              </Link>
              <Link to="/community" className="hover:text-foreground">
                Community Guidelines
              </Link>
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() =>
                  toast.message('Report submitted', {
                    description: `Thanks — we'll review @${handle}.`,
                  })
                }
              >
                Report Creator
              </button>
            </nav>
            <div className="flex items-center gap-3 text-muted-foreground" aria-label="Social">
              {['X', 'IG', 'YT', 'DC'].map((s) => (
                <span
                  key={s}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[10px] font-bold"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CreatorProfile;
