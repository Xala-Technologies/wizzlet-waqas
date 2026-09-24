import { parsePickOdds as parseOdds, americanToDecimal, decimalToAmerican } from '@/lib/odds';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  BadgeCheck,
  Bookmark,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Play,
  PlusCircle,
  Sparkles,
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
import { trackPostView } from '@/lib/analytics';
import { sportVisual } from '@/lib/sportVisual';
import {
  isMemberHomeDemoId,
  MEMBER_HOME_DEMO_PICKS,
  shouldUseMemberHomeDemo,
  type MemberHomeDemoPickRow,
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
    verified?: boolean;
    initials?: string;
  };
  isDemo?: boolean;
  likes?: number;
  comments?: number;
  body?: string;
  footerNote?: string;
  picks?: MemberHomeDemoPickRow[];
  video?: { thumbnailUrl: string; duration: string };
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

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const feedRaw = useQuery(api.posts.queries.memberFeed, user ? {} : 'skip');
  const savedRaw = useQuery(api.bookmarks.mutations.listSavedPosts, user ? {} : 'skip');
  const toggleSavedPost = useMutation(api.bookmarks.mutations.toggleSavedPost);
  const upsertPick = useMutation(api.picks.mutations.upsert);

  const [visibleCount, setVisibleCount] = useState(10);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackSaving, setTrackSaving] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState<Set<string> | null>(null);
  const [likedDemo, setLikedDemo] = useState<Set<string>>(new Set());
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
      (feedRaw ?? []).map((p) => {
        const parsed = parsePick(p.content);
        const odds = parsed ? parseOdds(parsed.odds) : { us: null, eu: null };
        const picks: MemberHomeDemoPickRow[] | undefined =
          parsed?.event || parsed?.pick
            ? [
                {
                  sport: parsed.sport || 'Sports',
                  event: parsed.event || p.title,
                  pick: parsed.pick || p.title,
                  odds: odds.us || odds.eu || parsed.odds || '—',
                  units: parsed.units || '1u',
                },
              ]
            : undefined;
        return {
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
            verified: true,
          },
          body: parsed?.notes ?? undefined,
          picks,
        };
      }),
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
      title: d.title,
      content: null,
      is_premium: true,
      created_at: new Date(d.createdAtMs).toISOString(),
      result: 'pending',
      creator: {
        id: d.creator.id,
        username: d.creator.username,
        display_name: d.creator.displayName,
        avatar_url: d.creator.avatarUrl,
        verified: d.creator.verified,
        initials: d.creator.initials,
      },
      isDemo: true,
      likes: d.likes,
      comments: d.comments,
      body: d.body,
      footerNote: d.footerNote,
      picks: d.picks,
      video: d.video,
    }));
  }, [useDemo, livePosts]);

  const savedIds = useMemo(() => {
    const base = new Set((savedRaw ?? []).map((r) => r.postId as string));
    return optimisticSaved ?? base;
  }, [savedRaw, optimisticSaved]);

  const visiblePosts = posts.slice(0, visibleCount);
  const trackedViews = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const post of visiblePosts) {
      if (post.isDemo || isMemberHomeDemoId(post.id)) continue;
      if (trackedViews.current.has(post.id)) continue;
      trackedViews.current.add(post.id);
      void trackPostView(post.id, post.creator.id);
    }
  }, [visiblePosts]);

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

  const toggleLike = (postId: string) => {
    if (isMemberHomeDemoId(postId)) {
      setLikedDemo((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
      return;
    }
    toast.message('Likes', {
      description: 'Like counts sync when creator engagement ships.',
    });
  };

  const openTracker = (post: FeedPost) => {
    if (post.isDemo || isMemberHomeDemoId(post.id)) {
      toast.message('Sample preview', {
        description: 'Tail real picks when you leave demo mode (?demo=0).',
      });
      return;
    }
    const pick = post.picks?.[0];
    const parsed = parsePick(post.content);
    const odds = parsed ? parseOdds(parsed.odds) : { us: null, eu: null };
    setTrackForm({
      pick_event: pick?.pick || parsed?.pick || post.title,
      sport: pick?.sport || parsed?.sport || '',
      eu_odds: odds.eu || '',
      us_odds: odds.us || pick?.odds || '',
      units_risked: (pick?.units || parsed?.units || '1').replace(/[^0-9.]/g, '') || '1',
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

  if (loading) {
    return (
      <DashboardLayout type="member">
        <Seo title="Home — Prizelet" description="Your Prizelet member home feed." />
        <header className="mb-8">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-3 h-4 w-56" />
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
        description="Latest from creators you follow on Prizelet."
      />

      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Home
        </h1>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
          Latest from your creators
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

      {visiblePosts.length > 0 ? (
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {visiblePosts.map((post) => {
            const creatorName = post.creator.display_name ?? post.creator.username;
            const initials =
              post.creator.initials ||
              creatorName
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
            const saved = savedIds.has(post.id);
            const liked = likedDemo.has(post.id);
            const likeCount = (post.likes ?? 0) + (liked ? 1 : 0);

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
              >
                <div className="flex items-start gap-3">
                  {post.creator.avatar_url ? (
                    <img
                      src={post.creator.avatar_url}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        post.creator.initials === '👑'
                          ? 'bg-amber-100 text-base'
                          : 'bg-muted text-muted-foreground',
                      )}
                      aria-hidden
                    >
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <Link
                          to={post.isDemo ? '/dashboard/discover' : `/${post.creator.username}`}
                          className="truncate text-[15px] font-bold text-foreground hover:underline"
                        >
                          {creatorName}
                        </Link>
                        {post.creator.verified !== false ? (
                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-label="Verified"
                          />
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNowStrict(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground"
                            aria-label="Post options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!post.isDemo ? (
                            <DropdownMenuItem onSelect={() => openTracker(post)}>
                              Tail this pick
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.message('Muted', {
                                description: 'Mute controls are coming soon.',
                              })
                            }
                          >
                            Mute creator
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.message('Reported', {
                                description: 'Thanks — our team will review.',
                              })
                            }
                          >
                            Report post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h2 className="mt-3 text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                      {post.title}
                    </h2>
                    {post.body ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {post.body}
                      </p>
                    ) : null}

                    {post.picks && post.picks.length > 0 ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/40">
                        <ul className="divide-y divide-border">
                          {post.picks.map((row) => {
                            const visual = sportVisual(row.sport);
                            return (
                              <li
                                key={`${row.event}-${row.pick}`}
                                className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                              >
                                <span
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-base"
                                  aria-hidden
                                >
                                  {visual.emoji}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {row.event}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground sm:hidden">
                                    {row.pick} · {row.odds} · {row.units}
                                  </p>
                                </div>
                                <p className="hidden shrink-0 text-sm font-semibold text-foreground sm:block">
                                  {row.pick}
                                </p>
                                <p className="hidden shrink-0 font-mono text-sm font-bold tabular-nums text-foreground sm:block">
                                  {row.odds}
                                </p>
                                <p className="hidden shrink-0 text-xs font-semibold text-muted-foreground sm:block">
                                  {row.units}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}

                    {post.footerNote ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {post.footerNote}
                      </p>
                    ) : null}

                    {post.video ? (
                      <button
                        type="button"
                        className="group relative mt-3 block w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() =>
                          toast.message('Video', {
                            description: post.isDemo
                              ? 'Sample preview — video playback is not live.'
                              : 'Video player opens when media posts ship.',
                          })
                        }
                        aria-label={`Play video (${post.video.duration})`}
                      >
                        <img
                          src={post.video.thumbnailUrl}
                          alt=""
                          className="aspect-video w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg">
                            <Play className="h-6 w-6 fill-current pl-0.5" aria-hidden />
                          </span>
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-white">
                          {post.video.duration}
                        </span>
                      </button>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                            liked && 'text-rose-500',
                          )}
                          onClick={() => toggleLike(post.id)}
                          aria-label={liked ? 'Unlike' : 'Like'}
                          aria-pressed={liked}
                        >
                          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
                          <span className="tabular-nums text-xs font-semibold">{likeCount}</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                      </div>

                      <button
                        type="button"
                        className={cn(
                          'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                          saved && 'text-primary',
                        )}
                        onClick={() => void toggleSave(post.id)}
                        aria-label={saved ? 'Unsave' : 'Save'}
                        aria-pressed={saved}
                      >
                        <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {posts.length > visibleCount ? (
            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={() => setVisibleCount((v) => v + 10)}
              >
                Show more
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <h3 className="mb-2 text-base font-semibold text-foreground">Nothing in your feed yet</h3>
          <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
            Subscribe to creators to see their latest picks and posts here.
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
