import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Star, Sparkles, Loader2 } from 'lucide-react';

const filters = [
  { label: 'Trending', icon: TrendingUp },
  { label: 'Popular', icon: Star },
  { label: 'New', icon: Sparkles },
] as const;

export function CreatorDiscovery() {
  const [activeFilter, setActiveFilter] = useState('Trending');
  const [search, setSearch] = useState('');
  const creators = useQuery(api.creators.queries.listPublished, {
    search: search.trim() || undefined,
  });

  const filtered = useMemo(() => {
    if (!creators) return [];
    const sorted = [...creators];
    if (activeFilter === 'New') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sorted;
  }, [creators, activeFilter]);

  return (
    <section id="creators" className="py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-[12px] font-medium uppercase tracking-widest text-primary mb-3">
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
          <div className="flex items-center gap-2">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                  activeFilter === f.label
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-card text-muted-foreground border border-border hover:border-border hover:text-foreground'
                }`}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {creators === undefined ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {filtered.map((creator) => {
                const name = creator.displayName ?? creator.username;
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={creator._id}
                    className="group rounded-xl border border-border bg-card p-5 card-shadow transition-all duration-300 hover:card-shadow-hover hover:border-primary/20"
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
                        <h3 className="font-semibold text-[14px] leading-tight truncate text-foreground">
                          {name}
                        </h3>
                        <p className="text-[12px] text-muted-foreground">@{creator.username}</p>
                      </div>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                      {creator.bio || 'Sports creator on Wizzlet.'}
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full group-hover:border-primary/30 group-hover:text-primary transition-colors">
                      <Link to={`/c/${creator.username}`}>View profile</Link>
                    </Button>
                  </div>
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
    </section>
  );
}
