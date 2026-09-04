import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Crown, FileText, Lock, Globe, ArrowRight, Zap, Heart, Bookmark,
  TrendingUp, Star, Eye, Plus,
} from 'lucide-react';
import DemoMemberShell from '@/components/demo/DemoMemberShell';
import { useDemoMemberStore, usToDecimal, DemoFeedPost } from '@/components/demo/demoMemberStore';

const DemoMemberDashboard = () => {
  const store = useDemoMemberStore();
  const { state, metrics } = store;
  const [sort, setSort] = useState<'newest' | 'trending'>('newest');
  const [trackTarget, setTrackTarget] = useState<DemoFeedPost | null>(null);
  const [trackUnits, setTrackUnits] = useState('1');
  const [trackOdds, setTrackOdds] = useState('');

  const feed = useMemo(() => {
    const posts = [...state.posts];
    return sort === 'newest'
      ? posts.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      : posts.sort((a, b) => b.likes + b.views / 10 - (a.likes + a.views / 10));
  }, [state.posts, sort]);

  const todaysPicks = useMemo(
    () => state.posts.filter(p => Date.now() - +new Date(p.createdAt) < 86400000 && p.result === 'pending'),
    [state.posts],
  );

  const subscribedCreators = state.creators.filter(c => state.subscribedCreatorIds.includes(c.id));

  const openTrack = (post: DemoFeedPost) => {
    setTrackTarget(post);
    setTrackUnits(String(post.units || state.settings.defaultUnitSize));
    setTrackOdds(post.usOdds);
  };

  const confirmTrack = () => {
    if (!trackTarget) return;
    store.trackPick({
      postId: trackTarget.id,
      creatorId: trackTarget.creatorId,
      event: trackTarget.event,
      sport: trackTarget.sport,
      usOdds: trackOdds,
      units: Number(trackUnits) || 1,
    });
    toast.success('Added to My Results');
    setTrackTarget(null);
  };

  return (
    <DemoMemberShell title={`Welcome back, ${state.settings.displayName.split(' ')[0]}`} subtitle="Here's what's new from your creators">
      {todaysPicks.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{todaysPicks.length} new {todaysPicks.length === 1 ? 'play' : 'plays'} available today</p>
            <p className="text-xs text-muted-foreground">Fresh from your creators — track them before the lines move</p>
          </div>
          <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 shrink-0">NEW</Badge>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Subs', value: metrics.activeSubs, icon: Crown, color: 'text-primary' },
          { label: 'Posts Available', value: metrics.availablePosts, icon: FileText, color: 'text-accent' },
          { label: 'Plays Tracked', value: metrics.totalPicks, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Win Rate', value: `${metrics.winRate}%`, icon: Star, color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Today's picks */}
      {todaysPicks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" /> Today's Picks
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {todaysPicks.map(pick => {
              const creator = store.creatorById(pick.creatorId);
              const locked = pick.isPremium && !store.isSubscribed(pick.creatorId);
              return (
                <div key={pick.id} className="rounded-xl border border-primary/20 bg-card p-5 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary">{creator?.name[0]}</span>
                    </div>
                    <span className="text-xs font-medium">{creator?.name}</span>
                    <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/20 ml-auto">HOT</Badge>
                  </div>
                  <h3 className={`font-semibold text-sm mb-2 ${locked ? 'blur-[3px] select-none' : ''}`}>{pick.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{format(new Date(pick.createdAt), 'h:mm a')}</span>
                    <span>{pick.sport} · {pick.units}u @ {pick.usOdds}</span>
                  </div>
                  {locked ? (
                    <Button size="sm" className="h-7 text-xs mt-3" onClick={() => store.subscribe(pick.creatorId)}>
                      <Lock className="mr-1 h-3 w-3" /> Subscribe to unlock
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs mt-3" onClick={() => openTrack(pick)}>
                      <Plus className="mr-1 h-3 w-3" /> Track
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your creators */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Creators</h2>
          <Link to="/demo/member/subscriptions-billing" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {subscribedCreators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">You aren't subscribed to any creators yet.</p>
            <Button size="sm" asChild><Link to="/demo/member/discover">Discover creators</Link></Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {subscribedCreators.map(c => {
              const last = state.posts.filter(p => p.creatorId === c.id)[0];
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{c.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ${c.price}/mo{last ? ` · ${formatDistanceToNow(new Date(last.createdAt), { addSuffix: true })}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Feed</h2>
          <div className="flex gap-1">
            {(['newest', 'trending'] as const).map(f => (
              <button
                key={f}
                onClick={() => setSort(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                  sort === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{metrics.lockedPosts} locked</span>
      </div>

      <div className="space-y-3">
        {feed.map(post => {
          const creator = store.creatorById(post.creatorId);
          const locked = post.isPremium && !store.isSubscribed(post.creatorId);
          const saved = state.savedPostIds.includes(post.id);
          const liked = state.likedPostIds.includes(post.id);
          const dec = usToDecimal(post.usOdds);
          return (
            <article key={post.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{creator?.name[0]}</span>
                </div>
                <span className="text-sm font-medium">{creator?.name}</span>
                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  post.isPremium ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {post.isPremium ? <><Lock className="h-2.5 w-2.5" /> Premium</> : <><Globe className="h-2.5 w-2.5" /> Free</>}
                </span>
              </div>

              <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
              <p className={`text-xs text-muted-foreground mb-3 ${locked ? 'blur-[3px] select-none' : ''}`}>
                {locked ? post.preview : post.content}
              </p>

              {post.usOdds && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-[9px]">{post.sport}</Badge>
                  <Badge variant="outline" className="text-[9px]">{post.event}</Badge>
                  <Badge variant="outline" className="text-[9px]">{post.usOdds} · {dec?.toFixed(2)}</Badge>
                  <Badge variant="outline" className="text-[9px]">{post.units}u</Badge>
                  <Badge variant="outline" className={`text-[9px] ${
                    post.result === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : post.result === 'lost' ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-muted text-muted-foreground'
                  }`}>{post.result.toUpperCase()}</Badge>
                </div>
              )}

              {locked ? (
                <Button size="sm" className="h-7 text-xs" onClick={() => { store.subscribe(post.creatorId); toast.success(`Subscribed to ${creator?.name}`); }}>
                  <Crown className="mr-1 h-3 w-3" /> Subscribe ${creator?.price}/mo to unlock
                </Button>
              ) : (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button onClick={() => store.toggleLike(post.id)} aria-pressed={liked} aria-label={liked ? 'Unlike post' : 'Like post'} className={`flex items-center gap-1 py-2 -my-2 transition-colors hover:text-primary ${liked ? 'text-primary' : ''}`}>
                    <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} /> {post.likes}
                  </button>
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.views}</span>
                  <button onClick={() => store.toggleSave(post.id)} aria-pressed={saved} className={`flex items-center gap-1 py-2 -my-2 transition-colors hover:text-primary ${saved ? 'text-primary' : ''}`}>
                    <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
                  </button>
                  {post.usOdds && (
                    <button onClick={() => openTrack(post)} className="flex items-center gap-1 py-2 -my-2 transition-colors hover:text-primary">
                      <Plus className="h-3.5 w-3.5" /> Track
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Dialog open={!!trackTarget} onOpenChange={o => !o && setTrackTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add to My Results</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{trackTarget?.event} · {trackTarget?.sport}</p>
            <div>
              <Label className="text-xs">US odds</Label>
              <Input value={trackOdds} onChange={e => setTrackOdds(e.target.value)} className="mt-1" placeholder="-110" />
              <p className="text-[10px] text-muted-foreground mt-1">EU odds: {usToDecimal(trackOdds)?.toFixed(2) ?? '—'}</p>
            </div>
            <div>
              <Label className="text-xs">Units</Label>
              <Input type="number" min="0.5" step="0.5" value={trackUnits} onChange={e => setTrackUnits(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTrackTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={confirmTrack}>Track pick</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoMemberShell>
  );
};

export default DemoMemberDashboard;
