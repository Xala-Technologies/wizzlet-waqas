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
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import { SurfaceCard } from '@/components/ux/SurfaceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

type SortKey = 'popular' | 'newest' | 'price';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Most active' },
  { key: 'newest', label: 'Newest' },
  { key: 'price', label: 'Lowest list price' },
];

/**
 * Public discovery directory — same data as /creators with clearer compare signals.
 */
const Discover = () => {
  const creatorsPage = useQuery(api.creators.queries.listPublished, {});
  const creators = creatorsPage?.items;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const { user, role } = useAuth();
  const dashboardPath =
    role === 'creator' ? '/creator' : role === 'admin' ? '/admin' : '/dashboard';

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
        return (a.monthlyPriceCents ?? Number.POSITIVE_INFINITY) - (b.monthlyPriceCents ?? Number.POSITIVE_INFINITY);
      }
      return (b.postCount ?? 0) - (a.postCount ?? 0);
    });
    return filtered;
  }, [creators, search, sort]);

  return (
    <div className="flex min-h-screen flex-col bg-noise">
      <Seo
        title="Discover Creators — Prizelet"
        description="Browse published Prizelet creators, compare published post counts and list prices, then open a profile to subscribe."
      />
      <Navbar />

      <main id="main-content" className="relative flex-1">
        <section className="container relative pt-28 pb-8 md:pt-32 md:pb-10">
          <p className="mb-4 text-caption font-medium uppercase tracking-[0.22em] text-primary">
            Prizelet · Discover
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">
            Find creators worth paying for
          </h1>
          <p className="mt-4 max-w-xl text-ui leading-relaxed text-muted-foreground">
            Compare published activity and featured list prices, then open a profile for tiers,
            sample posts, and checkout. No fabricated reviews or win-rate claims.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:min-w-0 sm:max-w-md sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or handle…"
                className="h-11 min-h-11 pl-10"
                aria-label="Search creators"
              />
            </div>
            <div
              className={`${segmentedTrackClassName} w-full sm:w-auto`}
              role="group"
              aria-label="Sort creators"
            >
              {sortOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setSort(o.key)}
                  aria-pressed={sort === o.key}
                  className={segmentedItemClassName(sort === o.key)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container relative pb-16 md:pb-20">
          {creatorsPage === undefined ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading creators">
              {[0, 1, 2, 3].map((i) => (
                <SurfaceCard key={i} className="p-5">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </SurfaceCard>
              ))}
            </div>
          ) : !creators || creators.length === 0 ? (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                The roster is still forming
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
            <p className="py-16 text-center text-sm text-muted-foreground">
              No creators match “{search.trim()}”.
            </p>
          ) : (
            <SurfaceCard>
              <ul className="divide-y divide-border">
                {visible.map((c, index) => {
                  const name = c.displayName ?? c.username;
                  const price =
                    c.monthlyPriceCents != null
                      ? `$${(c.monthlyPriceCents / 100).toFixed(0)}/mo`
                      : 'Tiers on profile';
                  return (
                    <li key={c._id}>
                      <Link
                        to={creatorProfilePath(c.username)}
                        className="group flex flex-col gap-4 px-4 py-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <span className="w-6 shrink-0 pt-3 text-support tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-sm font-bold text-primary">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              name[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                                {name}
                              </span>
                              <span className="text-support text-muted-foreground">@{c.username}</span>
                              {c.verificationStatus === 'verified' && (
                                <span className="text-caption font-medium uppercase tracking-wider text-primary">
                                  Verified
                                </span>
                              )}
                            </div>
                            {c.bio ? (
                              <p className="mt-1 line-clamp-2 text-support leading-relaxed text-muted-foreground">
                                {c.bio}
                              </p>
                            ) : null}
                            <p className="mt-2 text-support text-muted-foreground/80">
                              {c.postCount} {c.postCount === 1 ? 'post' : 'posts'} published
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 pl-16 sm:pl-0">
                          <span className="font-mono text-support tabular-nums text-foreground">
                            {price}
                          </span>
                          <span className="text-support font-medium text-primary">View profile →</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SurfaceCard>
          )}
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
            <div className="max-w-md">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {user ? 'Ready to manage your account?' : 'Already browsing as a member?'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
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
