import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { DiscoverSportFilterBar } from '@/components/discover/DiscoverSportFilterBar';
import {
  CreatorDiscoveryCard,
  CreatorDiscoveryCardSkeleton,
} from '@/components/discover/CreatorDiscoveryCard';
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
};

/**
 * Home creators strip — marketplace grid (not the testimonials spotlight layout).
 */
export function CreatorDiscovery() {
  const [sportFilter, setSportFilter] = useState<DiscoverSportFilter>('All');
  const [search, setSearch] = useState('');

  const creatorsPage = useQuery(api.creators.queries.listPublished, {
    search: search.trim() || undefined,
  });

  const useDemo = creatorsPage !== undefined && (creatorsPage.items?.length ?? 0) === 0;

  const filtered = useMemo(() => {
    if (useDemo) {
      return DISCOVER_DEMO_CREATORS.filter((c) => {
        if (sportFilter !== 'All' && c.sport !== sportFilter) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          c.displayName.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.sport.toLowerCase().includes(q)
        );
      }).map(
        (c): CardModel => ({
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
        }),
      );
    }

    const creators = creatorsPage?.items ?? [];
    return creators
      .map(
        (c): CardModel => ({
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
        }),
      )
      .filter((c) => sportFilter === 'All' || c.sportLabel === sportFilter)
      .sort((a, b) => b.postCount - a.postCount);
  }, [creatorsPage, sportFilter, search, useDemo]);

  const roster = filtered.slice(0, 8);

  return (
    <LandingSection
      id="creators"
      className="relative overflow-hidden border-t border-border/60 bg-white dark:bg-background"
    >
      <div className="container relative z-10">
        {/* Split header — marketplace, not centered social-proof */}
        <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-12">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-[#429FF0]">
              Marketplace
            </p>
            <h2 className="max-w-xl text-[2rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-4xl lg:text-[2.75rem]">
              Browse the roster.
              <br />
              <span className="text-[#429FF0]">Join who fits.</span>
            </h2>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-md text-base leading-relaxed text-muted-foreground lg:ml-auto lg:text-right">
              Picks, analysis, and gated communities from verified sports creators — filter by sport
              or search the directory.
            </p>
            <div className="mt-4 flex lg:justify-end">
              <Link
                to="/discover"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#429FF0] transition-colors hover:text-[#256DC1]"
              >
                Open Discover
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        {/* Slim filter rail — edge-to-edge feel, no glass “card” panel */}
        <div className="mb-8 flex flex-col gap-4 border-y border-border/70 py-4 sm:flex-row sm:items-center sm:gap-6">
          <form
            className="flex h-11 w-full max-w-sm shrink-0 items-center gap-2 rounded-full border border-border bg-[#F7FAFD] pl-4 pr-3 dark:bg-muted/40"
            onSubmit={(e) => e.preventDefault()}
            role="search"
          >
            <Search className="h-4 w-4 shrink-0 text-foreground/40" aria-hidden />
            <Input
              placeholder="Search roster…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full min-h-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search creators"
            />
          </form>
          <div className="min-w-0 flex-1 overflow-x-auto">
            <DiscoverSportFilterBar value={sportFilter} onChange={setSportFilter} />
          </div>
        </div>

        {creatorsPage === undefined ? (
          <ul
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
            aria-busy="true"
            aria-label="Loading creators"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <CreatorDiscoveryCardSkeleton key={i} />
            ))}
          </ul>
        ) : roster.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-foreground">No creators in this filter</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear search or pick another sport to keep browsing.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {roster.map((creator, index) => (
              <CreatorDiscoveryCard
                key={creator.id}
                username={creator.username}
                displayName={creator.displayName}
                bio={creator.bio}
                avatarUrl={creator.avatarUrl}
                avatarInitials={creator.avatarInitials}
                bannerUrl={creator.bannerUrl}
                bannerTone={creator.bannerTone}
                sportLabel={creator.sportLabel}
                monthlyPriceCents={creator.monthlyPriceCents}
                verificationStatus={creator.verificationStatus}
                postCount={creator.postCount}
                className="animate-fade-in-up opacity-0"
                style={{
                  animationDelay: `${Math.min(index, 7) * 45}ms`,
                  animationFillMode: 'forwards',
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </LandingSection>
  );
}
