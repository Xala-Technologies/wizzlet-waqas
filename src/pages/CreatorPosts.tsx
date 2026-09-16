import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText, Plus, Loader2, Pencil, Trash2,
  CheckCircle2, ArrowRight,
  Clock, Trophy, XCircle, Minus, Crown, Send, ChevronDown, ChevronUp,
  BarChart3, Search, Tag,
  Upload, Target, Users, MoreVertical, ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { americanToDecimal, decimalToAmerican, profitUnits } from '@/lib/odds';
import { parsePostContent } from '@/lib/postContent';
import { computeWinRate } from '../../convex/lib/results';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import {
  CREATOR_PICKS_DEMO_METRICS,
  CREATOR_PICKS_DEMO_ROWS,
  isCreatorPicksDemoId,
  shouldUseCreatorPicksDemo,
} from '@/lib/creatorPicksDemo';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { sportVisual } from '@/lib/sportVisual';

const PAGE_SIZE = 50;
const TABLE_PAGE_SIZE = 10;
const POST_MAX = 2000;

type ResultTab = 'all' | 'pending' | 'won' | 'lost' | 'scheduled';
type DateRangeKey = '7' | '30' | '90' | 'all';

interface Post {
  id: string;
  title: string;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  createdAtMs: number;
  result: string;
  tracking_mode: string;
}

interface EnrichedPick extends Post {
  sport: string;
  event: string;
  pick: string;
  usOdds: string;
  euOdds: string;
  units: number;
  profit: number;
  isScheduled: boolean;
}

const SPORTS = [
  'Basketball',
  'Football',
  'Soccer',
  'Tennis',
  'Baseball',
  'Hockey',
  'MMA',
  'Boxing',
  'Golf',
  'NBA',
  'NFL',
  'MLB',
  'NHL',
  'Other',
];

const RESULT_TABS: { id: ResultTab; label: string }[] = [
  { id: 'all', label: 'All Picks' },
  { id: 'pending', label: 'Pending' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'scheduled', label: 'Scheduled' },
];

function splitMatch(event: string): { home: string; away: string } | null {
  const parts = event.split(/\s+vs\.?\s+/i);
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return { home: parts[0].trim(), away: parts[1].trim() };
  }
  return null;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function formatSignedPct(value: number | null, suffix = '%'): string | undefined {
  if (value === null) return undefined;
  const sign = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  return `${sign} ${Math.abs(value)}${suffix}`;
}

function enrichPost(post: Post): EnrichedPick {
  const parsed = parsePostContent(post.content);
  const units = Number.parseFloat(parsed.units) || 1;
  const result = (['won', 'lost', 'push', 'pending'].includes(post.result)
    ? post.result
    : 'pending') as 'won' | 'lost' | 'push' | 'pending';
  const profit = profitUnits(result, units, parsed.usOdds || '-110');
  return {
    ...post,
    sport: parsed.sport,
    event: parsed.event || post.title,
    pick: parsed.pick || post.title,
    usOdds: parsed.usOdds,
    euOdds: parsed.euOdds,
    units,
    profit,
    isScheduled: post.tracking_mode === 'scheduled',
  };
}

function MatchCell({ event, sport, pick }: { event: string; sport: string; pick?: string }) {
  const visual = sportVisual(sport);
  const split = splitMatch(event);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base',
          visual.chipClass,
        )}
        aria-hidden
        title={sport || 'Sport'}
      >
        {visual.emoji}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {split ? `${split.home} vs ${split.away}` : event || '—'}
        </p>
        {pick ? (
          <p className="truncate text-xs font-medium text-foreground/80">{pick}</p>
        ) : null}
        {sport ? (
          <p className="truncate text-xs font-medium text-muted-foreground">{sport}</p>
        ) : null}
      </div>
    </div>
  );
}

const CreatorPosts = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const creator = useQuery(api.creators.queries.myCreator);
  const subscriptions = useQuery(api.subscriptions.mutations.listForMyCreator);
  const { results: postsRaw, status: postsStatus, loadMore } = usePaginatedQuery(
    api.posts.queries.listMinePage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const upsertPost = useMutation(api.posts.queries.upsert);
  const removePost = useMutation(api.posts.queries.remove);
  const setResultMut = useMutation(api.posts.queries.setResult);

  const loading = creator === undefined || postsStatus === 'LoadingFirstPage';
  const creatorId = creator?._id ?? null;

  const realPosts = useMemo(
    () =>
      (postsRaw ?? []).map((p) => ({
        id: p._id,
        title: p.title,
        content: p.content ?? null,
        is_premium: p.isPremium,
        created_at: new Date(p.createdAt).toISOString(),
        createdAtMs: p.createdAt,
        result: p.result ?? 'pending',
        tracking_mode: p.trackingMode ?? '',
      })),
    [postsRaw],
  );

  const useDemo = shouldUseCreatorPicksDemo({
    postCount: realPosts.length,
    forceDemo,
    disableDemo,
  });

  const posts = useMemo((): Post[] => {
    if (!useDemo) return realPosts;
    return CREATOR_PICKS_DEMO_ROWS.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      is_premium: row.is_premium,
      created_at: new Date(row.createdAtMs).toISOString(),
      createdAtMs: row.createdAtMs,
      result: row.result,
      tracking_mode: row.tracking_mode,
    }));
  }, [realPosts, useDemo]);

  const enriched = useMemo(() => posts.map(enrichPost), [posts]);

  const activeSubscribers = useMemo(() => {
    if (useDemo) return CREATOR_PICKS_DEMO_METRICS.subscribers;
    return (subscriptions ?? []).filter((s) => s.status === 'active').length;
  }, [subscriptions, useDemo]);

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const [resultTab, setResultTab] = useState<ResultTab>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeKey>('30');
  const [searchPicks, setSearchPicks] = useState('');
  const [tablePage, setTablePage] = useState(0);

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('');
  const [event, setEvent] = useState('');
  const [pick, setPick] = useState('');
  const [usOdds, setUsOdds] = useState('');
  const [euOdds, setEuOdds] = useState('');
  const [units, setUnits] = useState('1');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [isPremium, setIsPremium] = useState(true);
  const [oddsSource, setOddsSource] = useState<'us' | 'eu' | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const hasPickDetails = Boolean(
    sport || event || pick || usOdds || euOdds || (units && units !== '1') || tags,
  );

  const sportsInData = useMemo(() => {
    const set = new Set<string>();
    for (const p of enriched) {
      if (p.sport) set.add(p.sport);
    }
    return Array.from(set).sort();
  }, [enriched]);

  const rangeCutoffMs = useMemo(() => {
    if (dateRange === 'all') return 0;
    const days = Number(dateRange);
    return subDays(new Date(), days).getTime();
  }, [dateRange]);

  const filtered = useMemo(() => {
    const q = searchPicks.trim().toLowerCase();
    return enriched.filter((p) => {
      if (resultTab === 'scheduled') return p.isScheduled;
      if (resultTab !== 'all' && p.result !== resultTab) return false;
      if (p.isScheduled && resultTab !== 'all') return false;
      if (sportFilter !== 'all' && p.sport !== sportFilter) return false;
      if (rangeCutoffMs > 0 && p.createdAtMs < rangeCutoffMs) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.event.toLowerCase().includes(q) ||
        p.pick.toLowerCase().includes(q) ||
        p.sport.toLowerCase().includes(q)
      );
    });
  }, [enriched, resultTab, sportFilter, rangeCutoffMs, searchPicks]);

  const tablePageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(tablePage, tablePageCount - 1);
  const pageRows = filtered.slice(
    safePage * TABLE_PAGE_SIZE,
    safePage * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE,
  );

  const metrics = useMemo(() => {
    if (useDemo) {
      return {
        totalPicks: CREATOR_PICKS_DEMO_METRICS.totalPicks,
        totalPicksDelta: CREATOR_PICKS_DEMO_METRICS.totalPicksDelta,
        winRate: CREATOR_PICKS_DEMO_METRICS.winRate,
        winRateDelta: CREATOR_PICKS_DEMO_METRICS.winRateDelta,
        profit: CREATOR_PICKS_DEMO_METRICS.profit,
        profitDelta: CREATOR_PICKS_DEMO_METRICS.profitDelta,
        subscribers: CREATOR_PICKS_DEMO_METRICS.subscribers,
        subscribersDelta: CREATOR_PICKS_DEMO_METRICS.subscribersDelta,
      };
    }

    const now = Date.now();
    const windowMs = dateRange === 'all' ? 30 * 86400000 : Number(dateRange) * 86400000;
    const currentStart = now - windowMs;
    const previousStart = currentStart - windowMs;

    const inCurrent = enriched.filter((p) => p.createdAtMs >= currentStart);
    const inPrevious = enriched.filter(
      (p) => p.createdAtMs >= previousStart && p.createdAtMs < currentStart,
    );

    const currentSettled = inCurrent.filter((p) => p.result === 'won' || p.result === 'lost');
    const previousSettled = inPrevious.filter((p) => p.result === 'won' || p.result === 'lost');
    const { winRatePct: currentWr } = computeWinRate(currentSettled.map((p) => p.result));
    const { winRatePct: previousWr } = computeWinRate(previousSettled.map((p) => p.result));

    const currentProfit = inCurrent.reduce((sum, p) => sum + p.profit, 0);
    const previousProfit = inPrevious.reduce((sum, p) => sum + p.profit, 0);

    return {
      totalPicks: inCurrent.length,
      totalPicksDelta: pctDelta(inCurrent.length, inPrevious.length),
      winRate: currentWr,
      winRateDelta:
        previousSettled.length === 0 && currentSettled.length === 0
          ? null
          : Number((currentWr - previousWr).toFixed(1)),
      profit: Number(currentProfit.toFixed(1)),
      profitDelta: pctDelta(currentProfit, previousProfit),
      subscribers: activeSubscribers,
      subscribersDelta: null as number | null,
    };
  }, [enriched, dateRange, activeSubscribers, useDemo]);

  const guardDemoAction = (id?: string): boolean => {
    if (useDemo || (id && isCreatorPicksDemoId(id))) {
      toast.message('Sample preview data', {
        description: 'Publish a real pick to edit, settle, or delete live rows. Add ?demo=0 to hide samples.',
      });
      return true;
    }
    return false;
  };

  const resetForm = () => {
    setEditId(null);
    setTitle('');
    setSport('');
    setEvent('');
    setPick('');
    setUsOdds('');
    setEuOdds('');
    setUnits('1');
    setTags('');
    setNotes('');
    setIsPremium(true);
    setOddsSource(null);
    setDetailsOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setMode('create');
  };

  const openEdit = (post: Post) => {
    if (guardDemoAction(post.id)) return;
    resetForm();
    const parsed = parsePostContent(post.content);
    setEditId(post.id);
    setTitle(post.title);
    setSport(parsed.sport);
    setEvent(parsed.event);
    setPick(parsed.pick);
    setUsOdds(parsed.usOdds);
    setEuOdds(parsed.euOdds);
    setUnits(parsed.units);
    setTags(parsed.tags);
    setNotes(parsed.notes);
    setIsPremium(post.is_premium);
    setDetailsOpen(
      Boolean(
        parsed.sport ||
          parsed.event ||
          parsed.pick ||
          parsed.usOdds ||
          parsed.euOdds ||
          parsed.tags ||
          (parsed.units && parsed.units !== '1'),
      ),
    );
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
    if (pick) parts.push(`Pick: ${pick}`);
    if (usOdds || euOdds) {
      parts.push(
        `Odds: ${usOdds ? `${usOdds} (US)` : ''} ${euOdds ? `${euOdds} (EU)` : ''}`.trim(),
      );
    }
    if (units) parts.push(`Units: ${units}u`);
    if (tags.trim()) parts.push(`Tags: ${tags.trim()}`);
    if (notes) parts.push(`\n${notes}`);
    return parts.join('\n');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!notes.trim()) {
      toast.error('Post content is required');
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
    if (!deleteId || guardDemoAction(deleteId)) return;
    setDeleting(true);
    try {
      await removePost({ postId: deleteId as Id<'posts'> });
      toast.success('Pick deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete pick');
    } finally {
      setDeleting(false);
    }
  };

  const handleResultChange = async (postId: string, newResult: string) => {
    if (guardDemoAction(postId)) return;
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

  const handleImportFile = async (file: File) => {
    if (guardDemoAction()) return;
    if (!creatorId) {
      toast.error('Creator profile not ready');
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        toast.error('File is empty');
        return;
      }
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('title');
      const rows = hasHeader ? lines.slice(1) : lines;
      let imported = 0;
      for (const row of rows.slice(0, 50)) {
        const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const rowTitle = cols[0];
        if (!rowTitle) continue;
        const rowContent = cols[1] || rowTitle;
        await upsertPost({
          creatorId,
          title: rowTitle.slice(0, 200),
          content: rowContent,
          isPremium: true,
        });
        imported += 1;
      }
      toast.success(`Imported ${imported} pick${imported === 1 ? '' : 's'}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  const deleteDialog = (
    <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <AlertDialogContent
        overlayClassName="bg-black/50"
        className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)] sm:rounded-2xl"
      >
        <AlertDialogHeader className="space-y-3 px-5 pb-2 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                kpiIconTone.rose,
              )}
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Picks
              </p>
              <AlertDialogTitle className="mt-1 text-heading font-bold tracking-tight">
                Delete this pick?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-support text-muted-foreground">
                This permanently removes the pick. Settled history on this pick will be gone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:space-x-0 sm:gap-2 sm:px-6">
          <AlertDialogCancel disabled={deleting} className="mt-0 min-h-11 rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            className="min-h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

  const successDialog = (
    <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
      <DialogContent
        overlayClassName="bg-black/50"
        className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)] sm:max-w-sm sm:rounded-2xl"
      >
        <DialogHeader className="space-y-3 px-5 pb-2 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                kpiIconTone.emerald,
              )}
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Picks
              </p>
              <DialogTitle className="mt-1 text-heading font-bold tracking-tight">
                Pick posted successfully
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-support text-muted-foreground">
                Your pick is now live for subscribers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-col sm:space-x-0 sm:gap-2 sm:px-6">
          <Button
            onClick={() => {
              setShowSuccess(false);
              resetForm();
            }}
            className="min-h-11 w-full rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Another
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowSuccess(false);
              setMode('list');
            }}
            className="min-h-11 w-full rounded-xl"
          >
            Back to picks <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // CREATE MODE — matches Create Pick mockup
  if (mode === 'create') {
    const primaryCta = editId ? 'Save changes' : 'Publish Pick';
    const canPublish = Boolean(title.trim() && notes.trim());

    return (
      <DashboardLayout type="creator">
        <div className="mx-auto w-full max-w-2xl pb-8">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="mb-4 text-support text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to picks
          </button>
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Picks
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            {editId ? 'Edit Pick' : 'Create Pick'}
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Share your analysis and optional odds so subscribers know exactly what to play.
          </p>

          <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
            <div className="space-y-2">
              <Label htmlFor="pick-title" className="text-support font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pick-title"
                placeholder="e.g. Lakers ML tonight 🔥"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-xl border-border bg-background text-ui"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pick-post" className="text-support font-medium text-foreground">
                Post <span className="text-destructive">*</span>
              </Label>
              <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring/40">
                <Textarea
                  id="pick-post"
                  placeholder="Write your post here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, POST_MAX))}
                  rows={7}
                  className="min-h-[10rem] resize-none border-0 bg-transparent text-ui shadow-none focus-visible:ring-0"
                />
                <div className="flex justify-end border-t border-border px-3 py-1.5">
                  <span className="text-caption tabular-nums text-muted-foreground">
                    {notes.length}/{POST_MAX}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3.5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <Crown className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-ui font-medium text-foreground">Premium (subscribers only)</p>
                  <p className="text-caption text-muted-foreground">
                    Only paying subscribers can see this pick.
                  </p>
                </div>
              </div>
              <Switch
                aria-label="Premium only"
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                  detailsOpen
                    ? 'border-border bg-card'
                    : 'border-primary/20 bg-primary/5 hover:bg-primary/10',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    detailsOpen
                      ? 'bg-primary/15 text-primary'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {detailsOpen ? (
                    <BarChart3 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-ui font-medium text-foreground">
                  {detailsOpen
                    ? 'Pick details (optional)'
                    : hasPickDetails
                      ? 'Edit pick details (optional)'
                      : 'Add pick details (optional)'}
                </span>
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {!detailsOpen && (
                <p className="px-1 text-caption text-muted-foreground">
                  Add sport, match, odds, units and more if this is a betting pick.
                </p>
              )}

              {detailsOpen && (
                <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4 sm:p-5">
                  <div className="space-y-2">
                    <Label className="text-support text-muted-foreground">Sport</Label>
                    <Select value={sport || undefined} onValueChange={setSport}>
                      <SelectTrigger className="h-11 rounded-xl text-ui">
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
                    <Label htmlFor="pick-event" className="text-support text-muted-foreground">
                      Event
                    </Label>
                    <Input
                      id="pick-event"
                      placeholder="e.g. Lakers vs Warriors"
                      value={event}
                      onChange={(e) => setEvent(e.target.value)}
                      className="h-11 rounded-xl text-ui"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pick-selection" className="text-support text-muted-foreground">
                      Pick
                    </Label>
                    <Input
                      id="pick-selection"
                      placeholder="e.g. Lakers ML"
                      value={pick}
                      onChange={(e) => setPick(e.target.value)}
                      className="h-11 rounded-xl text-ui"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pick-us-odds" className="text-support text-muted-foreground">
                        Odds (US) <span className="font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="pick-us-odds"
                        placeholder="-120"
                        value={usOdds}
                        onChange={(e) => handleUsOddsChange(e.target.value)}
                        className={cn(
                          'h-11 rounded-xl text-ui',
                          oddsSource === 'eu' && 'text-muted-foreground',
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pick-eu-odds" className="text-support text-muted-foreground">
                        Odds (EU) <span className="font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="pick-eu-odds"
                        placeholder="1.83"
                        value={euOdds}
                        onChange={(e) => handleEuOddsChange(e.target.value)}
                        className={cn(
                          'h-11 rounded-xl text-ui',
                          oddsSource === 'us' && 'text-muted-foreground',
                        )}
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
                      Units <span className="font-normal">(optional)</span>
                    </Label>
                    <div className="flex h-11 max-w-xs items-center overflow-hidden rounded-xl border border-input bg-background">
                      <Input
                        id="pick-units"
                        type="number"
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                        className="h-full w-20 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        min="0.5"
                        max="100"
                        step="0.5"
                      />
                      <span className="border-l border-border px-3 text-support text-muted-foreground">
                        units risked
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pick-tags" className="text-support text-muted-foreground">
                      Add tags <span className="font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="pick-tags"
                        placeholder="e.g. value, high confidence, live, etc."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="h-11 rounded-xl ps-10 text-ui"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !canPublish}
              className="h-12 w-full rounded-xl text-ui font-semibold"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {primaryCta}
            </Button>
          </div>
        </div>
        {successDialog}
        {deleteDialog}
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const showingFrom = filtered.length === 0 ? 0 : safePage * TABLE_PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, (safePage + 1) * TABLE_PAGE_SIZE);

  const metricItems = [
    {
      label: 'Total Picks',
      value: String(metrics.totalPicks),
      icon: Target,
      iconClassName: kpiIconTone.violet,
      trendLabel: formatSignedPct(metrics.totalPicksDelta),
      trendPositive: (metrics.totalPicksDelta ?? 0) > 0,
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate}%`,
      icon: Trophy,
      iconClassName: kpiIconTone.sky,
      trendLabel: formatSignedPct(metrics.winRateDelta, ' pts'),
      trendPositive: (metrics.winRateDelta ?? 0) > 0,
    },
    {
      label: 'Total Profit (Units)',
      value: `${metrics.profit >= 0 ? '+' : ''}${metrics.profit}u`,
      icon: BarChart3,
      iconClassName: kpiIconTone.emerald,
      trendLabel: formatSignedPct(metrics.profitDelta),
      trendPositive: (metrics.profitDelta ?? 0) > 0,
    },
    {
      label: 'Active Subscribers',
      value: String(metrics.subscribers),
      icon: Users,
      iconClassName: kpiIconTone.amber,
      trendLabel: formatSignedPct(metrics.subscribersDelta),
      trendPositive: (metrics.subscribersDelta ?? 0) > 0,
      href: '/creator/subscribers',
    },
  ];

  const pageNumbers = (() => {
    const total = tablePageCount;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: Array<number | 'ellipsis'> = [0];
    const start = Math.max(1, safePage - 1);
    const end = Math.min(total - 2, safePage + 1);
    if (start > 1) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 2) pages.push('ellipsis');
    pages.push(total - 1);
    return pages;
  })();

  return (
    <DashboardLayout type="creator">
      <input
        ref={importRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
        }}
      />

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Picks
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Your Picks
          </h1>
          <p className="mt-1.5 max-w-xl text-support text-muted-foreground">
            Create, manage and track your picks. Keep your subscribers informed.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-xl"
            disabled={importing || (!useDemo && !creatorId)}
            onClick={() => {
              if (guardDemoAction()) return;
              importRef.current?.click();
            }}
          >
            {importing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            Import Picks
          </Button>
          <Button type="button" onClick={openCreate} className="min-h-11 rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" /> New Pick
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — metrics and table rows are mock content so you can review the layout.
            Publish a real pick to replace them, or add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see the empty state.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip items={metricItems} />
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/creator/performance-tracker"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
        >
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kpiIconTone.sky)}>
            <BarChart3 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-foreground">Performance</h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Track win rate, units, and streak trends across your settled picks.
            </p>
          </div>
        </Link>
        <Link
          to="/creator/subscribers"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
        >
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kpiIconTone.amber)}>
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-foreground">Subscribers</h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage who sees your premium picks and grow your paying audience.
            </p>
          </div>
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">All picks</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={sportFilter}
                onValueChange={(v) => {
                  setSportFilter(v);
                  setTablePage(0);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl sm:w-[140px]">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sportsInData.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={dateRange}
                onValueChange={(v) => {
                  setDateRange(v as DateRangeKey);
                  setTablePage(0);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchPicks}
                  onChange={(e) => {
                    setSearchPicks(e.target.value);
                    setTablePage(0);
                  }}
                  placeholder="Search picks..."
                  className="h-11 rounded-xl ps-9"
                />
              </div>
            </div>
          </div>

          <div className={cn(segmentedTrackClassName, 'w-full overflow-x-auto')}>
            {RESULT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={segmentedItemClassName(resultTab === tab.id)}
                onClick={() => {
                  setResultTab(tab.id);
                  setTablePage(0);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="mb-1 text-title font-semibold text-foreground">
              {enriched.length === 0 ? 'No picks yet' : 'No picks match these filters'}
            </h3>
            <p className="mx-auto mb-5 max-w-sm text-support text-muted-foreground">
              {enriched.length === 0
                ? "Share your first insight with subscribers — add optional sport, odds, and units when it's a betting pick."
                : 'Try another tab, sport, or date range.'}
            </p>
            {enriched.length === 0 ? (
              <Button onClick={openCreate} className="min-h-11">
                <Plus className="mr-1.5 h-4 w-4" /> Create Pick
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="hidden sm:table-cell">Odds</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="hidden md:table-cell">Profit (u)</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                  const oddsDisplay = row.euOdds || (row.usOdds ? americanToDecimal(row.usOdds) : null);
                  const isWin = row.result === 'won';
                  const isLoss = row.result === 'lost';
                  const isPending = row.result === 'pending' || row.result === 'push';
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-support text-muted-foreground">
                        {format(new Date(row.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <MatchCell event={row.event} sport={row.sport} pick={row.pick} />
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-support sm:table-cell">
                        {oddsDisplay ?? '—'}
                      </TableCell>
                      <TableCell>
                        {isWin ? (
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                              resultPillTone.win,
                            )}
                          >
                            Win
                          </span>
                        ) : isLoss ? (
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                              resultPillTone.loss,
                            )}
                          >
                            Loss
                          </span>
                        ) : row.result === 'push' ? (
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                              resultPillTone.push,
                            )}
                          >
                            Push
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold',
                              resultPillTone.pending,
                            )}
                          >
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'hidden tabular-nums font-bold md:table-cell',
                          isWin && 'text-emerald-600 dark:text-emerald-400',
                          isLoss && 'text-rose-600 dark:text-rose-400',
                          isPending && 'text-muted-foreground',
                        )}
                      >
                        {row.result === 'pending'
                          ? '—'
                          : `${row.profit >= 0 ? '+' : ''}${row.profit.toFixed(2)}u`}
                      </TableCell>
                      <TableCell>
                        {row.is_premium ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold',
                              'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                            )}
                          >
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-bold text-muted-foreground">
                            Free
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              aria-label="Pick actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(row)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {row.result === 'pending' ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => void handleResultChange(row.id, 'won')}
                                >
                                  <Trophy className="mr-2 h-4 w-4 text-emerald-500" /> Mark won
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleResultChange(row.id, 'lost')}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" /> Mark lost
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleResultChange(row.id, 'push')}
                                >
                                  <Minus className="mr-2 h-4 w-4" /> Mark push
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            ) : null}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(row.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-support text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {filtered.length} picks
                {!useDemo && (postsStatus === 'CanLoadMore' || postsStatus === 'LoadingMore')
                  ? ' (load more for older picks)'
                  : ''}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={safePage === 0}
                  onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbers.map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      type="button"
                      variant={item === safePage ? 'default' : 'outline'}
                      className="h-9 min-w-9 px-2"
                      onClick={() => setTablePage(item)}
                    >
                      {item + 1}
                    </Button>
                  ),
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={safePage >= tablePageCount - 1}
                  onClick={() => setTablePage((p) => Math.min(tablePageCount - 1, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {(postsStatus === 'CanLoadMore' || postsStatus === 'LoadingMore') && !useDemo && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-1 min-h-9"
                    disabled={postsStatus === 'LoadingMore'}
                    onClick={() => loadMore(PAGE_SIZE)}
                  >
                    {postsStatus === 'LoadingMore' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
      {deleteDialog}
    </DashboardLayout>
  );
};

export default CreatorPosts;
