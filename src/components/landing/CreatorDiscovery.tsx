import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Star, Sparkles } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import { SurfaceCard } from '@/components/ux/SurfaceCard';
import { Skeleton } from '@/components/ui/skeleton';

const filters = [
  { label: 'Most active', icon: TrendingUp },
  { label: 'Newest', icon: Sparkles },
  { label: 'Lowest list price', icon: Star },
] as const;

export function CreatorDiscovery() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]['label']>('Most active');
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
    } else if (activeFilter === 'Lowest list price') {
      sorted.sort(
        (a, b) => (a.monthlyPriceCents ?? Number.POSITIVE_INFINITY) - (b.monthlyPriceCents ?? Number.POSITIVE_INFINITY),
      );
    } else {
      sorted.sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0));
    }
    return sorted;
  }, [creators, activeFilter]);

  return (
    <LandingSection id="creators" className="bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-support font-medium uppercase tracking-widest text-primary mb-3">
            Network
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-foreground">
            Creators on the platform
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Verified creators building real audiences. Subscribe to access their premium content.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-10 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card border-border focus-visible:ring-primary/30"
            />
          </div>
          <div
            className={`${segmentedTrackClassName} w-full sm:w-auto flex-wrap`}
            role="group"
            aria-label="Sort creators"
          >
            {filters.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setActiveFilter(f.label)}
                aria-pressed={activeFilter === f.label}
                className={segmentedItemClassName(activeFilter === f.label)}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link to="/discover">Browse full directory</Link>
            </Button>
          </div>
        </div>

        {creatorsPage === undefined ? (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
            aria-busy="true"
            aria-label="Loading creators"
          >
            {[0, 1, 2].map((i) => (
              <SurfaceCard key={i} className="p-5">
                <Skeleton className="h-28 w-full rounded-lg" />
              </SurfaceCard>
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {filtered.map((creator) => {
                const name = creator.displayName ?? creator.username;
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <SurfaceCard
                    key={creator._id}
                    className="group p-5 transition-colors hover:border-primary/20"
                  >
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold overflow-hidden">
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ui leading-tight truncate text-foreground">
                          {name}
                        </h3>
                        <p className="text-support text-muted-foreground">@{creator.username}</p>
                      </div>
                    </div>
                    <p className="text-support text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                      {creator.bio || 'Sports creator on Prizelet.'}
                    </p>
                    <p className="text-support text-muted-foreground mb-4">
                      {(creator.postCount ?? 0) === 1
                        ? '1 post published'
                        : `${creator.postCount ?? 0} posts published`}
                      {creator.monthlyPriceCents != null
                        ? ` · $${(creator.monthlyPriceCents / 100).toFixed(0)}/mo list`
                        : ''}
                    </p>
                    <Button asChild className="w-full min-h-11">
                      <Link to={creatorProfilePath(creator.username)}>View profile</Link>
                    </Button>
                  </SurfaceCard>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                No published creators yet. Be the first to go live.
              </p>
            )}
          </>
        )}
      </div>
    </LandingSection>
  );
}
