import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  BadgeDollarSign,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { DiscoveryFilterBar, type DiscoveryFilterOption } from '@/components/discover/DiscoveryFilterBar';
import { DiscoverGamesPanel } from '@/components/discover/DiscoverGamesPanel';
import {
  CreatorDiscoveryCard,
  CreatorDiscoveryCardSkeleton,
} from '@/components/discover/CreatorDiscoveryCard';
import { subscriptionGrantsContentAccess } from '../../convex/lib/contentAccess';
import { Seo } from '@/components/Seo';

const PAGE_SIZE = 24;

interface CreatorRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  monthly_price_cents: number | null;
  verification_status: string | null;
  created_at: string;
  postCount: number;
}

type SortKey = 'popular' | 'newest' | 'price';

const sortOptions: DiscoveryFilterOption<SortKey>[] = [
  { key: 'popular', label: 'Most active', icon: TrendingUp },
  { key: 'newest', label: 'Newest', icon: Sparkles },
  { key: 'price', label: 'Lowest price', icon: BadgeDollarSign },
];

const CustomerDiscover = () => {
  const { user } = useAuth();
  const { hash } = useLocation();
  const [query, setQuery] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [creators, setCreators] = useState<CreatorRow[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setCursor(undefined);
    setCreators([]);
  }, [debouncedSearch]);

  useEffect(() => {
    if (hash !== '#todays-games') return;
    const el = document.getElementById('todays-games');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  const creatorsRaw = useQuery(api.creators.queries.listPublished, {
    limit: PAGE_SIZE,
    cursor,
    search: debouncedSearch || undefined,
  });
  const bookmarkRows = useQuery(api.bookmarks.mutations.listCreatorBookmarks, user ? {} : 'skip');
  const mySubs = useQuery(api.subscriptions.mutations.mySubscriptions, user ? {} : 'skip');
  const toggleCreatorBookmark = useMutation(api.bookmarks.mutations.toggleCreatorBookmark);

  useEffect(() => {
    if (!creatorsRaw) return;
    const page: CreatorRow[] = creatorsRaw.items
      .filter((c) => Boolean(c.username))
      .map((c) => ({
        id: c._id,
        username: c.username,
        display_name: c.displayName ?? null,
        bio: c.bio ?? null,
        avatar_url: c.avatarUrl ?? null,
        banner_url: c.bannerUrl ?? null,
        monthly_price_cents: c.monthlyPriceCents ?? null,
        verification_status: c.verificationStatus ?? null,
        created_at: new Date(c.createdAt).toISOString(),
        postCount: c.postCount ?? 0,
      }));
    setCreators((prev) => {
      if (!cursor) return page;
      const seen = new Set(prev.map((c) => c.id));
      return [...prev, ...page.filter((c) => !seen.has(c.id))];
    });
  }, [creatorsRaw, cursor]);

  const loading =
    (creatorsRaw === undefined && creators.length === 0) ||
    (user ? bookmarkRows === undefined || mySubs === undefined : false);

  const bookmarks = useMemo(() => {
    const marks: Record<string, string> = {};
    for (const b of bookmarkRows ?? []) {
      marks[b.creatorId] = b._id;
    }
    return marks;
  }, [bookmarkRows]);

  const activeCreatorIds = useMemo(() => {
    const now = Date.now();
    const ids = new Set<string>();
    for (const s of mySubs ?? []) {
      if (
        subscriptionGrantsContentAccess(
          {
            status: s.status,
            billingStatus: s.billingStatus,
            currentPeriodEnd: s.currentPeriodEnd,
            cancelAtPeriodEnd: s.cancelAtPeriodEnd,
          },
          now,
        )
      ) {
        ids.add(s.creatorId);
      }
    }
    return ids;
  }, [mySubs]);

  const visible = useMemo(() => {
    return [...creators].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'price') {
        return (a.monthly_price_cents ?? Number.POSITIVE_INFINITY) - (b.monthly_price_cents ?? Number.POSITIVE_INFINITY);
      }
      return b.postCount - a.postCount;
    });
  }, [creators, sort]);

  const canLoadMore = Boolean(creatorsRaw && !creatorsRaw.isDone && creatorsRaw.continueCursor);

  const toggleBookmark = async (creatorId: string, name: string) => {
    if (!user) return;
    const existing = bookmarks[creatorId];
    try {
      await toggleCreatorBookmark({ creatorId: creatorId as Id<'creators'> });
      toast.success(existing ? `Removed ${name} from bookmarks` : `Saved ${name}`);
    } catch {
      toast.error(existing ? 'Could not remove bookmark' : 'Could not bookmark this creator');
    }
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DashboardLayout type="member">
      <Seo
        title="Discover — Prizelet"
        description="Browse published Prizelet creators and today’s matchups."
      />
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Discover</h1>
          <p className="mt-2 text-base leading-relaxed text-secondary-foreground">
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
      </header>

      <form
        className="mb-4 flex h-14 w-full items-center gap-2 rounded-full border border-border bg-card pl-4 pr-2 shadow-[var(--shadow-card)]"
        onSubmit={(e) => {
          e.preventDefault();
        }}
        role="search"
      >
        <Search className="h-5 w-5 shrink-0 text-foreground/45" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators…"
          className="h-full min-h-0 flex-1 border-0 bg-transparent px-2 text-base font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Search creators"
        />
        <Button type="submit" className="h-10 shrink-0 rounded-full px-5 font-semibold">
          Search
        </Button>
      </form>

      <DiscoveryFilterBar<SortKey>
        className="mb-8"
        options={sortOptions}
        value={sort}
        onChange={setSort}
        aria-label="Sort creators"
      />

      <section className="mb-12" aria-labelledby="member-discover-creators-heading">
        <h2
          id="member-discover-creators-heading"
          className="mb-6 text-2xl font-bold tracking-tight text-foreground"
        >
          Creators
          {!loading && visible.length > 0 ? (
            <span className="ml-2 text-base font-medium text-secondary-foreground">
              · {visible.length} shown
            </span>
          ) : null}
        </h2>

        {loading ? (
          <ul
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8"
            aria-busy="true"
            aria-label="Loading creators"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <CreatorDiscoveryCardSkeleton key={i} />
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">
              {query.trim() ? `No creators match “${query.trim()}”.` : 'No creators found'}
            </p>
            <p className="mt-2 text-base text-secondary-foreground">
              {query.trim()
                ? 'Try a different search term.'
                : 'New creators appear here as soon as they publish.'}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8">
              {visible.map((c, index) => (
                <CreatorDiscoveryCard
                  key={c.id}
                  username={c.username}
                  displayName={c.display_name}
                  bio={c.bio}
                  avatarUrl={c.avatar_url}
                  bannerUrl={c.banner_url}
                  monthlyPriceCents={c.monthly_price_cents}
                  verificationStatus={c.verification_status}
                  postCount={c.postCount}
                  rank={sort === 'popular' ? index + 1 : undefined}
                  subscribed={activeCreatorIds.has(c.id)}
                  bookmarked={Boolean(bookmarks[c.id])}
                  onBookmarkClick={
                    user
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void toggleBookmark(c.id, c.display_name || c.username);
                        }
                      : undefined
                  }
                  className="animate-fade-in-up opacity-0"
                  style={{
                    animationDelay: `${Math.min(index, 8) * 40}ms`,
                    animationFillMode: 'forwards',
                  }}
                />
              ))}
            </ul>
            {canLoadMore && (
              <div className="flex justify-center pt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={creatorsRaw === undefined}
                  onClick={() => {
                    if (creatorsRaw?.continueCursor) setCursor(creatorsRaw.continueCursor);
                  }}
                >
                  {creatorsRaw === undefined ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <section
        id="todays-games"
        className="scroll-mt-8 border-t border-border pt-10"
        aria-labelledby="member-discover-games-heading"
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2
              id="member-discover-games-heading"
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
      </section>
    </DashboardLayout>
  );
};

export default CustomerDiscover;
