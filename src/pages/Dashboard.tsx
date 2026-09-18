import { parsePickOdds as parseOdds, americanToDecimal, decimalToAmerican } from '@/lib/odds';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  BadgeCheck,
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  MessageCircle,
  PlusCircle,
  Share2,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Seo } from '@/components/Seo';
import { copyToClipboard } from '@/lib/clipboard';
import { trackPostView } from '@/lib/analytics';
import { sportVisual } from '@/lib/sportVisual';
import {
  isMemberHomeDemoId,
  MEMBER_HOME_DEMO_PICKS,
  MEMBER_HOME_SPORT_FILTERS,
  shouldUseMemberHomeDemo,
  type MemberHomeSportFilter,
} from '@/lib/memberHomeDemo';
import { cn } from '@/lib/utils';

interface FeedPost {
  id: string;
  title: string;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  result: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  isDemo?: boolean;
  likes?: number;
  comments?: number;
  startsPrefix?: string;
  startsValue?: string;
}

function parsePick(content: string | null) {
  if (!content) return null;
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let notes = '';
  let notesStart = false;
  for (const line of lines) {
    if (line.trim() === '') {
      notesStart = true;
      continue;
    }
    if (notesStart) {
      notes += (notes ? '\n' : '') + line;
      continue;
    }
    const match = line.match(/^(Sport|Event|Type|Pick|Odds|Units):\s*(.+)/i);
    if (match) {
      data[match[1]!.toLowerCase()] = match[2]!.trim();
    } else {
      notes += (notes ? '\n' : '') + line;
    }
  }
  return {
    sport: data.sport || null,
    event: data.event || null,
    type: data.type || null,
    pick: data.pick || null,
    odds: data.odds || null,
    units: data.units || null,
    notes: notes.trim() || null,
  };
}

interface TrackForm {
  pick_event: string;
  sport: string;
  eu_odds: string;
  us_odds: string;
  units_risked: string;
}

function firstNameFrom(display: string | null | undefined, email: string | null | undefined): string {
  const raw = display?.trim() || email?.split('@')[0] || 'there';
  return raw.split(/\s+/)[0] || 'there';
}

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const feedRaw = useQuery(api.posts.queries.memberFeed, user ? {} : 'skip');
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const savedRaw = useQuery(api.bookmarks.mutations.listSavedPosts, user ? {} : 'skip');
  const toggleSavedPost = useMutation(api.bookmarks.mutations.toggleSavedPost);
  const upsertPick = useMutation(api.picks.mutations.upsert);

  const [sportFilter, setSportFilter] = useState<MemberHomeSportFilter>('All');
  const [visibleCount, setVisibleCount] = useState(10);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackSaving, setTrackSaving] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState<Set<string> | null>(null);
  const [trackForm, setTrackForm] = useState<TrackForm>({
    pick_event: '',
    sport: '',
    eu_odds: '',
    us_odds: '',
    units_risked: '1',
  });

  const loading = user ? feedRaw === undefined || savedRaw === undefined : false;

  const livePosts: FeedPost[] = useMemo(
    () =>
      (feedRaw ?? []).map((p) => ({
        id: p._id,
        title: p.title,
        content: p.content,
        is_premium: p.isPremium,
        created_at: new Date(p.createdAt).toISOString(),
        result: p.result ?? 'pending',
        creator: {
          id: p.creator._id,
          username: p.creator.username,
          display_name: p.creator.displayName ?? null,
          avatar_url: p.creator.avatarUrl ?? null,
        },
      })),
    [feedRaw],
  );

  const useDemo = shouldUseMemberHomeDemo({
    feedCount: livePosts.length,
    forceDemo,
    disableDemo,
  });

  const posts: FeedPost[] = useMemo(() => {
    if (!useDemo) return livePosts;
    return MEMBER_HOME_DEMO_PICKS.map((d) => ({
      id: d.id,
      title: d.pick,
      content: [
        `Sport: ${d.sport}`,
        `Event: ${d.event}`,
        `Pick: ${d.pick}`,
        `Odds: ${d.oddsDecimal} (EU)`,
        '',
        d.analysis,
      ].join('\n'),
      is_premium: true,
      created_at: new Date(d.createdAtMs).toISOString(),
      result: 'pending',
      creator: {
        id: d.creator.id,
        username: d.creator.username,
        display_name: d.creator.displayName,
        avatar_url: d.creator.avatarUrl,
      },
      isDemo: true,
      likes: d.likes,
      comments: d.comments,
      startsPrefix: d.startsPrefix,
      startsValue: d.startsValue,
    }));
  }, [useDemo, livePosts]);

  const savedIds = useMemo(() => {
    const base = new Set((savedRaw ?? []).map((r) => r.postId as string));
    return optimisticSaved ?? base;
  }, [savedRaw, optimisticSaved]);

  const filteredPosts = useMemo(() => {
    if (sportFilter === 'All') return posts;
    return posts.filter((p) => {
      const sport = parsePick(p.content)?.sport ?? '';
      return sport.toLowerCase().includes(sportFilter.toLowerCase());
    });
  }, [posts, sportFilter]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const trackedViews = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const post of visiblePosts) {
      if (post.isDemo || isMemberHomeDemoId(post.id)) continue;
      if (trackedViews.current.has(post.id)) continue;
      trackedViews.current.add(post.id);
      void trackPostView(post.id, post.creator.id);
    }
  }, [visiblePosts]);

  const greetingName = firstNameFrom(me?.fullName ?? me?.name, user?.email ?? null);
  const todayLabel = format(new Date(), 'EEE, MMM d, yyyy');

  const toggleSave = async (postId: string) => {
    if (!user) return;
    if (isMemberHomeDemoId(postId)) {
      toast.message('Sample preview', {
        description: 'Save real picks when you leave demo mode (?demo=0).',
      });
      return;
    }
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

  const openTracker = (post: FeedPost) => {
    if (post.isDemo || isMemberHomeDemoId(post.id)) {
      toast.message('Sample preview', {
        description: 'Tail real picks when you leave demo mode (?demo=0).',
      });
      return;
    }
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
    setTrackForm((f) => ({
      ...f,
      eu_odds: val,
      us_odds: !isNaN(eu) && eu > 1 ? decimalToAmerican(eu) : f.us_odds,
    }));
  };

  const handleTrackUsChange = (val: string) => {
    const eu = americanToDecimal(val, 3);
    setTrackForm((f) => ({
      ...f,
      us_odds: val,
      eu_odds: eu !== null ? String(eu) : f.eu_odds,
    }));
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
      toast.success('Added to My Bet Tracker');
      setTrackOpen(false);
    } catch {
      toast.error('Failed to add to tracker');
    } finally {
      setTrackSaving(false);
    }
  };

  const sharePick = async (post: FeedPost) => {
    const pick = parsePick(post.content);
    const text = pick
      ? `${post.creator.display_name ?? post.creator.username}: ${pick.pick || post.title}${
          pick.odds ? ` @ ${pick.odds}` : ''
        }`
      : post.title;
    const ok = await copyToClipboard(text);
    if (ok) toast.success('Pick copied to clipboard');
    else toast.error('Could not copy');
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <Seo title="Home — Prizelet" description="Your Prizelet member home feed." />
        <header className="mb-8">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-3 h-4 w-80" />
        </header>
        <div className="space-y-4" aria-busy="true" aria-label="Loading feed">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="member">
      <Seo
        title="Home — Prizelet"
        description="Latest picks from creators you subscribe to on Prizelet."
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Welcome back, {greetingName}!{' '}
            <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Latest picks from your subscribed creators.
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
          {todayLabel}
        </p>
      </header>

      {useDemo ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview feed for design review — not live picks. Add{' '}
            <code className="rounded bg-amber-500/20 px-1">?demo=0</code> to hide, or subscribe to
            creators for a real feed.
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {MEMBER_HOME_SPORT_FILTERS.map((sport) => {
          const active = sportFilter === sport;
          return (
            <button
              key={sport}
              type="button"
              onClick={() => {
                setSportFilter(sport);
                setVisibleCount(10);
              }}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {sport}
            </button>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-full border-slate-200 bg-white px-3 text-slate-600"
            >
              More
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {['MLB', 'NHL', 'Boxing', 'Golf'].map((sport) => (
              <DropdownMenuItem
                key={sport}
                onSelect={() => {
                  setSportFilter(sport);
                  setVisibleCount(10);
                }}
              >
                {sport}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {visiblePosts.length > 0 ? (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const pick = parsePick(post.content);
            const odds = pick ? parseOdds(pick.odds) : { us: null, eu: null };
            const visual = sportVisual(pick?.sport);
            const creatorName = post.creator.display_name ?? post.creator.username;
            const initial = creatorName.charAt(0).toUpperCase();
            const oddsLabel = odds.eu || odds.us || null;
            const liked = savedIds.has(post.id);
            const startsPrefix = post.startsPrefix ?? 'Starts';
            const startsValue = post.startsValue;

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {post.creator.avatar_url ? (
                    <img
                      src={post.creator.avatar_url}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {initial}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            to={post.isDemo ? '/dashboard/discover' : `/${post.creator.username}`}
                            className="truncate text-[15px] font-bold text-slate-900 hover:underline"
                          >
                            {creatorName}
                          </Link>
                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-label="Verified"
                          />
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNowStrict(new Date(post.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <span aria-hidden className="text-sm">
                              {visual.emoji}
                            </span>
                            {pick?.sport || 'Sports'}
                          </span>
                          {pick?.event ? (
                            <span className="text-[15px] font-bold text-slate-900">
                              {pick.event}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {startsValue ? (
                        <div className="hidden shrink-0 items-center gap-1.5 text-right sm:flex">
                          <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          <p className="text-xs font-medium text-slate-400">
                            {startsPrefix}{' '}
                            <span className="font-bold text-slate-700">{startsValue}</span>
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-sky-50 px-4 py-3 dark:bg-sky-950/30">
                      <p className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                        {pick?.pick || post.title}
                      </p>
                      {oddsLabel ? (
                        <span className="shrink-0 font-mono text-base font-bold text-slate-800 dark:text-slate-100">
                          {oddsLabel}
                        </span>
                      ) : null}
                    </div>

                    {pick?.notes ? (
                      <p className="mt-3 text-sm leading-relaxed text-slate-500">{pick.notes}</p>
                    ) : null}

                    {startsValue ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400 sm:hidden">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {startsPrefix}{' '}
                        <span className="font-bold text-slate-700">{startsValue}</span>
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800',
                            liked && 'text-primary',
                          )}
                          onClick={() => void toggleSave(post.id)}
                          aria-label={liked ? 'Unlike pick' : 'Like pick'}
                        >
                          <ThumbsUp className={cn('h-4 w-4', liked && 'fill-current')} />
                          <span className="tabular-nums text-xs font-semibold">
                            {post.likes ?? (liked ? 1 : 0)}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                          onClick={() =>
                            toast.message('Comments', {
                              description: 'Open Messages to chat with the creator.',
                            })
                          }
                          aria-label="Comments"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="tabular-nums text-xs font-semibold">
                            {post.comments ?? 0}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center justify-center rounded-lg px-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                          onClick={() => void sharePick(post)}
                          aria-label="Share pick"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          className="min-h-10 rounded-xl px-5 font-semibold"
                          onClick={() => openTracker(post)}
                        >
                          Tail Pick
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={cn(
                            'h-10 w-10 rounded-xl border-slate-200',
                            liked && 'border-primary/40 bg-primary/5 text-primary',
                          )}
                          onClick={() => void toggleSave(post.id)}
                          aria-label={liked ? 'Remove bookmark' : 'Bookmark pick'}
                        >
                          <Bookmark className={cn('h-4 w-4', liked && 'fill-current')} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredPosts.length > visibleCount ? (
            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={() => setVisibleCount((v) => v + 10)}
              >
                Show more picks
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-slate-900">No picks in this filter</h3>
          <p className="mx-auto mb-5 max-w-sm text-sm text-slate-500">
            Try another sport, or discover creators to fill your Home feed.
          </p>
          <Button asChild className="min-h-11 rounded-xl">
            <Link to="/dashboard/discover">Open Discover</Link>
          </Button>
        </div>
      )}

      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ui">
              <PlusCircle className="h-4 w-4 text-primary" /> Tail this pick
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-0.5 text-support text-muted-foreground">Pick</p>
              <p className="text-ui font-semibold text-foreground">{trackForm.pick_event}</p>
              {trackForm.sport ? (
                <Badge
                  variant="outline"
                  className="mt-1 border-border bg-muted text-caption text-muted-foreground"
                >
                  {trackForm.sport}
                </Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="track-us-odds" className="text-support text-muted-foreground">
                  US odds
                </Label>
                <Input
                  id="track-us-odds"
                  placeholder="+150"
                  value={trackForm.us_odds}
                  onChange={(e) => handleTrackUsChange(e.target.value)}
                  className="h-11 min-h-11 text-ui"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track-eu-odds" className="text-support text-muted-foreground">
                  EU odds
                </Label>
                <Input
                  id="track-eu-odds"
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="2.50"
                  value={trackForm.eu_odds}
                  onChange={(e) => handleTrackEuChange(e.target.value)}
                  className="h-11 min-h-11 text-ui"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-units" className="text-support text-muted-foreground">
                Units placed
              </Label>
              <Input
                id="track-units"
                type="number"
                step="0.5"
                min="0.5"
                placeholder="1"
                value={trackForm.units_risked}
                onChange={(e) => setTrackForm((f) => ({ ...f, units_risked: e.target.value }))}
                className="h-11 min-h-11 text-ui"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setTrackOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11"
              onClick={() => void saveToTracker()}
              disabled={trackSaving}
            >
              {trackSaving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save to tracker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
