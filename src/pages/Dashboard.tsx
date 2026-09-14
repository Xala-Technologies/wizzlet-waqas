import { parsePickOdds as parseOdds, americanToDecimal, decimalToAmerican } from '@/lib/odds';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Crown, FileText, Loader2, Lock, Globe, Users, CreditCard,
  Bookmark, ArrowRight, Copy, PlusCircle,
  Clock, Check, Trophy, XCircle, Minus, Compass,
} from 'lucide-react';
import { openCustomerPortal } from '@/lib/stripe';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import { trackPostView } from '@/lib/analytics';
import { copyToClipboard } from '@/lib/clipboard';
import { computeWinRate } from '../../convex/lib/results';
import { subscriptionGrantsContentAccess } from '../../convex/lib/contentAccess';
import { SurfaceCard } from '@/components/ux/SurfaceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { mapConvexSportEvent, todayBoundsMs } from '@/lib/events';
import {
  GameMatchupCard,
  countPicksForMatchup,
} from '@/components/discover/GameMatchupCard';
import { Seo } from '@/components/Seo';

interface Subscription {
  id: string;
  status: string;
  billingStatus?: string | null;
  cancelAtPeriodEnd?: boolean | null;
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
    id: string;
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
  const notifUnread = useQuery(api.notifications.mutations.unreadCount, user ? {} : 'skip');
  const dmInbox = useQuery(api.messaging.mutations.mySubscriberInbox, user ? {} : 'skip');
  const picksRaw = useQuery(api.picks.mutations.listMine, user ? {} : 'skip');
  const dayBounds = useMemo(() => todayBoundsMs(), []);
  const eventsRaw = useQuery(api.events.queries.listPublishedToday, dayBounds);
  const toggleSavedPost = useMutation(api.bookmarks.mutations.toggleSavedPost);
  const upsertPick = useMutation(api.picks.mutations.upsert);

  const [visibleCount, setVisibleCount] = useState(10);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackSaving, setTrackSaving] = useState(false);
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
        billingStatus: s.billingStatus,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
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
          id: p.creator._id,
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

  const activeSubs = subs.filter((s) =>
    subscriptionGrantsContentAccess(
      {
        status: s.status,
        billingStatus: s.billingStatus,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      },
      Date.now(),
    ),
  );

  const pastDueSubs = (subsRaw ?? []).filter(
    (s) =>
      s.status === 'past_due' ||
      s.billingStatus === 'past_due' ||
      s.billingStatus === 'unpaid',
  );
  const cancelPendingSubs = (subsRaw ?? []).filter(
    (s) => s.billingStatus === 'cancel_pending' || s.cancelAtPeriodEnd,
  );
  const unreadDms = (dmInbox ?? []).filter((m) => !m.read && m.senderRole === 'creator').length;

  const feedPosts = posts;
  const visiblePosts = feedPosts.slice(0, visibleCount);
  const trackedViews = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const post of visiblePosts) {
      if (trackedViews.current.has(post.id)) continue;
      trackedViews.current.add(post.id);
      void trackPostView(post.id, post.creator.id);
    }
  }, [visiblePosts]);

  const { winRatePct: winRate, decided: settledPicks } = computeWinRate(posts.map((p) => p.result));
  const wonPicks = posts.filter((p) => p.result === 'won').length;

  const todaysGames = useMemo(
    () => (eventsRaw ?? []).map(mapConvexSportEvent).slice(0, 6),
    [eventsRaw],
  );

  const myPickRows = useMemo(
    () =>
      (picksRaw ?? []).map((p) => ({
        pickEvent: p.pickEvent,
        sport: p.sport,
      })),
    [picksRaw],
  );

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

  const copyPick = async (post: FeedPost) => {
    const pick = parsePick(post.content);
    const text = pick
      ? `${post.title}${pick.pick ? ` | ${pick.pick}` : ''}${pick.odds ? ` | ${pick.odds}` : ''}`
      : post.title;
    const ok = await copyToClipboard(text);
    if (ok) toast.success('Pick copied to clipboard');
    else toast.error('Could not copy — try selecting the text manually');
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <Seo title="Dashboard — Prizelet" description="Your Prizelet member dashboard." />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-base text-secondary-foreground">Loading your feed…</p>
        </header>
        <div className="space-y-4" aria-busy="true" aria-label="Loading feed">
          {[0, 1, 2].map((i) => (
            <SurfaceCard key={i} className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </SurfaceCard>
          ))}
        </div>
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
      <SurfaceCard key={post.id} className="transition-colors hover:border-primary/20">
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          {post.creator.avatar_url ? (
            <img src={post.creator.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-caption font-bold text-muted-foreground">
                {(post.creator.display_name?.[0] ?? post.creator.username[0]).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                to={`/${post.creator.username}`}
                className="text-ui font-semibold text-foreground truncate hover:underline"
              >
                {post.creator.display_name ?? post.creator.username}
              </Link>
              {streak >= 3 && (
                <span className="text-support text-muted-foreground shrink-0">{streak}W streak</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-support text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          {post.is_premium ? (
            <Badge variant="outline" className="text-caption bg-muted text-muted-foreground border-border shrink-0">
              <Lock className="h-2.5 w-2.5 mr-0.5" /> Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="text-caption bg-muted text-muted-foreground shrink-0">
              <Globe className="h-2.5 w-2.5 mr-0.5" /> Free
            </Badge>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {pick && (pick.sport || pick.event) && (
            <div className="flex items-center gap-2 mb-3">
              {pick.sport && (
                <Badge variant="outline" className="text-caption font-medium bg-muted text-muted-foreground border-border">
                  {pick.sport}
                </Badge>
              )}
              {pick.event && (
                <span className="text-support text-muted-foreground truncate">{pick.event}</span>
              )}
            </div>
          )}

          <h3 className="text-ui sm:text-lg font-bold text-foreground leading-tight mb-3">
            {pick?.pick || post.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(odds.us || odds.eu) && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-support text-muted-foreground">Odds:</span>
                {odds.us && <span className="text-ui font-bold text-foreground">{odds.us}</span>}
                {odds.us && odds.eu && <span className="text-support text-muted-foreground">/</span>}
                {odds.eu && (
                  <span className="text-ui font-semibold text-muted-foreground">{odds.eu}</span>
                )}
              </div>
            )}
            {pick?.units && (
              <div className="inline-flex items-center rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-ui font-bold text-foreground">{pick.units}</span>
              </div>
            )}
            <Badge variant="outline" className={`text-caption font-semibold uppercase ${rs.className}`}>
              <ResultIcon className="h-2.5 w-2.5 mr-0.5" />
              {rs.label}
            </Badge>
          </div>

          {pick?.pick && post.title !== pick.pick && (
            <p className="text-ui font-medium text-foreground mb-2">{post.title}</p>
          )}

          {pick?.notes && (
            <div className="rounded-lg bg-muted/30 p-3 mb-3">
              <p className="text-support text-muted-foreground leading-relaxed">{pick.notes}</p>
            </div>
          )}

          {!pick && post.content && (
            <p className="text-support text-muted-foreground leading-relaxed line-clamp-3 mb-3">
              {post.content}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              className={`min-h-11 px-3 ${savedIds.has(post.id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => void toggleSave(post.id)}
            >
              <Bookmark className={`h-3.5 w-3.5 mr-1.5 ${savedIds.has(post.id) ? 'fill-current' : ''}`} />
              {savedIds.has(post.id) ? 'Saved' : 'Save'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => openTracker(post)}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Track
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => void copyPick(post)}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
        </div>
      </SurfaceCard>
    );
  };

  return (
    <DashboardLayout type="member">
      <Seo
        title="Dashboard — Prizelet"
        description="Your Prizelet member dashboard: feed, today’s games, and discover."
      />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-base text-secondary-foreground">
            {posts.length > 0
              ? `${posts.length} pick${posts.length === 1 ? '' : 's'} from your creators`
              : 'Latest picks from creators you subscribe to'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(activeSubs.length > 0 || pastDueSubs.length > 0) && (
            <Button type="button" variant="outline" onClick={() => void openCustomerPortal()}>
              <CreditCard className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Billing
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/dashboard/discover" className="gap-1.5">
              <Compass className="h-4 w-4" aria-hidden /> Discover
            </Link>
          </Button>
        </div>
      </header>

      {(pastDueSubs.length > 0 ||
        cancelPendingSubs.length > 0 ||
        (notifUnread ?? 0) > 0 ||
        unreadDms > 0 ||
        activeSubs.length === 0) && (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            Next up
          </h2>
          <ul className="space-y-2">
            {pastDueSubs.length > 0 && (
              <li>
                <Link
                  to="/dashboard/subscriptions-billing"
                  className="inline-flex items-center gap-1.5 text-base font-medium text-destructive hover:underline"
                >
                  {pastDueSubs.length} subscription{pastDueSubs.length === 1 ? '' : 's'} past due —
                  review billing
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            )}
            {cancelPendingSubs.length > 0 && (
              <li>
                <Link
                  to="/dashboard/subscriptions-billing"
                  className="inline-flex items-center gap-1.5 text-base font-medium text-foreground hover:text-primary"
                >
                  Cancellation pending on {cancelPendingSubs.length} subscription
                  {cancelPendingSubs.length === 1 ? '' : 's'}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            )}
            {(notifUnread ?? 0) > 0 && (
              <li>
                <Link
                  to="/dashboard/notifications"
                  className="inline-flex items-center gap-1.5 text-base font-medium text-foreground hover:text-primary"
                >
                  {notifUnread} unread notification{notifUnread === 1 ? '' : 's'}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            )}
            {unreadDms > 0 && (
              <li>
                <Link
                  to="/dashboard/messages"
                  className="inline-flex items-center gap-1.5 text-base font-medium text-foreground hover:text-primary"
                >
                  {unreadDms} unread message{unreadDms === 1 ? '' : 's'}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            )}
            {activeSubs.length === 0 && (
              <li>
                <Link
                  to="/dashboard/discover"
                  className="inline-flex items-center gap-1.5 text-base font-medium text-foreground hover:text-primary"
                >
                  No active access — discover creators
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          { label: 'Active subs', value: String(activeSubs.length) },
          { label: 'Picks available', value: String(posts.length) },
          { label: 'Creator wins', value: String(wonPicks) },
          {
            label: 'Creator win rate',
            value: settledPicks > 0 ? `${winRate}%` : '—',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-secondary-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Today's Games */}
      <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Today’s Games</h2>
            <p className="mt-1 text-sm text-secondary-foreground">
              Live slate — your tracked pick counts only (no invented market bars).
            </p>
          </div>
          <Link
            to="/dashboard/discover#todays-games"
            className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
          >
            Browse games
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {eventsRaw === undefined ? (
          <div className="flex justify-center py-12" aria-busy="true">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : todaysGames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
            <p className="text-base font-semibold text-foreground">No games published today</p>
            <p className="mt-1 text-sm text-secondary-foreground">
              When the slate is live, matchups appear here with your pick counts.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {todaysGames.map((event) => {
              const yourPickCount = countPicksForMatchup(myPickRows, event);
              return (
                <li key={event.id} className="list-none">
                  <GameMatchupCard
                    event={event}
                    yourPickCount={yourPickCount}
                    actionHref="/dashboard/results"
                    actionLabel={yourPickCount > 0 ? 'View tracker' : 'Track pick'}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Discover strip */}
      <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-lg font-bold tracking-tight text-foreground">Discover</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-secondary-foreground">
          Browse creators and today’s full games slate — find clubs worth following.
        </p>
        <Button asChild>
          <Link to="/dashboard/discover">Open Discover</Link>
        </Button>
      </section>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
          Your feed
        </h2>
        <p className="text-sm text-secondary-foreground">
          Win rate is from creator posts — your personal log is My Bet Tracker.
        </p>
      </div>

      {visiblePosts.length > 0 ? (
        <div className="space-y-4">
          {visiblePosts.map(renderPost)}

          {feedPosts.length > visibleCount && (
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setVisibleCount((v) => v + 10)}
              >
                Show more picks <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : activeSubs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-secondary-foreground" aria-hidden />
          <h3 className="mb-2 text-base font-semibold text-foreground">No picks yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-sm text-secondary-foreground">
            Subscribe to creators to start receiving premium picks in your feed.
          </p>
          <Button className="min-h-11" asChild>
            <Link to="/dashboard/discover">
              <Crown className="mr-1.5 h-4 w-4" aria-hidden /> Browse creators
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-secondary-foreground" aria-hidden />
          <h3 className="mb-2 text-base font-semibold text-foreground">No picks yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-sm text-secondary-foreground">
            Your creators haven&apos;t posted any picks yet. Check back soon.
          </p>
          <Button variant="outline" className="min-h-11" asChild>
            <Link to="/dashboard/discover">Browse more creators</Link>
          </Button>
        </div>
      )}

      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ui">
              <PlusCircle className="h-4 w-4 text-primary" /> Add to tracker
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-support text-muted-foreground mb-0.5">Pick</p>
              <p className="text-ui font-semibold text-foreground">{trackForm.pick_event}</p>
              {trackForm.sport && (
                <Badge
                  variant="outline"
                  className="mt-1 text-caption bg-muted text-muted-foreground border-border"
                >
                  {trackForm.sport}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" />
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
