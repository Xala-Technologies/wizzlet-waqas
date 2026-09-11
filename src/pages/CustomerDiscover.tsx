import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Bookmark, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

const PAGE_SIZE = 24;

interface CreatorRow {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  monthly_price: number | null;
  created_at: string;
  postCount: number;
}

type SortKey = 'popular' | 'newest' | 'price';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Most active' },
  { key: 'newest', label: 'Newest' },
  { key: 'price', label: 'Lowest list price' },
];

const CustomerDiscover = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
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

  const creatorsRaw = useQuery(api.creators.queries.listPublished, {
    limit: PAGE_SIZE,
    cursor,
    search: debouncedSearch || undefined,
  });
  const bookmarkRows = useQuery(api.bookmarks.mutations.listCreatorBookmarks, user ? {} : 'skip');
  const toggleCreatorBookmark = useMutation(api.bookmarks.mutations.toggleCreatorBookmark);

  useEffect(() => {
    if (!creatorsRaw) return;
    const page: CreatorRow[] = creatorsRaw.items.map((c) => ({
      id: c._id,
      username: c.username,
      display_name: c.displayName ?? null,
      bio: c.bio ?? null,
      avatar_url: c.avatarUrl ?? null,
      monthly_price: c.monthlyPriceCents != null ? c.monthlyPriceCents / 100 : null,
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
    (user ? bookmarkRows === undefined : false);

  const bookmarks = useMemo(() => {
    const marks: Record<string, string> = {};
    for (const b of bookmarkRows ?? []) {
      marks[b.creatorId] = b._id;
    }
    return marks;
  }, [bookmarkRows]);

  const visible = useMemo(() => {
    return [...creators].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'price') return Number(a.monthly_price ?? 0) - Number(b.monthly_price ?? 0);
      return b.postCount - a.postCount;
    });
  }, [creators, sort]);

  const canLoadMore = Boolean(creatorsRaw && !creatorsRaw.isDone && creatorsRaw.continueCursor);

  const toggleBookmark = async (creatorId: string) => {
    if (!user) return;
    const existing = bookmarks[creatorId];
    try {
      await toggleCreatorBookmark({ creatorId: creatorId as Id<'creators'> });
      toast.success(existing ? 'Bookmark removed' : 'Saved to your bookmarks');
    } catch {
      toast.error(existing ? 'Could not remove bookmark' : 'Could not bookmark this creator');
    }
  };

  return (
    <DashboardLayout type="member">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Discover creators</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Browse published creators. List price is a featured monthly signal — product tiers are on
          each profile.
        </p>
      </header>

      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:flex-1 sm:min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators"
            className="pl-9 h-11 min-h-11 text-ui w-full"
            aria-label="Search creators"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto" role="group" aria-label="Sort creators">
          {sortOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setSort(o.key)}
              aria-pressed={sort === o.key}
              className={`min-h-11 px-3 rounded-lg text-support font-medium transition-colors ${
                sort === o.key
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-support font-medium text-muted-foreground mb-3">
        Published creators
        {!loading && visible.length > 0 ? (
          <span className="text-muted-foreground/80"> · {visible.length} shown</span>
        ) : null}
      </h2>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading creators">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creators found</h3>
          <p className="text-support text-muted-foreground max-w-sm mx-auto">
            {query.trim()
              ? 'Try a different search term.'
              : 'New creators appear here as soon as they publish.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c, index) => {
            const name = c.display_name || c.username || 'Creator';
            const bookmarked = Boolean(bookmarks[c.id]);
            const listPrice =
              c.monthly_price != null ? `$${Number(c.monthly_price).toFixed(2)}/mo` : '—';
            return (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1 shrink-0">
                    <span className="text-support text-muted-foreground font-medium">#{index + 1}</span>
                    {c.avatar_url ? (
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-ui font-bold text-muted-foreground">
                          {name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ui font-semibold text-foreground truncate">{name}</p>
                    {c.username && (
                      <p className="text-support text-muted-foreground mb-2">@{c.username}</p>
                    )}
                    <p className="text-support text-muted-foreground line-clamp-2 mb-2">
                      {c.bio || 'No bio yet.'}
                    </p>
                    <span className="flex items-center gap-1 text-support text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> {c.postCount} posts published
                    </span>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <span className="text-ui font-bold text-foreground">{listPrice}</span>
                    <div className="flex items-center gap-2">
                      {user && (
                        <Button
                          type="button"
                          variant="outline"
                          className={`min-h-11 min-w-11 px-3 ${bookmarked ? 'text-primary' : ''}`}
                          aria-label={
                            bookmarked ? `Remove ${name} from bookmarks` : `Bookmark ${name}`
                          }
                          onClick={() => void toggleBookmark(c.id)}
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                      {c.username ? (
                        <Button className="min-h-11" asChild>
                          <Link to={`/${c.username}`}>View profile</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {canLoadMore && (
            <div className="flex justify-center pt-2">
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
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerDiscover;
