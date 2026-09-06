import { parsePickOdds as parseOdds, americanToDecimal, decimalToAmerican } from '@/lib/odds';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Crown, FileText, Loader2, Lock, Globe, Users, CreditCard,
  Bookmark, Star, ArrowRight, Copy, PlusCircle,
  Clock, Check, Flame, Trophy, XCircle, Minus,
} from 'lucide-react';
import { openCustomerPortal } from '@/lib/stripe';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  status: string;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    monthly_price: number | null;
  };
}

interface FeedPost {
  id: string;
  title: string;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  result: string;
  creator: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

function parsePick(content: string | null) {
  if (!content) return null;
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let notes = '';
  let notesStart = false;
  for (const line of lines) {
    if (line.trim() === '') { notesStart = true; continue; }
    if (notesStart) { notes += (notes ? '\n' : '') + line; continue; }
    const match = line.match(/^(Sport|Event|Type|Pick|Odds|Units):\s*(.+)/i);
    if (match) { data[match[1].toLowerCase()] = match[2].trim(); }
    else { notes += (notes ? '\n' : '') + line; }
  }
  return {
    sport: data.sport || null, event: data.event || null, type: data.type || null,
    pick: data.pick || null, odds: data.odds || null, units: data.units || null,
    notes: notes.trim() || null,
  };
}


const resultStyles = {
  pending: { className: 'bg-muted text-muted-foreground', icon: Clock, label: 'Pending' },
  won: { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Trophy, label: 'Won' },
  lost: { className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle, label: 'Lost' },
  push: { className: 'bg-muted text-muted-foreground', icon: Minus, label: 'Push' },
};

interface TrackForm {
  pick_event: string;
  sport: string;
  eu_odds: string;
  us_odds: string;
  units_risked: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const feedRaw = useQuery(api.posts.queries.memberFeed, user ? {} : 'skip');
  const subsRaw = useQuery(api.subscriptions.mutations.mySubscriptionsDetailed, user ? {} : 'skip');
  const savedRaw = useQuery(api.bookmarks.mutations.listSavedPosts, user ? {} : 'skip');
  const toggleSavedPost = useMutation(api.bookmarks.mutations.toggleSavedPost);
  const upsertPick = useMutation(api.picks.mutations.upsert);

  const [visibleCount, setVisibleCount] = useState(10);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackSaving, setTrackSaving] = useState(false);
  const [feedTab, setFeedTab] = useState('following');
  const [optimisticSaved, setOptimisticSaved] = useState<Set<string> | null>(null);

  const [trackForm, setTrackForm] = useState<TrackForm>({
    pick_event: '', sport: '', eu_odds: '', us_odds: '', units_risked: '1',
  });

  const loading = user ? feedRaw === undefined || subsRaw === undefined || savedRaw === undefined : false;

  const subs: Subscription[] = useMemo(
    () =>
      (subsRaw ?? []).map((s) => ({
        id: s._id,
        status: s.status,
        created_at: new Date(s.createdAt).toISOString(),
        creator: {
          id: s.creator._id,
          username: s.creator.username,
          display_name: s.creator.displayName ?? null,
          avatar_url: s.creator.avatarUrl ?? null,
          monthly_price:
            s.creator.monthlyPriceCents != null ? s.creator.monthlyPriceCents / 100 : null,
        },
      })),
    [subsRaw],
  );

  const posts: FeedPost[] = useMemo(
    () =>
      (feedRaw ?? []).map((p) => ({
        id: p._id,
        title: p.title,
        content: p.content,
        is_premium: p.isPremium,
        created_at: new Date(p.createdAt).toISOString(),
        result: p.result ?? 'pending',
        creator: {
          username: p.creator.username,
          display_name: p.creator.displayName ?? null,
          avatar_url: p.creator.avatarUrl ?? null,
        },
      })),
    [feedRaw],
  );

  const savedIds = useMemo(() => {
    const base = new Set((savedRaw ?? []).map((r) => r.postId as string));
    return optimisticSaved ?? base;
  }, [savedRaw, optimisticSaved]);

  const toggleSave = async (postId: string) => {
    if (!user) return;
    const wasSaved = savedIds.has(postId);
    setOptimisticSaved((prev) => {
      const next = new Set(prev ?? savedIds);
      if (wasSaved) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      await toggleSavedPost({ postId: postId as Id<'posts'> });
      setOptimisticSaved(null);
      toast.success(wasSaved ? 'Removed from saved' : 'Saved to your library');
    } catch {
      setOptimisticSaved(null);
      toast.error('Could not update your saved picks');
    }
  };

  const activeSubs = subs.filter(s => s.status === 'active');

  const feedPosts = useMemo(() => {
    if (feedTab === 'following') return posts;
    if (feedTab === 'trending') {
      return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...posts].sort(() => Math.random() - 0.5);
  }, [posts, feedTab]);

  const visiblePosts = feedPosts.slice(0, visibleCount);

  const wonPicks = posts.filter(p => p.result === 'won').length;
  const settledPicks = posts.filter(p => p.result !== 'pending').length;
  const winRate = settledPicks > 0 ? Math.round((wonPicks / settledPicks) * 100) : 0;

  const openTracker = (post: FeedPost) => {
    const pick = parsePick(post.content);
    const odds = pick ? parseOdds(pick.odds) : { us: null, eu: null };
    setTrackForm({
      pick_event: pick?.pick || post.title,
      sport: pick?.sport || '',
      eu_odds: odds.eu || '',
      us_odds: odds.us || '',
      units_risked: pick?.units?.replace(/[^0-9.]/g, '') || '1',
    });
    setTrackOpen(true);
  };

  const handleTrackEuChange = (val: string) => {
    const eu = parseFloat(val);
    setTrackForm(f => ({ ...f, eu_odds: val, us_odds: !isNaN(eu) && eu > 1 ? decimalToAmerican(eu) : f.us_odds }));
  };
  const handleTrackUsChange = (val: string) => {
    const eu = americanToDecimal(val, 3);
    setTrackForm(f => ({ ...f, us_odds: val, eu_odds: eu !== null ? String(eu) : f.eu_odds }));
  };

  const saveToTracker = async () => {
    if (!user) return;
    setTrackSaving(true);
    try {
      const euVal = trackForm.eu_odds ? parseFloat(trackForm.eu_odds) : undefined;
      const units = parseFloat(trackForm.units_risked) || 1;
      await upsertPick({
        date: new Date().toISOString().split('T')[0],
        pickEvent: trackForm.pick_event,
        sport: trackForm.sport || 'Other',
        euOdds: euVal,
        usOdds: trackForm.us_odds || undefined,
        unitsRisked: units,
        result: 'pending',
        unitsWonLost: 0,
      });
      toast.success('Added to My Results tracker');
      setTrackOpen(false);
    } catch {
      toast.error('Failed to add to tracker');
    } finally {
      setTrackSaving(false);
    }
  };

  const copyPick = (post: FeedPost) => {
    const pick = parsePick(post.content);
    const text = pick
      ? `${post.title}${pick.pick ? ` | ${pick.pick}` : ''}${pick.odds ? ` | ${pick.odds}` : ''}`
      : post.title;
    navigator.clipboard.writeText(text);
    toast.success('Pick copied to clipboard');
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const renderPost = (post: FeedPost) => {
    const pick = parsePick(post.content);
    const odds = pick ? parseOdds(pick.odds) : { us: null, eu: null };
    const result = (post.result || 'pending') as keyof typeof resultStyles;
    const rs = resultStyles[result] || resultStyles.pending;
    const ResultIcon = rs.icon;

    const creatorPosts = posts.filter(p => p.creator.username === post.creator.username);
    let streak = 0;
    for (const cp of creatorPosts) {
      if (cp.result === 'won') streak++;
      else if (cp.result === 'lost') break;
    }

    return (
      <article key={post.id} className="rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-primary/20">
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          {post.creator.avatar_url ? (
            <img src={post.creator.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {(post.creator.display_name?.[0] ?? post.creator.username[0]).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link to={`/${post.creator.username}`} className="text-sm font-semibold truncate hover:underline">
                {post.creator.display_name ?? post.creator.username}
              </Link>
              {streak >= 3 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                  <Flame className="h-3 w-3" /> {streak}W
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          {post.is_premium ? (
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 shrink-0">
              <Lock className="h-2.5 w-2.5 mr-0.5" /> PREMIUM
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground shrink-0">
              <Globe className="h-2.5 w-2.5 mr-0.5" /> FREE
            </Badge>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {pick && (pick.sport || pick.event) && (
            <div className="flex items-center gap-2 mb-3">
              {pick.sport && (
                <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/15">
                  {pick.sport}
                </Badge>
              )}
              {pick.event && <span className="text-xs text-muted-foreground truncate">{pick.event}</span>}
            </div>
          )}

          <h3 className="text-lg sm:text-xl font-bold leading-tight mb-3">
            {pick?.pick || post.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(odds.us || odds.eu) && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Odds:</span>
                {odds.us && <span className="text-sm font-bold">{odds.us}</span>}
                {odds.us && odds.eu && <span className="text-xs text-muted-foreground">/</span>}
                {odds.eu && <span className="text-sm font-semibold text-muted-foreground">{odds.eu}</span>}
              </div>
            )}
            {pick?.units && (
              <div className="inline-flex items-center rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-sm font-bold">{pick.units}</span>
              </div>
            )}
            <Badge variant="outline" className={`text-[10px] font-semibold uppercase ${rs.className}`}>
              <ResultIcon className="h-2.5 w-2.5 mr-0.5" />
              {rs.label}
            </Badge>
          </div>

          {pick?.pick && post.title !== pick.pick && <p className="text-sm font-medium mb-2">{post.title}</p>}

          {pick?.notes && (
            <div className="rounded-lg bg-muted/30 p-3 mb-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{pick.notes}</p>
            </div>
          )}

          {!pick && post.content && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">{post.content}</p>
          )}

          <div className="flex items-center gap-1 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs ${savedIds.has(post.id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => toggleSave(post.id)}
            >
              <Bookmark className={`h-3.5 w-3.5 mr-1 ${savedIds.has(post.id) ? 'fill-current' : ''}`} />
              {savedIds.has(post.id) ? 'Saved' : 'Save'}
            </Button>

            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => openTracker(post)}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Track
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => copyPick(post)}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <DashboardLayout type="member">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {posts.length > 0 ? `${posts.length} picks from your creators` : 'No picks yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSubs.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => openCustomerPortal()}>
              <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Billing
            </Button>
          )}
          <Link to="/dashboard/discover">
            <Button variant="outline" size="sm">
              <Crown className="mr-1.5 h-3.5 w-3.5" /> Browse Creators
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Subs', value: String(activeSubs.length), icon: Crown, color: 'text-primary' },
          { label: 'Picks Available', value: String(posts.length), icon: FileText, color: 'text-primary' },
          { label: 'Wins', value: String(wonPicks), icon: Trophy, color: 'text-emerald-500' },
          { label: 'Win Rate', value: settledPicks > 0 ? `${winRate}%` : '—', icon: Star, color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <Tabs value={feedTab} onValueChange={setFeedTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-3 max-w-sm">
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="foryou">For You</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
      </Tabs>

      {visiblePosts.length > 0 ? (
        <div className="space-y-4">
          {visiblePosts.map(renderPost)}

          {feedPosts.length > visibleCount && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + 10)}>
                Show more picks <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : activeSubs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No picks yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">
            Subscribe to creators to start receiving premium picks in your feed.
          </p>
          <Link to="/creators"><Button size="sm"><Crown className="mr-1.5 h-4 w-4" /> Browse Creators</Button></Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No picks yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">
            Your creators haven't posted any picks yet. Check back soon!
          </p>
          <Link to="/creators"><Button variant="outline" size="sm">Browse More Creators</Button></Link>
        </div>
      )}

      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" /> Add to Tracker
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Pick</p>
              <p className="text-sm font-semibold">{trackForm.pick_event}</p>
              {trackForm.sport && (
                <Badge variant="outline" className="mt-1 text-[9px] bg-primary/5 text-primary border-primary/15">{trackForm.sport}</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">US Odds</label>
                <Input placeholder="+150" value={trackForm.us_odds} onChange={e => handleTrackUsChange(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">EU Odds</label>
                <Input type="number" step="0.01" min="1.01" placeholder="2.50" value={trackForm.eu_odds} onChange={e => handleTrackEuChange(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Units Placed</label>
              <Input type="number" step="0.5" min="0.5" placeholder="1" value={trackForm.units_risked}
                onChange={e => setTrackForm(f => ({ ...f, units_risked: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTrackOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveToTracker} disabled={trackSaving}>
              {trackSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Save to Tracker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
