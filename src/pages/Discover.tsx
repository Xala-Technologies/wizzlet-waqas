import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { LandingFooterCta } from '@/components/landing/LandingFooterCta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search } from 'lucide-react';
import {
  CreatorDiscoveryCard,
  CreatorDiscoveryCardSkeleton,
} from '@/components/discover/CreatorDiscoveryCard';
import { DiscoverSportCollage } from '@/components/discover/DiscoverSportCollage';
import { DiscoverSportFilterBar } from '@/components/discover/DiscoverSportFilterBar';
import { SweephRibbonBackground } from '@/components/brand/SweephRibbonBackground';
import {
  DISCOVER_DEMO_CREATORS,
  inferDiscoverSport,
  type DiscoverSportFilter,
} from '@/lib/discoverDemo';

type CardModel = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials: string | null;
  bannerUrl: string | null;
  bannerTone: string | null;
  sportLabel: string;
  monthlyPriceCents: number | null;
  verificationStatus: string | null;
  postCount: number;
  createdAt: number;
  isDemo: boolean;
};

/**
 * Public Discover — sport-first hero, category filters, Join cards (PO mock).
 */
const Discover = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const qFromUrl = searchParams.get('q') ?? '';

  const creatorsPage = useQuery(api.creators.queries.listPublished, {});
  const [search, setSearch] = useState(qFromUrl);
  const [sportFilter, setSportFilter] = useState<DiscoverSportFilter>('All');

  useEffect(() => {
    setSearch(qFromUrl);
  }, [qFromUrl]);

  const liveCreators: CardModel[] = useMemo(() => {
    if (!creatorsPage?.items) return [];
    return creatorsPage.items
      .filter((c) => Boolean(c.username))
      .map((c) => ({
        id: c._id,
        username: c.username,
        displayName: c.displayName?.trim() || c.username,
        bio: c.bio?.trim() ?? '',
        avatarUrl: c.avatarUrl ?? null,
        avatarInitials: null,
        bannerUrl: c.bannerUrl ?? null,
        bannerTone: null,
        sportLabel: inferDiscoverSport(c.bio, c.username),
        monthlyPriceCents: c.monthlyPriceCents ?? null,
        verificationStatus: c.verificationStatus ?? null,
        postCount: c.postCount ?? 0,
        createdAt: c.createdAt,
        isDemo: false,
      }));
  }, [creatorsPage]);

  const useDemo =
    forceDemo ||
    (!disableDemo && creatorsPage !== undefined && liveCreators.length === 0);

  const roster: CardModel[] = useMemo(() => {
    if (useDemo) {
      return DISCOVER_DEMO_CREATORS.map((c) => ({
        id: c.id,
        username: c.username,
        displayName: c.displayName,
        bio: c.bio,
        avatarUrl: null,
        avatarInitials: c.avatarInitials,
        bannerUrl: null,
        bannerTone: c.bannerTone,
        sportLabel: c.sport,
        monthlyPriceCents: c.monthlyPriceCents,
        verificationStatus: c.verified ? 'verified' : null,
        postCount: c.postCount,
        createdAt: c.createdAt,
        isDemo: true,
      }));
    }
    return liveCreators;
  }, [useDemo, liveCreators]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = roster;
    if (sportFilter !== 'All') {
      list = list.filter((c) => c.sportLabel === sportFilter);
    }
    if (q) {
      list = list.filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          c.displayName.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.sportLabel.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.postCount - a.postCount);
  }, [roster, search, sportFilter]);

  const loading = creatorsPage === undefined && !forceDemo;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Seo
        title="Discover — Sports Creators & Communities | Sweeph"
        description="Discover sports creators and communities. Get picks, analysis, training programs and exclusive content from top creators."
      />
      <Navbar />

      <main id="main-content" className="relative flex flex-1 flex-col bg-background">
        {/* Hero */}
        <div className="relative overflow-hidden pb-10 md:pb-16">
          <SweephRibbonBackground variant="discover" />
          <section className="container relative z-10 pb-10 pt-28 md:pb-14 md:pt-32">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
              <div className="max-w-[560px]">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#429FF0] dark:text-primary">
                  Discover.
                </p>
                <h1 className="text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[3.25rem]">
                  Discover sports creators and{' '}
                  <span className="text-[#429FF0] dark:text-primary">communities.</span>
                </h1>
                <p className="mt-5 max-w-[440px] text-lg leading-relaxed text-muted-foreground">
                  Get picks, analysis, training programs and exclusive content from top creators.
                </p>

                <form
                  className="mt-8 flex h-14 w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card pl-5 pr-2 shadow-[0_12px_36px_rgba(8,24,47,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
                  onSubmit={(e) => e.preventDefault()}
                  role="search"
                >
                  <Search className="h-5 w-5 shrink-0 text-foreground/40" aria-hidden />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search creators, teams, leagues or sports..."
                    className="h-full min-h-0 flex-1 border-0 bg-transparent px-2 text-base font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Search creators"
                  />
                </form>
              </div>

              <DiscoverSportCollage className="hidden sm:block" />
            </div>
          </section>
        </div>

        {/* Sport filters + grid — continues white canvas from mock */}
        <section
          className="container relative flex-1 bg-background pb-12 md:pb-16"
          aria-labelledby="discover-creators-heading"
        >
          <DiscoverSportFilterBar
            value={sportFilter}
            onChange={setSportFilter}
            className="mb-8"
          />

          <h2 id="discover-creators-heading" className="sr-only">
            Creators
          </h2>

          {useDemo ? (
            <div
              className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
              role="status"
            >
              Sample preview for design review — not live creators. Add{' '}
              <code className="rounded bg-amber-500/20 px-1">?demo=0</code> to hide.
            </div>
          ) : null}

          {loading ? (
            <ul
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-7"
              aria-busy="true"
              aria-label="Loading creators"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <CreatorDiscoveryCardSkeleton key={i} />
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {search.trim() || sportFilter !== 'All'
                  ? 'No creators match your filters'
                  : 'The roster is still forming'}
              </p>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {search.trim() || sportFilter !== 'All'
                  ? 'Try another sport or clear the search.'
                  : 'Published creators appear here as soon as they go live.'}
              </p>
              {!search.trim() && sportFilter === 'All' ? (
                <Link to="/signup" className="mt-8 inline-block">
                  <Button variant="hero" className="gap-2">
                    Apply for access <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-7">
              {visible.map((c, index) => (
                <CreatorDiscoveryCard
                  key={c.id}
                  username={c.username}
                  displayName={c.displayName}
                  bio={c.bio}
                  avatarUrl={c.avatarUrl}
                  avatarInitials={c.avatarInitials}
                  bannerUrl={c.bannerUrl}
                  bannerTone={c.bannerTone}
                  sportLabel={c.sportLabel}
                  monthlyPriceCents={c.monthlyPriceCents}
                  verificationStatus={c.verificationStatus}
                  postCount={c.postCount}
                  className="animate-fade-in-up opacity-0"
                  style={{
                    animationDelay: `${Math.min(index, 8) * 40}ms`,
                    animationFillMode: 'forwards',
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="mt-auto">
          <LandingFooterCta />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Discover;
