import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MemberDiscoverCreatorCard,
  MemberDiscoverCreatorCardSkeleton,
} from '@/components/discover/MemberDiscoverCreatorCard';
import { sportVisual } from '@/lib/sportVisual';
import {
  MEMBER_DISCOVER_DEMO_CREATORS,
  MEMBER_DISCOVER_SPORT_FILTERS,
  shouldUseMemberDiscoverDemo,
  type MemberDiscoverSportFilter,
} from '@/lib/memberDiscoverDemo';
import { Seo } from '@/components/Seo';
import { api } from '@convex/_generated/api';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

type SortKey = 'popular' | 'newest' | 'price';

type CardModel = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials?: string;
  bannerUrl: string | null;
  bannerTone?: string;
  bannerEmoji?: string;
  sports: string[];
  winRate: number | null;
  profit30dUnits: number | null;
  followersLabel: string | null;
  monthlyPriceCents: number;
  verified: boolean;
  postCount: number;
  popularityRank: number;
  createdAtMs: number;
  isDemo: boolean;
};

function inferSports(bio: string | null, username: string): string[] {
  const hay = `${bio ?? ''} ${username}`.toLowerCase();
  const found: string[] = [];
  for (const key of ['NBA', 'NFL', 'Soccer', 'Tennis', 'UFC', 'MLB', 'NHL']) {
    if (hay.includes(key.toLowerCase())) found.push(key);
  }
  return found.length > 0 ? found : ['Sports'];
}

const CustomerDiscover = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const qFromUrl = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(qFromUrl);
  const [sportFilter, setSportFilter] = useState<MemberDiscoverSportFilter>('All Sports');
  const [sort, setSort] = useState<SortKey>('popular');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [liveCreators, setLiveCreators] = useState<CardModel[]>([]);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    setCursor(undefined);
    setLiveCreators([]);
  }, [query]);

  const creatorsRaw = useQuery(api.creators.queries.listPublished, {
    limit: PAGE_SIZE,
    cursor,
    search: query.trim() || undefined,
  });

  useEffect(() => {
    if (!creatorsRaw) return;
    const page: CardModel[] = creatorsRaw.items
      .filter((c) => Boolean(c.username))
      .map((c) => {
        const name = c.displayName?.trim() || c.username;
        const postCount = c.postCount ?? 0;
        return {
          id: c._id,
          username: c.username,
          displayName: name,
          bio: c.bio?.trim() || 'Verified Sweeph creator.',
          avatarUrl: c.avatarUrl ?? null,
          bannerUrl: c.bannerUrl ?? null,
          sports: inferSports(c.bio ?? null, c.username),
          winRate: null,
          profit30dUnits: null,
          followersLabel: null,
          monthlyPriceCents: c.monthlyPriceCents ?? 999,
          verified: c.verificationStatus === 'verified',
          postCount,
          popularityRank: postCount,
          createdAtMs: c.createdAt,
          isDemo: false,
        };
      });
    setLiveCreators((prev) => {
      if (!cursor) return page;
      const seen = new Set(prev.map((c) => c.id));
      return [...prev, ...page.filter((c) => !seen.has(c.id))];
    });
  }, [creatorsRaw, cursor]);

  const loading = creatorsRaw === undefined && liveCreators.length === 0;

  const useDemo = shouldUseMemberDiscoverDemo({
    creatorCount: liveCreators.length,
    forceDemo,
    disableDemo,
  });

  const demoCards: CardModel[] = useMemo(
    () =>
      MEMBER_DISCOVER_DEMO_CREATORS.map((d, index) => ({
        id: d.id,
        username: d.username,
        displayName: d.displayName,
        bio: d.bio,
        avatarUrl: null,
        avatarInitials: d.avatarInitials,
        bannerUrl: null,
        bannerTone: d.bannerTone,
        bannerEmoji: d.bannerEmoji,
        sports: d.sports,
        winRate: d.winRate,
        profit30dUnits: d.profit30dUnits,
        followersLabel: d.followersLabel,
        monthlyPriceCents: d.monthlyPriceCents,
        verified: d.verified,
        postCount: 0,
        // Higher = more popular; preserves mockup #1…#8 order for Popular sort.
        popularityRank: MEMBER_DISCOVER_DEMO_CREATORS.length - index,
        createdAtMs: Date.now() - index * 86_400_000,
        isDemo: true,
      })),
    [],
  );

  const source = useDemo ? demoCards : liveCreators;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter((c) => {
      if (sportFilter !== 'All Sports') {
        const hit = c.sports.some((s) => s.toLowerCase() === sportFilter.toLowerCase());
        if (!hit) return false;
      }
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.sports.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [source, sportFilter, query]);

  const visible = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === 'newest') return b.createdAtMs - a.createdAtMs;
      if (sort === 'price') return a.monthlyPriceCents - b.monthlyPriceCents;
      return b.popularityRank - a.popularityRank || (b.winRate ?? 0) - (a.winRate ?? 0);
    });
  }, [filtered, sort]);

  const canLoadMore =
    !useDemo && Boolean(creatorsRaw && !creatorsRaw.isDone && creatorsRaw.continueCursor);

  const sortLabel =
    sort === 'newest' ? 'Newest' : sort === 'price' ? 'Lowest price' : 'Popular';

  return (
    <DashboardLayout type="member">
      <Seo
        title="Discover — Sweeph"
        description="Find winning creators and join a growing community on Sweeph."
      />

      <header className="mb-6">
        <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
          Discover
        </h1>
        <p className="mt-1.5 text-support text-muted-foreground">
          Find winning creators and join a growing community.
        </p>
      </header>

      {useDemo ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample Discover grid for design review. Add{' '}
            <code className="rounded bg-amber-500/20 px-1">?demo=0</code> for live creators only.
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MEMBER_DISCOVER_SPORT_FILTERS.map((sport) => {
            const active = sportFilter === sport;
            const emoji =
              sport === 'All Sports' ? null : sportVisual(sport).emoji;
            return (
              <button
                key={sport}
                type="button"
                onClick={() => setSportFilter(sport)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-[var(--shadow-card)]'
                    : 'border-border bg-card text-foreground hover:bg-muted/50',
                )}
              >
                {emoji ? <span aria-hidden>{emoji}</span> : null}
                {sport}
              </button>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 shrink-0 rounded-full border-border bg-card px-3 text-foreground"
              >
                More
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {['MLB', 'NHL', 'Boxing', 'Golf'].map((sport) => (
                <DropdownMenuItem key={sport} onSelect={() => setSportFilter(sport)}>
                  {sportVisual(sport).emoji} {sport}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-full border-border bg-card px-3.5 text-sm font-semibold text-foreground"
            >
              Sort by: {sortLabel}
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setSort('popular')}>Popular</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort('newest')}>Newest</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort('price')}>Lowest price</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading && !useDemo ? (
        <ul
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          aria-busy="true"
          aria-label="Loading creators"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <MemberDiscoverCreatorCardSkeleton key={i} />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            {query.trim() ? `No creators match “${query.trim()}”.` : 'No creators found'}
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            {query.trim()
              ? 'Try a different search or sport filter.'
              : 'New creators appear here as soon as they publish.'}
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-xl">
            <Link to="/dashboard">Back to Home</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((c, index) => (
              <MemberDiscoverCreatorCard
                key={c.id}
                rank={index + 1}
                username={c.username}
                displayName={c.displayName}
                bio={c.bio}
                avatarUrl={c.avatarUrl}
                avatarInitials={c.avatarInitials}
                bannerUrl={c.bannerUrl}
                bannerTone={c.bannerTone}
                bannerEmoji={c.bannerEmoji}
                sports={c.sports}
                winRate={c.winRate}
                profit30dUnits={c.profit30dUnits}
                followersLabel={c.followersLabel}
                monthlyPriceCents={c.monthlyPriceCents}
                verified={c.verified}
              />
            ))}
          </ul>
          {canLoadMore ? (
            <div className="flex justify-center pt-8">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
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
          ) : null}
        </>
      )}
    </DashboardLayout>
  );
};

export default CustomerDiscover;
