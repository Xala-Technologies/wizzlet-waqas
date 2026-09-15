import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search } from 'lucide-react';
import {
  CreatorDiscoveryCard,
  CreatorDiscoveryCardSkeleton,
} from '@/components/discover/CreatorDiscoveryCard';

const Creators = () => {
  const creatorsPage = useQuery(api.creators.queries.listPublished, {});
  const creators = creatorsPage?.items;
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!creators) return [];
    const q = search.trim().toLowerCase();
    if (!q) return creators;
    return creators.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        (c.displayName ?? '').toLowerCase().includes(q) ||
        (c.bio ?? '').toLowerCase().includes(q),
    );
  }, [creators, search]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Seo
        title="Top Sports Creators on Prizelet"
        description="Browse published creators on Prizelet, compare list prices and activity, and open a profile to subscribe."
      />
      <Navbar />

      <main id="main-content" className="relative flex-1 bg-background">
        <section className="container relative pt-28 pb-10 md:pt-32 md:pb-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Creators directory
              </h1>
              <p className="mt-3 text-base leading-relaxed text-secondary-foreground">
                Live profiles from the Prizelet network. Subscribe for gated content — no algorithm,
                no public feed noise.
              </p>
            </div>
            <Link
              to="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Discover
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
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
              placeholder="Search…"
              className="h-full min-h-0 flex-1 border-0 bg-transparent px-2 text-base font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search creators"
            />
            <Button type="submit" className="h-10 shrink-0 rounded-full px-5 font-semibold">
              Search
            </Button>
          </form>
        </section>

        <section className="container relative pb-16 md:pb-20">
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
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-base text-secondary-foreground">
              No creators match “{search.trim()}”.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8">
              {filtered.map((c, index) => (
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
                  activityNoun="pick"
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

        <section className="border-t border-border bg-card">
          <div className="container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
            <div className="max-w-md">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Have a record worth selling?
              </h2>
              <p className="mt-2 text-base text-secondary-foreground">
                Prizelet is invite-only infrastructure — not another public tip board.
              </p>
            </div>
            <Link to="/signup">
              <Button variant="hero" size="lg" className="gap-2">
                Apply for access <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Creators;
