import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Star, Sparkles, ArrowRight } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { DiscoveryFilterBar } from '@/components/discover/DiscoveryFilterBar';
import {
  CreatorDiscoveryCard,
  CreatorDiscoveryCardSkeleton,
} from '@/components/discover/CreatorDiscoveryCard';

const filters = [
  { key: 'Most active' as const, label: 'Most active', icon: TrendingUp },
  { key: 'Newest' as const, label: 'Newest', icon: Sparkles },
  { key: 'Lowest price' as const, label: 'Lowest price', icon: Star },
];

export function CreatorDiscovery() {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]['key']>('Most active');
  const [search, setSearch] = useState('');
  const creatorsPage = useQuery(api.creators.queries.listPublished, {
    search: search.trim() || undefined,
  });
  const creators = creatorsPage?.items;

  const filtered = useMemo(() => {
    if (!creators) return [];
    const sorted = [...creators];
    if (activeFilter === 'Newest') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else if (activeFilter === 'Lowest price') {
      sorted.sort(
        (a, b) =>
          (a.monthlyPriceCents ?? Number.POSITIVE_INFINITY) -
          (b.monthlyPriceCents ?? Number.POSITIVE_INFINITY),
      );
    } else {
      sorted.sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0));
    }
    return sorted;
  }, [creators, activeFilter]);

  return (
    <LandingSection id="creators" className="bg-background">
      <div className="container">
        <div className="mb-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Find a creator
              </h2>
              <p className="mt-3 text-base text-secondary-foreground">
                Verified creators building real audiences. Subscribe to access their premium content.
              </p>
            </div>
            <Link
              to="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Browse full directory
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <form
            className="flex h-14 w-full items-center gap-2 rounded-full border border-border bg-card pl-4 pr-2 shadow-[var(--shadow-card)]"
            onSubmit={(e) => {
              e.preventDefault();
            }}
            role="search"
          >
            <Search className="h-5 w-5 shrink-0 text-foreground/45" aria-hidden />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full min-h-0 flex-1 border-0 bg-transparent px-2 text-base font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search creators"
            />
            <Button type="submit" className="h-10 shrink-0 rounded-full px-5 font-semibold">
              Search
            </Button>
          </form>

          <DiscoveryFilterBar
            className="mt-4"
            options={filters}
            value={activeFilter}
            onChange={setActiveFilter}
            aria-label="Sort creators"
          />
        </div>

        {creatorsPage === undefined ? (
          <ul
            className="mx-auto grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8"
            aria-busy="true"
            aria-label="Loading creators"
          >
            {[0, 1, 2].map((i) => (
              <CreatorDiscoveryCardSkeleton key={i} />
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-base text-secondary-foreground">
            No published creators yet. Be the first to go live.
          </p>
        ) : (
          <ul className="mx-auto grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:gap-8">
            {filtered.map((creator, index) => (
              <CreatorDiscoveryCard
                key={creator._id}
                username={creator.username}
                displayName={creator.displayName}
                bio={creator.bio}
                avatarUrl={creator.avatarUrl}
                bannerUrl={creator.bannerUrl}
                monthlyPriceCents={creator.monthlyPriceCents}
                verificationStatus={creator.verificationStatus}
                postCount={creator.postCount ?? 0}
                rank={activeFilter === 'Most active' ? index + 1 : undefined}
                activityNoun="post"
              />
            ))}
          </ul>
        )}
      </div>
    </LandingSection>
  );
}
