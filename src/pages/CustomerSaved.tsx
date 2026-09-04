import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, Trash2, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [creators, setCreators] = useState<BookmarkedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [savedRes, bookmarkRes] = await Promise.all([
      supabase
        .from('saved_posts')
        .select('id, created_at, post:posts(id, title, content, is_premium, creator:creators(username, display_name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('creator_bookmarks')
        .select('id, creator:creators(id, username, display_name, bio, monthly_price)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    setPosts(((savedRes.data as SavedPost[] | null) ?? []).filter((r) => r.post));
    setCreators(((bookmarkRes.data as BookmarkedCreator[] | null) ?? []).filter((r) => r.creator));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const removePost = async (id: string) => {
    const previous = posts;
    setPosts((rows) => rows.filter((r) => r.id !== id));
    const { error } = await supabase.from('saved_posts').delete().eq('id', id);
    if (error) {
      setPosts(previous);
      toast.error('Could not remove this post');
    } else {
      toast.success('Removed from saved');
    }
  };

  const removeCreator = async (id: string) => {
    const previous = creators;
    setCreators((rows) => rows.filter((r) => r.id !== id));
    const { error } = await supabase.from('creator_bookmarks').delete().eq('id', id);
    if (error) {
      setCreators(previous);
      toast.error('Could not remove this bookmark');
    } else {
      toast.success('Bookmark removed');
    }
  };

  return (
    <DashboardLayout type="member">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Saved</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your bookmarked posts and creators</p>
      </div>

      <div className="flex gap-1 mb-6">
        {[
          { key: 'posts' as const, label: 'Saved Posts', count: posts.length },
          { key: 'creators' as const, label: 'Bookmarked Creators', count: creators.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {t.label} ({loading ? '—' : t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : tab === 'posts' ? (
        posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">Nothing saved yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Tap Save on any pick in your feed to keep it here.</p>
            <Link to="/dashboard"><Button size="sm">Go to Feed</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((row) => {
              const post = row.post!;
              const name = post.creator?.display_name || post.creator?.username || 'Creator';
              return (
                <article key={row.id} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{name[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      Saved {format(new Date(row.created_at), 'MMM d')}
                    </span>
                    {post.is_premium ? (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Lock className="h-2.5 w-2.5" /> Premium
                      </span>
                    ) : (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Globe className="h-2.5 w-2.5" /> Free
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {post.content ?? 'Subscribe to unlock this content.'}
                  </p>
                  <div className="flex items-center gap-3">
                    {post.creator?.username && (
                      <Link
                        to={`/${post.creator.username}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        View creator
                      </Link>
                    )}
                    <button
                      onClick={() => removePost(row.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : creators.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No bookmarked creators</h3>
          <p className="text-xs text-muted-foreground mb-4">Bookmark creators from Discover to follow them here.</p>
          <Link to="/dashboard/discover"><Button size="sm">Discover Creators</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {creators.map((row) => {
            const c = row.creator!;
            const name = c.display_name || c.username || 'Creator';
            return (
              <div key={row.id} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{name}</p>
                    {c.username && <p className="text-xs text-muted-foreground truncate">@{c.username}</p>}
                  </div>
                  <button
                    onClick={() => removeCreator(row.id)}
                    aria-label={`Remove ${name} from bookmarks`}
                    className="text-primary hover:text-destructive transition-colors"
                  >
                    <Bookmark className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.bio || 'No bio yet.'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    ${Number(c.monthly_price ?? 0).toFixed(2)}/mo
                  </span>
                  {c.username && (
                    <Link to={`/${c.username}`}>
                      <Button size="sm" className="h-7 text-xs">View Profile</Button>
                    </Link>
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
