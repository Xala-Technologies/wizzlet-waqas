import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, Lock, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';

interface SavedPost {
  id: string;
  created_at: string;
  post: {
    id: string;
    title: string;
    content: string | null;
    is_premium: boolean;
    creator: { username: string | null; display_name: string | null } | null;
  } | null;
}

interface BookmarkedCreator {
  id: string;
  creator: {
    id: string;
    username: string | null;
    display_name: string | null;
    bio: string | null;
    monthly_price: number | null;
  } | null;
}

const CustomerSaved = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'posts' | 'creators'>('posts');
  const [removingPostId, setRemovingPostId] = useState<string | null>(null);
  const [removingCreatorId, setRemovingCreatorId] = useState<string | null>(null);
  const savedDetailed = usePaginatedQuery(
    api.posts.queries.listSavedDetailedPage,
    user ? {} : 'skip',
    { initialNumItems: 25 },
  );
  const bookmarkDetailed = useQuery(api.bookmarks.mutations.listCreatorBookmarksDetailed, user ? {} : 'skip');
  const toggleSavedPost = useMutation(api.bookmarks.mutations.toggleSavedPost);
  const toggleCreatorBookmark = useMutation(api.bookmarks.mutations.toggleCreatorBookmark);

  const loading =
    user
      ? savedDetailed.status === 'LoadingFirstPage' || bookmarkDetailed === undefined
      : false;

  const posts: SavedPost[] = useMemo(
    () =>
      savedDetailed.results.map((row) => ({
        id: row.savedId,
        created_at: new Date(row.savedAt).toISOString(),
        post: {
          id: row.post._id,
          title: row.post.title,
          content: row.post.content ?? null,
          is_premium: row.post.isPremium,
          creator: {
            username: row.creator.username,
            display_name: row.creator.displayName ?? null,
          },
        },
      })),
    [savedDetailed.results],
  );

  const creators: BookmarkedCreator[] = useMemo(
    () =>
      (bookmarkDetailed ?? []).map((row) => ({
        id: row.bookmarkId,
        creator: {
          id: row.creator._id,
          username: row.creator.username,
          display_name: row.creator.displayName ?? null,
          bio: row.creator.bio ?? null,
          monthly_price: row.creator.monthlyPriceCents != null ? row.creator.monthlyPriceCents / 100 : null,
        },
      })),
    [bookmarkDetailed],
  );

  const removePost = async (row: SavedPost) => {
    if (!row.post || removingPostId) return;
    setRemovingPostId(row.id);
    try {
      await toggleSavedPost({ postId: row.post.id as Id<'posts'> });
      toast.success('Removed from saved');
    } catch {
      toast.error('Could not remove this post');
    } finally {
      setRemovingPostId(null);
    }
  };

  const removeCreator = async (row: BookmarkedCreator) => {
    if (!row.creator || removingCreatorId) return;
    setRemovingCreatorId(row.id);
    try {
      await toggleCreatorBookmark({ creatorId: row.creator.id as Id<'creators'> });
      toast.success('Bookmark removed');
    } catch {
      toast.error('Could not remove this bookmark');
    } finally {
      setRemovingCreatorId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="member">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Saved</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Your bookmarked posts and creators
        </p>
      </header>

      <div className={`${segmentedTrackClassName} mb-6`} role="tablist" aria-label="Saved library">
        {[
          { key: 'posts' as const, label: 'Saved Posts', count: posts.length },
          { key: 'creators' as const, label: 'Bookmarked Creators', count: creators.length },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={segmentedItemClassName(tab === t.key)}
          >
            {t.label} ({t.count}
            {t.key === 'posts' && savedDetailed.status === 'CanLoadMore' ? '+' : ''})
          </button>
        ))}
      </div>

      {tab === 'posts' ? (
        posts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-ui font-semibold text-foreground mb-2">Nothing saved yet</h3>
            <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
              Tap Save on any pick in your feed to keep it here.
            </p>
            <Button className="min-h-11" asChild>
              <Link to="/dashboard">Go to Feed</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((row) => {
              const post = row.post!;
              const name = post.creator?.display_name || post.creator?.username || 'Creator';
              const locked = post.is_premium && !post.content;
              return (
                <article
                  key={row.id}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
                >
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-caption font-bold text-primary">{name[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-ui font-medium text-foreground">{name}</span>
                    <span className="text-support text-muted-foreground">
                      Saved {format(new Date(row.created_at), 'MMM d')}
                    </span>
                    {post.is_premium ? (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-support font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" /> {locked ? 'Locked' : 'Premium'}
                      </span>
                    ) : (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-support font-medium text-muted-foreground">
                        <Globe className="h-3 w-3" /> Free
                      </span>
                    )}
                  </div>
                  <h3 className="text-ui font-semibold text-foreground mb-1">{post.title}</h3>
                  <p className="text-support text-muted-foreground line-clamp-2 mb-3">
                    {post.content ?? (locked ? 'Subscribe to unlock this content.' : 'No preview available.')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.creator?.username && (
                      <Button variant="outline" className="min-h-11" asChild>
                        <Link to={`/${post.creator.username}`}>View creator</Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 gap-1.5 text-destructive hover:text-destructive"
                      disabled={removingPostId === row.id}
                      onClick={() => void removePost(row)}
                    >
                      {removingPostId === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })}
            {(savedDetailed.status === 'CanLoadMore' || savedDetailed.status === 'LoadingMore') && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={savedDetailed.status === 'LoadingMore'}
                  onClick={() => savedDetailed.loadMore(25)}
                >
                  {savedDetailed.status === 'LoadingMore' ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )
      ) : creators.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No bookmarked creators</h3>
          <p className="text-support text-muted-foreground mb-5 max-w-sm mx-auto">
            Bookmark creators from Discover to follow them here.
          </p>
          <Button className="min-h-11" asChild>
            <Link to="/dashboard/discover">Discover Creators</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {creators.map((row) => {
            const c = row.creator!;
            const name = c.display_name || c.username || 'Creator';
            return (
              <div
                key={row.id}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ui font-semibold text-foreground truncate">{name}</p>
                    {c.username && (
                      <p className="text-support text-muted-foreground truncate">@{c.username}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-11 min-w-11 text-primary hover:text-destructive"
                    disabled={removingCreatorId === row.id}
                    onClick={() => void removeCreator(row)}
                    aria-label={`Remove ${name} from bookmarks`}
                  >
                    {removingCreatorId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className="h-4 w-4 fill-current" />
                    )}
                  </Button>
                </div>
                <p className="text-support text-muted-foreground mb-3 line-clamp-2">
                  {c.bio || 'No bio yet.'}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ui font-bold text-primary">
                    ${Number(c.monthly_price ?? 0).toFixed(2)}/mo
                  </span>
                  {c.username && (
                    <Button className="min-h-11" asChild>
                      <Link to={`/${c.username}`}>View Profile</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerSaved;
