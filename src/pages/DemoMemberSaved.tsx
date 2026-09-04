import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Bookmark, Heart, Trash2, Lock, Globe, Crown } from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore } from '@/components/demo/demoMemberStore';
import CancelSubButton from '@/components/demo/CancelSubButton';

const DemoMemberSaved = () => {
  const store = useDemoMemberStore();
  const { state } = store;
  const [tab, setTab] = useState<'posts' | 'creators'>('posts');

  const savedPosts = state.savedPostIds
    .map(id => state.posts.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const bookmarked = state.bookmarkedCreatorIds
    .map(id => store.creatorById(id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <DemoMemberShell title="Saved" subtitle="Your bookmarked posts and creators">
      <div className="flex gap-1 mb-6">
        {[
          { key: 'posts' as const, label: 'Saved Posts', count: savedPosts.length },
          { key: 'creators' as const, label: 'Bookmarked Creators', count: bookmarked.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'posts' ? (
        savedPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing saved yet — tap Save on any post in your feed.
          </div>
        ) : (
          <div className="space-y-3">
            {savedPosts.map(post => {
              const creator = store.creatorById(post.creatorId);
              const liked = state.likedPostIds.includes(post.id);
              const locked = post.isPremium && !store.isSubscribed(post.creatorId);
              return (
                <article key={post.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{creator?.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium">{creator?.name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), 'MMM d')}</span>
                    <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      post.isPremium ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {post.isPremium ? <><Lock className="h-2.5 w-2.5" /> Premium</> : <><Globe className="h-2.5 w-2.5" /> Free</>}
                    </span>
                  </div>
                  <h2 className="font-semibold text-sm mb-1">{post.title}</h2>
                  <p className={`text-xs text-muted-foreground line-clamp-2 mb-3 ${locked ? 'blur-[3px] select-none' : ''}`}>
                    {locked ? post.preview : post.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => store.toggleLike(post.id)} className={`flex items-center gap-1 text-xs transition-colors hover:text-primary ${liked ? 'text-primary' : 'text-muted-foreground'}`}>
                      <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} /> {post.likes}
                    </button>
                    <button onClick={() => { store.toggleSave(post.id); toast.info('Removed from saved'); }} className="flex items-center gap-1 py-2 -my-2 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : bookmarked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No bookmarked creators — bookmark them from Discover.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bookmarked.map(c => {
            const subscribed = store.isSubscribed(c.id);
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{c.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">@{c.username}</p>
                  </div>
                  <button onClick={() => { store.toggleBookmark(c.id); toast.info('Removed from bookmarks'); }} aria-label="Remove bookmark" className="p-2 -m-2 text-primary hover:text-destructive">
                    <Bookmark className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{c.bio}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">${c.price}/mo</span>
                  {subscribed ? (
                    <CancelSubButton creatorId={c.id} />
                  ) : (
                    <Button size="sm" className="h-7 text-xs" onClick={() => { store.subscribe(c.id); toast.success(`Subscribed to ${c.name}`); }}>
                      <Crown className="mr-1 h-3 w-3" /> Subscribe
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DemoMemberShell>
  );
};

export default DemoMemberSaved;
