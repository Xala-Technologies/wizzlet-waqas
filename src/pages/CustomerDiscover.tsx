import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Search, Bookmark, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

interface CreatorRow {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  monthly_price: number | null;
  created_at: string;
}

type SortKey = 'popular' | 'newest' | 'price';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Most Active' },
  { key: 'newest', label: 'Newest' },
  { key: 'price', label: 'Lowest Price' },
];

const CustomerDiscover = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const creatorsRaw = useQuery(api.creators.queries.listPublished, {});
  const bookmarkRows = useQuery(api.bookmarks.mutations.listCreatorBookmarks, user ? {} : 'skip');
  const toggleCreatorBookmark = useMutation(api.bookmarks.mutations.toggleCreatorBookmark);

  const loading = creatorsRaw === undefined || (user ? bookmarkRows === undefined : false);

  const creators: CreatorRow[] = useMemo(
    () =>
      (creatorsRaw?.items ?? []).map((c) => ({
        id: c._id,
        username: c.username,
        display_name: c.displayName ?? null,
        bio: c.bio ?? null,
        avatar_url: c.avatarUrl ?? null,
        monthly_price: c.monthlyPriceCents != null ? c.monthlyPriceCents / 100 : null,
        created_at: new Date(c.createdAt).toISOString(),
      })),
    [creatorsRaw],
  );

  const postCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of creatorsRaw?.items ?? []) {
      counts[c._id] = c.postCount ?? 0;
    }
    return counts;
  }, [creatorsRaw]);

  const bookmarks = useMemo(() => {
    const marks: Record<string, string> = {};
    for (const b of bookmarkRows ?? []) {
      marks[b.creatorId] = b._id;
    }
    return marks;
  }, [bookmarkRows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = creators.filter((c) => {
      if (!q) return true;
      return (
        (c.display_name ?? '').toLowerCase().includes(q) ||
        (c.username ?? '').toLowerCase().includes(q) ||
        (c.bio ?? '').toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'price') return Number(a.monthly_price ?? 0) - Number(b.monthly_price ?? 0);
      return (postCounts[b.id] ?? 0) - (postCounts[a.id] ?? 0);
    });
  }, [creators, query, sort, postCounts]);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discover Creators</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Find top-performing creators to follow</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators"
            className="pl-9 h-9 text-sm"
            aria-label="Search creators"
          />
        </div>
        <div className="flex gap-1.5">
          {sortOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sort === o.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" /> Published Creators
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No creators found</h3>
          <p className="text-xs text-muted-foreground">
            {query ? 'Try a different search term.' : 'New creators appear here as soon as they publish.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c, index) => {
            const name = c.display_name || c.username || 'Creator';
            const bookmarked = Boolean(bookmarks[c.id]);
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={`${name} avatar`} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{name[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{name}</p>
                    {c.username && <p className="text-xs text-muted-foreground mb-2">@{c.username}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.bio || 'No bio yet.'}</p>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <FileText className="h-3 w-3" /> {postCounts[c.id] ?? 0} posts published
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-bold text-primary">
                      ${Number(c.monthly_price ?? 0).toFixed(2)}/mo
                    </span>
                    <div className="flex items-center gap-1.5">
                      {user && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${bookmarked ? 'text-primary' : 'text-muted-foreground'}`}
                          aria-label={bookmarked ? `Remove ${name} from bookmarks` : `Bookmark ${name}`}
                          onClick={() => toggleBookmark(c.id)}
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                      {c.username && (
                        <Link to={`/${c.username}`}>
                          <Button size="sm" className="h-7 text-xs">View Profile</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerDiscover;
