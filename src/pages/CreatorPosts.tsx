import { useMemo, useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText, Plus, Loader2, Pencil, Trash2, Lock, Globe,
  CheckCircle2, ArrowRight, Zap, Flame,
  Clock, Trophy, XCircle, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { americanToDecimal, decimalToAmerican } from '@/lib/odds';
import { parsePostContent } from '@/lib/postContent';
import { computeWinRate } from '../../convex/lib/results';

const PAGE_SIZE = 25;

interface Post {
  id: string;
  title: string;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  result: string;
  tracking_mode: string;
}

const SPORTS = ['NBA', 'NFL', 'Soccer', 'Tennis', 'MLB', 'NHL', 'MMA', 'Boxing', 'Golf', 'Other'];
const PICK_TYPES = ['Moneyline', 'Spread', 'Over/Under', 'Prop', 'Parlay', 'Other'];

const resultConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
  won: { label: 'Won', icon: Trophy, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  lost: { label: 'Lost', icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  push: { label: 'Push', icon: Minus, className: 'bg-muted text-muted-foreground' },
};

const CreatorPosts = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const { results: postsRaw, status: postsStatus, loadMore } = usePaginatedQuery(
    api.posts.queries.listMinePage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const upsertPost = useMutation(api.posts.queries.upsert);
  const removePost = useMutation(api.posts.queries.remove);
  const setResultMut = useMutation(api.posts.queries.setResult);

  const loading = creator === undefined || postsStatus === 'LoadingFirstPage';
  const listComplete = postsStatus === 'Exhausted';
  const creatorId = creator?._id ?? null;

  const posts = useMemo(
    () =>
      (postsRaw ?? []).map((p) => ({
        id: p._id,
        title: p.title,
        content: p.content ?? null,
        is_premium: p.isPremium,
        created_at: new Date(p.createdAt).toISOString(),
        result: p.result ?? 'pending',
        tracking_mode: p.trackingMode ?? '',
      })),
    [postsRaw],
  );

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('');
  const [event, setEvent] = useState('');
  const [pickType, setPickType] = useState('');
  const [pick, setPick] = useState('');
  const [usOdds, setUsOdds] = useState('');
  const [euOdds, setEuOdds] = useState('');
  const [units, setUnits] = useState('1');
  const [notes, setNotes] = useState('');
  const [isPremium, setIsPremium] = useState(true);
  const [oddsSource, setOddsSource] = useState<'us' | 'eu' | null>(null);

  const resetForm = () => {
    setEditId(null);
    setTitle('');
    setSport('');
    setEvent('');
    setPickType('');
    setPick('');
    setUsOdds('');
    setEuOdds('');
    setUnits('1');
    setNotes('');
    setIsPremium(true);
    setOddsSource(null);
  };

  const openCreate = () => {
    resetForm();
    setMode('create');
  };

  const openEdit = (post: Post) => {
    resetForm();
    const parsed = parsePostContent(post.content);
    setEditId(post.id);
    setTitle(post.title);
    setSport(parsed.sport);
    setEvent(parsed.event);
    setPickType(parsed.pickType);
    setPick(parsed.pick);
    setUsOdds(parsed.usOdds);
    setEuOdds(parsed.euOdds);
    setUnits(parsed.units);
    setNotes(parsed.notes);
    setIsPremium(post.is_premium);
    setMode('create');
  };

  const handleUsOddsChange = (val: string) => {
    setUsOdds(val);
    setOddsSource('us');
    const eu = americanToDecimal(val);
    setEuOdds(eu !== null ? String(eu) : '');
  };
  const handleEuOddsChange = (val: string) => {
    setEuOdds(val);
    setOddsSource('eu');
    setUsOdds(decimalToAmerican(val));
  };

  const buildContent = (): string => {
    const parts: string[] = [];
    if (sport) parts.push(`Sport: ${sport}`);
    if (event) parts.push(`Event: ${event}`);
    if (pickType) parts.push(`Type: ${pickType}`);
    if (pick) parts.push(`Pick: ${pick}`);
    if (usOdds || euOdds) {
      parts.push(
        `Odds: ${usOdds ? `${usOdds} (US)` : ''} ${euOdds ? `${euOdds} (EU)` : ''}`.trim(),
      );
    }
    if (units) parts.push(`Units: ${units}u`);
    if (notes) parts.push(`\n${notes}`);
    return parts.join('\n');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!creatorId) {
      toast.error('Creator profile not ready — try again in a moment');
      return;
    }
    setSaving(true);
    const contentStr = buildContent();
    try {
      await upsertPost({
        postId: editId ? (editId as Id<'posts'>) : undefined,
        creatorId,
        title: title.trim(),
        content: contentStr || undefined,
        isPremium,
      });
      setShowSuccess(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removePost({ postId: deleteId as Id<'posts'> });
      toast.success('Post deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleResultChange = async (postId: string, newResult: string) => {
    try {
      await setResultMut({ postId: postId as Id<'posts'>, result: newResult });
      toast.success(`Marked as ${newResult}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('RESULT_LOCKED')) {
        toast.error('Settled results are locked and cannot be changed');
      } else {
        toast.error('Failed to update result');
      }
    }
  };

  const winStreak = (() => {
    let streak = 0;
    for (const p of posts) {
      if (p.result === 'won') streak++;
      else if (p.result === 'lost') break;
    }
    return streak;
  })();

  const deleteDialog = (
    <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this pick?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the post. Settled history on this pick will be gone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              void confirmDelete();
            }}
          >
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // CREATE MODE
  if (mode === 'create') {
    const primaryCta = editId ? 'Save changes' : 'Publish Pick';
    const reviewTitle = title.trim() || 'Untitled pick';
    const reviewOdds =
      usOdds || euOdds
        ? [usOdds && `${usOdds} US`, euOdds && `${euOdds} EU`].filter(Boolean).join(' · ')
        : null;
    const reviewBits = [
      isPremium ? 'Premium' : 'Free',
      pick.trim() || null,
      reviewOdds,
    ].filter(Boolean);

    return (
      <DashboardLayout type="creator">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="text-support text-muted-foreground hover:text-foreground transition-colors mb-1 block"
            >
              ← Back to posts
            </button>
            <h1 className="text-heading font-bold text-foreground">
              {editId ? 'Edit Pick' : 'New Pick'}
            </h1>
          </div>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !title.trim()}
            className="min-h-11 shrink-0 hidden md:inline-flex"
          >
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {!editId && <Zap className="mr-1.5 h-3.5 w-3.5" />}
            {primaryCta}
          </Button>
        </header>

        <div className="max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pick-title" className="text-support text-muted-foreground">
                Title *
              </Label>
              <Input
                id="pick-title"
                placeholder="e.g. Lakers ML +150"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-ui"
                maxLength={200}
                required
              />
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <p className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
                Pick details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-support text-muted-foreground">Sport</Label>
                  <Select
                    value={sport || undefined}
                    onValueChange={setSport}
                  >
                    <SelectTrigger className="h-11 text-ui">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-support text-muted-foreground">Pick type</Label>
                  <Select
                    value={pickType || undefined}
                    onValueChange={setPickType}
                  >
                    <SelectTrigger className="h-11 text-ui">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PICK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pick-event" className="text-support text-muted-foreground">
                  Event
                </Label>
                <Input
                  id="pick-event"
                  placeholder="e.g. Lakers vs Warriors"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="h-11 text-ui"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pick-selection" className="text-support text-muted-foreground">
                  Pick
                </Label>
                <Input
                  id="pick-selection"
                  placeholder="e.g. Lakers ML, Over 2.5 goals"
                  value={pick}
                  onChange={(e) => setPick(e.target.value)}
                  className="h-11 text-ui"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pick-us-odds" className="text-support text-muted-foreground">
                    US odds
                  </Label>
                  <Input
                    id="pick-us-odds"
                    placeholder="-120 or +150"
                    value={usOdds}
                    onChange={(e) => handleUsOddsChange(e.target.value)}
                    className={`h-11 text-ui ${oddsSource === 'eu' ? 'text-muted-foreground' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pick-eu-odds" className="text-support text-muted-foreground">
                    EU odds
                  </Label>
                  <Input
                    id="pick-eu-odds"
                    placeholder="1.85"
                    value={euOdds}
                    onChange={(e) => handleEuOddsChange(e.target.value)}
                    className={`h-11 text-ui ${oddsSource === 'us' ? 'text-muted-foreground' : ''}`}
                  />
                </div>
              </div>
              {oddsSource && (
                <p className="text-caption text-muted-foreground">
                  {oddsSource === 'us' ? 'EU odds auto-calculated' : 'US odds auto-calculated'}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="pick-units" className="text-support text-muted-foreground">
                  Units
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pick-units"
                    type="number"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="h-11 w-24 text-ui"
                    min="0.5"
                    max="100"
                    step="0.5"
                  />
                  <span className="text-support text-muted-foreground">units risked</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-2">
              <Label htmlFor="pick-notes" className="text-support text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                id="pick-notes"
                placeholder="Why do you like this play?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none text-ui min-h-[5.5rem]"
              />
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ui font-medium text-foreground">Premium (subscribers only)</p>
                  <p className="text-caption text-muted-foreground">
                    Only paying subscribers can see this
                  </p>
                </div>
                <Switch
                  aria-label="Premium only"
                  checked={isPremium}
                  onCheckedChange={setIsPremium}
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-caption text-muted-foreground uppercase tracking-wider mb-1">
                Ready to {editId ? 'save' : 'publish'}
              </p>
              <p className="text-ui text-foreground truncate">{reviewTitle}</p>
              {reviewBits.length > 0 && (
                <p className="text-support text-muted-foreground mt-0.5 truncate">
                  {reviewBits.join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !title.trim()}
              className="w-full min-h-12 text-ui font-semibold"
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {!editId && <Zap className="mr-1.5 h-4 w-4" />}
              {primaryCta}
            </Button>
          </div>
          <div className="h-24 md:hidden" aria-hidden />
        </div>

        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-sm bg-card border-border text-center">
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
              </div>
              <DialogHeader>
                <DialogTitle className="text-center text-title-lg">
                  Pick posted successfully
                </DialogTitle>
              </DialogHeader>
              <p className="text-support text-muted-foreground">
                Your pick is now live for subscribers.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => {
                    setShowSuccess(false);
                    resetForm();
                  }}
                  className="w-full min-h-11"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Create Another
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccess(false);
                    setMode('list');
                  }}
                  className="w-full min-h-11"
                >
                  Go to Feed <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {deleteDialog}
      </DashboardLayout>
    );
  }

  // LIST MODE — gate chrome until first page is ready
  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const { winRatePct: winRate, wins, losses } = computeWinRate(posts.map((p) => p.result));
  const picksLabel = listComplete ? 'Total picks' : 'Loaded picks';
  const statsNote = listComplete
    ? `${posts.length} pick${posts.length !== 1 ? 's' : ''}`
    : `Stats for ${posts.length} loaded post${posts.length !== 1 ? 's' : ''}`;

  const stats = [
    { label: picksLabel, value: posts.length, color: 'text-foreground' },
    { label: 'Wins', value: wins, color: 'text-emerald-500' },
    { label: 'Losses', value: losses, color: 'text-red-500' },
    { label: 'Win rate', value: `${winRate}%`, color: 'text-primary' },
  ];

  return (
    <DashboardLayout type="creator">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-heading md:text-heading-lg font-bold text-foreground flex flex-wrap items-center gap-2">
            Posts
            {winStreak >= 3 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-caption font-semibold text-amber-500">
                <Flame className="h-3.5 w-3.5" /> {winStreak}W Streak
              </span>
            )}
          </h1>
          <p className="text-support text-muted-foreground mt-1">{statsNote}</p>
          <p className="text-caption text-muted-foreground mt-1">
            Settled post results here are separate from Performance Tracker practice picks.
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-11 shrink-0 w-full sm:w-auto">
          <Plus className="mr-1.5 h-4 w-4" /> New Pick
        </Button>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={`text-title-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5 uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-title font-semibold text-foreground mb-1">No picks yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-4">
            Post your first pick and share it with subscribers.
          </p>
          <Button onClick={openCreate} className="min-h-11">
            <Plus className="mr-1.5 h-4 w-4" /> Create Pick
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const rc = resultConfig[post.result as keyof typeof resultConfig] || resultConfig.pending;
            const ResultIcon = rc.icon;
            return (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/20"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {post.is_premium ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-caption font-medium text-primary uppercase tracking-wide">
                          <Lock className="h-2.5 w-2.5" /> Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-caption font-medium text-muted-foreground uppercase tracking-wide">
                          <Globe className="h-2.5 w-2.5" /> Free
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-caption font-semibold uppercase ${rc.className}`}
                      >
                        <ResultIcon className="h-2.5 w-2.5 mr-0.5" />
                        {rc.label}
                      </Badge>
                      <span className="text-caption text-muted-foreground">
                        {format(new Date(post.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ui text-foreground">{post.title}</h3>
                    {post.content && (
                      <p className="text-caption text-muted-foreground mt-1 line-clamp-2">
                        {post.content}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    {post.result === 'pending' && (
                      <div className="flex items-center gap-0.5 mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                          onClick={() => void handleResultChange(post.id, 'won')}
                          title="Mark Won"
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => void handleResultChange(post.id, 'lost')}
                          title="Mark Lost"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-muted-foreground hover:bg-muted"
                          onClick={() => void handleResultChange(post.id, 'push')}
                          title="Mark Push"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {post.result !== 'pending' && (
                      <span className="text-caption text-muted-foreground mr-1 px-1.5 py-0.5 rounded border border-border">
                        Settled · locked
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => openEdit(post)}
                      aria-label="Edit pick"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(post.id)}
                      aria-label="Delete pick"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {(postsStatus === 'CanLoadMore' || postsStatus === 'LoadingMore') && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={postsStatus === 'LoadingMore'}
                onClick={() => loadMore(PAGE_SIZE)}
              >
                {postsStatus === 'LoadingMore' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
      {deleteDialog}
    </DashboardLayout>
  );
};

export default CreatorPosts;
