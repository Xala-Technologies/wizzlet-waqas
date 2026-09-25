import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, BadgeDollarSign, Search, Sparkles, TrendingUp } from 'lucide-react';
import { DiscoveryFilterBar, type DiscoveryFilterOption } from '@/components/discover/DiscoveryFilterBar';
import { DiscoverGamesPanel } from '@/components/discover/DiscoverGamesPanel';
import {
  CreatorDiscoveryCard,
  CreatorDiscoveryCardSkeleton,
} from '@/components/discover/CreatorDiscoveryCard';
import { useAuth } from '@/contexts/AuthContext';

type SortKey = 'popular' | 'newest' | 'price';

const sortOptions: DiscoveryFilterOption<SortKey>[] = [
  { key: 'popular', label: 'Most active', icon: TrendingUp },
  { key: 'newest', label: 'Newest', icon: Sparkles },
  { key: 'price', label: 'Lowest price', icon: BadgeDollarSign },
];

/**
 * Discover — creators first, today's games stacked below (one page, no section tabs).
 */
const Discover = () => {
  const { hash, search: locationSearch } = useLocation();
  const creatorsPage = useQuery(api.creators.queries.listPublished, {});
  const creators = creatorsPage?.items;
  const [search, setSearch] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const { user, role } = useAuth();
  const dashboardPath =
    role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    const wantsGames =
      hash === '#todays-games' || params.get('view') === 'games';
    if (!wantsGames) return;
    const el = document.getElementById('todays-games');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash, locationSearch]);

  const visible = useMemo(() => {
    if (!creators) return [];
    const q = search.trim().toLowerCase();
    const filtered = !q
      ? [...creators]
      : creators.filter(
          (c) =>
            c.username.toLowerCase().includes(q) ||
            (c.displayName ?? '').toLowerCase().includes(q) ||
            (c.bio ?? '').toLowerCase().includes(q),
        );
    filtered.sort((a, b) => {
      if (sort === 'newest') return b.createdAt - a.createdAt;
      if (sort === 'price') {
        return (
          (a.monthlyPriceCents ?? Number.POSITIVE_INFINITY) -
          (b.monthlyPriceCents ?? Number.POSITIVE_INFINITY)
        );
      }
      return (b.postCount ?? 0) - (a.postCount ?? 0);
    });
    return filtered;
  }, [creators, search, sort]);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Seo
        title="Discover — Creators & Today's Games | Sweeph"
        description="Browse published Sweeph creators and today’s matchups in one place."
      />
      <Navbar />

      <main id="main-content" className="relative flex-1 bg-background">
        <section className="container relative pt-28 pb-8 md:pt-32 md:pb-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Discover
              </h1>
              <p className="mt-3 text-base leading-relaxed text-secondary-foreground">
                Find creators worth paying for, then check today’s games on the same page.
              </p>
            </div>
            <a
              href="#todays-games"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Today’s games
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <form
            className="mt-8 flex h-14 w-full items-center gap-2 rounded-full border border-border bg-card pl-4 pr-2 shadow-[var(--shadow-card)]"
            onSubmit={(e) => {
              e.preventDefault();
            }}
            role="search"
          >
            <Search className="h-5 w-5 shrink-0 text-foreground/45" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators…"
              className="h-full min-h-0 flex-1 border-0 bg-transparent px-2 text-base font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search creators"
            />
            <Button type="submit" className="h-10 shrink-0 rounded-full px-5 font-semibold">
              Search
            </Button>
          </form>

          <DiscoveryFilterBar<SortKey>
            className="mt-4"
            options={sortOptions}
            value={sort}
            onChange={setSort}
            aria-label="Sort creators"
          />
        </section>

        {/* Creators */}
        <section className="container relative pb-16 md:pb-20" aria-labelledby="discover-creators-heading">
          <h2
            id="discover-creators-heading"
            className="mb-6 text-2xl font-bold tracking-tight text-foreground"
          >
            Creators
          </h2>

          {creatorsPage === undefined ? (
            <ul
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8"
              aria-busy="true"
              aria-label="Loading creators"
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <CreatorDiscoveryCardSkeleton key={i} />
              ))}
            </ul>
          ) : !creators || creators.length === 0 ? (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                The roster is still forming
              </p>
              <p className="mt-2 text-base leading-relaxed text-secondary-foreground">
                Published creators appear here as soon as they go live. If you have an edge worth
                charging for, apply for access.
              </p>
              <Link to="/signup" className="mt-8 inline-block">
                <Button variant="hero" className="gap-2">
                  Apply for access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-base text-secondary-foreground">
              No creators match “{search.trim()}”.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8">
              {visible.map((c, index) => (
                <CreatorDiscoveryCard
                  key={c._id}
                  username={c.username}
                  displayName={c.displayName}
                  bio={c.bio}
                  avatarUrl={c.avatarUrl}
                  bannerUrl={c.bannerUrl}
                  monthlyPriceCents={c.monthlyPriceCents}
                  verificationStatus={c.verificationStatus}
                  postCount={c.postCount}
                  rank={sort === 'popular' ? index + 1 : undefined}
                  activityNoun="post"
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

        {/* Today's Games — stacked under creators */}
        <section
          id="todays-games"
          className="scroll-mt-24 border-t border-border bg-background"
          aria-labelledby="discover-games-heading"
        >
          <div className="container py-14 md:py-16">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 max-w-2xl">
                <h2
                  id="discover-games-heading"
                  className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                >
                  Today’s Games
                </h2>
                <p className="mt-2 text-base text-secondary-foreground">{todayLabel}</p>
              </div>
            </div>

            <form
              className="mb-4 flex h-14 w-full items-center gap-2 rounded-full border border-border bg-card pl-4 pr-2 shadow-[var(--shadow-card)]"
              onSubmit={(e) => {
                e.preventDefault();
              }}
              role="search"
            >
              <Search className="h-5 w-5 shrink-0 text-foreground/45" aria-hidden />
              <Input
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                placeholder="Search teams, leagues…"
                className="h-full min-h-0 flex-1 border-0 bg-transparent px-2 text-base font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Search games"
              />
              <Button type="submit" className="h-10 shrink-0 rounded-full px-5 font-semibold">
                Search
              </Button>
            </form>

            <DiscoverGamesPanel search={gameSearch} />
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
            <div className="max-w-md">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {user ? 'Ready to manage your account?' : 'Already browsing as a member?'}
              </h2>
              <p className="mt-2 text-base text-secondary-foreground">
                {user
                  ? 'Open your dashboard for subscriptions, messages, and creator tools.'
                  : 'Sign in to bookmark creators and manage subscriptions from your dashboard.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Link to={dashboardPath}>
                  <Button variant="outline" size="lg">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign in
                  </Button>
                </Link>
              )}
              <Link to="/creators">
                <Button variant="hero" size="lg" className="gap-2">
                  Creators directory <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Discover;
