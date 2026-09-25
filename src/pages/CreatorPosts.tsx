import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CheckCircle2, Clock, Trophy, XCircle, Minus, Crown, Send, ChevronDown, ChevronUp,
  Search, Tag, MoreVertical, ChevronLeft, ChevronRight,
  Play, ArrowRight, BarChart3, BadgeCheck, Info, Eye, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { americanToDecimal, decimalToAmerican, profitUnits } from '@/lib/odds';
import { parsePostContent } from '@/lib/postContent';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import {
  CREATOR_PICKS_DEMO_METRICS,
  CREATOR_PICKS_DEMO_ROWS,
  isCreatorPicksDemoId,
  shouldUseCreatorPicksDemo,
} from '@/lib/creatorPicksDemo';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { Checkbox } from '@/components/ui/checkbox';

const PAGE_SIZE = 50;
const TABLE_PAGE_SIZE = 10;
const POST_MAX = 2000;

type StatusTab = 'all' | 'published' | 'scheduled' | 'draft' | 'archived';
type PostUiStatus = 'published' | 'scheduled' | 'draft' | 'archived';
type PostType = 'Text' | 'Video';
type SortKey = 'newest' | 'oldest';

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
  uiStatus: PostUiStatus;
  postType: PostType;
  excerpt: string;
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

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'draft', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
];

const statusPillClass: Record<PostUiStatus, string> = {
  published: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  scheduled: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  draft: 'border-border bg-muted text-muted-foreground',
  archived: 'border-border bg-muted/70 text-foreground/70',
};

const statusLabel: Record<PostUiStatus, string> = {
  published: 'Published',
  scheduled: 'Scheduled',
  draft: 'Draft',
  archived: 'Archived',
};

function resolveUiStatus(trackingMode: string): PostUiStatus {
  const mode = trackingMode.trim().toLowerCase();
  if (mode === 'scheduled') return 'scheduled';
  if (mode === 'draft' || mode === 'drafts') return 'draft';
  if (mode === 'archived' || mode === 'archive') return 'archived';
  return 'published';
}

function detectPostType(content: string | null, title: string): PostType {
  const blob = `${title}\n${content ?? ''}`.toLowerCase();
  if (/\btype:\s*video\b/.test(blob)) return 'Video';
  return 'Text';
}

function excerptFromContent(content: string | null, fallback: string): string {
  if (!content) return fallback;
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^(sport|event|pick|odds|units|type):/i.test(l),
    );
  const body = lines.join(' ').trim();
  if (!body) return fallback;
  return body.length > 72 ? `${body.slice(0, 72)}…` : body;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function formatSignedPct(value: number | null, suffix = '%'): string | undefined {
  if (value === null) return undefined;
  const sign = value > 0 ? '+' : value < 0 ? '' : '+';
  return `${sign}${value}${suffix} vs. last month`;
}

function enrichPost(post: Post): EnrichedPick {
  const parsed = parsePostContent(post.content);
  const units = Number.parseFloat(parsed.units) || 1;
  const result = (['won', 'lost', 'push', 'pending'].includes(post.result)
    ? post.result
    : 'pending') as 'won' | 'lost' | 'push' | 'pending';
  const profit = profitUnits(result, units, parsed.usOdds || '-110');
  const uiStatus = resolveUiStatus(post.tracking_mode);
  return {
    ...post,
    sport: parsed.sport,
    event: parsed.event || post.title,
    pick: parsed.pick || post.title,
    usOdds: parsed.usOdds,
    euOdds: parsed.euOdds,
    units,
    profit,
    isScheduled: uiStatus === 'scheduled',
    uiStatus,
    postType: detectPostType(post.content, post.title),
    excerpt: excerptFromContent(post.content, parsed.pick || 'No description'),
  };
}

/** Split free-form notes into intro / numbered picks / outro for a clean subscriber preview. */
function splitPreviewBody(notes: string): {
  intro: string;
  items: string[];
  outro: string;
} {
  const lines = notes
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const items: string[] = [];
  const before: string[] = [];
  const after: string[] = [];
  let inList = false;
  let pastList = false;
  for (const line of lines) {
    const numbered = /^\d+[.)]\s*(.+)$/.exec(line);
    if (numbered) {
      inList = true;
      pastList = false;
      items.push(numbered[1]!.trim());
      continue;
    }
    if (inList) {
      pastList = true;
      inList = false;
    }
    if (pastList) after.push(line);
    else before.push(line);
  }
  return {
    intro: before.join(' '),
    items,
    outro: after.join(' '),
  };
}

const PREVIEW_MEDIA_URL =
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=675&fit=crop';

function previewBannerCopy(status: PostUiStatus): string {
  if (status === 'published') {
    return 'This is a preview of your published post. Only subscribers with access to this content can see it.';
  }
  if (status === 'scheduled') {
    return 'This is a preview of your scheduled post. It will appear for subscribers when it goes live.';
  }
  if (status === 'draft') {
    return 'This is a preview of your draft. Subscribers cannot see it until you publish.';
  }
  return 'This is a preview of an archived post. It is no longer visible to new subscribers.';
}

const CreatorPosts = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const queryFromUrl = searchParams.get('q') ?? '';

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

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [searchPicks, setSearchPicks] = useState(queryFromUrl);
  const [tablePage, setTablePage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewPost, setPreviewPost] = useState<EnrichedPick | null>(null);

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

  const hasPickDetails = Boolean(
    sport || event || pick || usOdds || euOdds || (units && units !== '1') || tags,
  );

  const categoriesInData = useMemo(() => {
    const set = new Set<string>();
    for (const p of enriched) {
      if (p.sport) set.add(p.sport);
    }
    return Array.from(set).sort();
  }, [enriched]);

  const statusCounts = useMemo(() => {
    const counts = { all: enriched.length, published: 0, scheduled: 0, draft: 0, archived: 0 };
    for (const p of enriched) {
      counts[p.uiStatus] += 1;
    }
    return counts;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = searchPicks.trim().toLowerCase();
    const rows = enriched.filter((p) => {
      if (statusTab !== 'all' && p.uiStatus !== statusTab) return false;
      if (typeFilter !== 'all' && p.postType !== typeFilter) return false;
      if (categoryFilter !== 'all' && p.sport !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.event.toLowerCase().includes(q) ||
        p.pick.toLowerCase().includes(q) ||
        p.sport.toLowerCase().includes(q)
      );
    });
    rows.sort((a, b) =>
      sortKey === 'newest' ? b.createdAtMs - a.createdAtMs : a.createdAtMs - b.createdAtMs,
    );
    return rows;
  }, [enriched, statusTab, typeFilter, categoryFilter, searchPicks, sortKey]);

  const tablePageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(tablePage, tablePageCount - 1);
  const pageRows = filtered.slice(
    safePage * TABLE_PAGE_SIZE,
    safePage * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE,
  );

  const pageAllSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  const toggleSelectAllPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of pageRows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const metrics = useMemo(() => {
    if (useDemo) {
      return {
        published: CREATOR_PICKS_DEMO_METRICS.published,
        publishedDelta: CREATOR_PICKS_DEMO_METRICS.publishedDelta,
        scheduled: CREATOR_PICKS_DEMO_METRICS.scheduled,
        scheduledDelta: CREATOR_PICKS_DEMO_METRICS.scheduledDelta,
        drafts: CREATOR_PICKS_DEMO_METRICS.drafts,
        draftsDelta: CREATOR_PICKS_DEMO_METRICS.draftsDelta,
      };
    }

    const now = Date.now();
    const windowMs = 30 * 86400000;
    const currentStart = now - windowMs;
    const previousStart = currentStart - windowMs;

    const countStatus = (rows: EnrichedPick[], status: PostUiStatus) =>
      rows.filter((p) => p.uiStatus === status).length;

    const inCurrent = enriched.filter((p) => p.createdAtMs >= currentStart);
    const inPrevious = enriched.filter(
      (p) => p.createdAtMs >= previousStart && p.createdAtMs < currentStart,
    );

    return {
      published: statusCounts.published,
      publishedDelta: pctDelta(countStatus(inCurrent, 'published'), countStatus(inPrevious, 'published')),
      scheduled: statusCounts.scheduled,
      scheduledDelta: pctDelta(countStatus(inCurrent, 'scheduled'), countStatus(inPrevious, 'scheduled')),
      drafts: statusCounts.draft,
      draftsDelta: pctDelta(countStatus(inCurrent, 'draft'), countStatus(inPrevious, 'draft')),
    };
  }, [enriched, statusCounts, useDemo]);

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
                Posts
              </p>
              <AlertDialogTitle className="mt-1 text-heading font-bold tracking-tight">
                Delete this post?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-support text-muted-foreground">
                This permanently removes the post. Settled history on this post will be gone.
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
                Posts
              </p>
              <DialogTitle className="mt-1 text-heading font-bold tracking-tight">
                Post published successfully
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-support text-muted-foreground">
                Your post is now live for subscribers.
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
            Back to posts <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // CREATE MODE
  if (mode === 'create') {
    const primaryCta = editId ? 'Save changes' : 'Publish Post';
    const canPublish = Boolean(title.trim() && notes.trim());

    return (
      <DashboardLayout type="creator">
        <div className="mx-auto w-full max-w-2xl pb-8">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="mb-4 text-support text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to posts
          </button>
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Posts
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            {editId ? 'Edit Post' : 'Create Post'}
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
      label: 'Published posts',
      value: String(metrics.published),
      icon: FileText,
      iconClassName: kpiIconTone.emerald,
      trendLabel: formatSignedPct(metrics.publishedDelta),
      trendPositive: (metrics.publishedDelta ?? 0) > 0,
    },
    {
      label: 'Scheduled posts',
      value: String(metrics.scheduled),
      icon: Clock,
      iconClassName: kpiIconTone.violet,
      trendLabel: formatSignedPct(metrics.scheduledDelta),
      trendPositive: (metrics.scheduledDelta ?? 0) > 0,
    },
    {
      label: 'Drafts',
      value: String(metrics.drafts),
      icon: FileText,
      iconClassName: kpiIconTone.sky,
      trendLabel: formatSignedPct(metrics.draftsDelta),
      trendPositive: (metrics.draftsDelta ?? 0) > 0,
    },
  ];

  const pageNumbers = (() => {
    const total = tablePageCount;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: Array<number | 'ellipsis'> = [0];
    const startPage = Math.max(1, safePage - 1);
    const endPage = Math.min(total - 2, safePage + 1);
    if (startPage > 1) pages.push('ellipsis');
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < total - 2) pages.push('ellipsis');
    pages.push(total - 1);
    return pages;
  })();

  const tabCount = (id: StatusTab): number => {
    if (useDemo && id === 'all') return CREATOR_PICKS_DEMO_METRICS.totalPosts;
    if (useDemo && id === 'published') return CREATOR_PICKS_DEMO_METRICS.published;
    if (useDemo && id === 'scheduled') return CREATOR_PICKS_DEMO_METRICS.scheduled;
    if (useDemo && id === 'draft') return CREATOR_PICKS_DEMO_METRICS.drafts;
    if (useDemo && id === 'archived') return CREATOR_PICKS_DEMO_METRICS.archived;
    return statusCounts[id];
  };

  return (
    <DashboardLayout type="creator">
      <div
        className={cn(
          'flex flex-col gap-6',
          previewPost && 'xl:flex-row xl:items-start xl:gap-6',
        )}
      >
        <div className="min-w-0 flex-1">
      <header className="mb-7 flex flex-col gap-5 sm:mb-9 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h1 className="type-page-title text-foreground md:text-[2.75rem] md:leading-[1.1]">
            Posts
          </h1>
          <p className="mt-3 max-w-2xl text-body font-medium text-muted-foreground">
            Manage your content and engage your audience.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="h-12 w-full shrink-0 gap-2 rounded-[var(--radius-md)] px-6 sm:mt-1 sm:w-auto"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Create Post
        </Button>
      </header>

      <div className={cn(segmentedTrackClassName, 'mb-5 flex w-full flex-nowrap')}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(segmentedItemClassName(statusTab === tab.id), 'flex-1')}
            onClick={() => {
              setStatusTab(tab.id);
              setTablePage(0);
            }}
          >
            {tab.label} ({tabCount(tab.id)})
          </button>
        ))}
      </div>

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip items={metricItems} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchPicks}
              onChange={(e) => {
                setSearchPicks(e.target.value);
                setTablePage(0);
              }}
              placeholder="Search posts..."
              className="h-11 rounded-xl ps-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setTablePage(0);
            }}
          >
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-[140px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Text">Text</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setTablePage(0);
            }}
          >
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-[160px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoriesInData.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortKey}
            onValueChange={(v) => {
              setSortKey(v as SortKey);
              setTablePage(0);
            }}
          >
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="mb-1 text-title font-semibold text-foreground">
              {enriched.length === 0 ? 'No posts yet' : 'No posts match these filters'}
            </h3>
            <p className="mx-auto mb-5 max-w-sm text-support text-muted-foreground">
              {enriched.length === 0
                ? 'Create your first post to engage your audience.'
                : 'Try another tab, type, or category.'}
            </p>
            {enriched.length === 0 ? (
              <Button onClick={openCreate} className="min-h-11">
                <Plus className="mr-1.5 h-4 w-4" /> Create Post
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={pageAllSelected}
                      onCheckedChange={(v) => toggleSelectAllPage(v === true)}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'cursor-pointer',
                      previewPost?.id === row.id && 'bg-muted/60',
                    )}
                    onClick={() => setPreviewPost(row)}
                    data-state={previewPost?.id === row.id ? 'selected' : undefined}
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={(v) => toggleSelectOne(row.id, v === true)}
                        aria-label={`Select ${row.title}`}
                      />
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{row.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.excerpt}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        {row.postType === 'Video' ? (
                          <Play className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        )}
                        {row.postType}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                      {format(new Date(row.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                          statusPillClass[row.uiStatus],
                        )}
                      >
                        {statusLabel[row.uiStatus]}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="hidden h-9 gap-1.5 px-3 sm:inline-flex"
                          onClick={() => setPreviewPost(row)}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Preview
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              aria-label="Post actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewPost(row)}>
                              <Eye className="mr-2 h-4 w-4" /> Preview
                            </DropdownMenuItem>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {filtered.length} posts
                {!useDemo && (postsStatus === 'CanLoadMore' || postsStatus === 'LoadingMore')
                  ? ' (load more for older posts)'
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
                  onClick={() => {
                    if (safePage >= tablePageCount - 1) return;
                    setTablePage((p) => Math.min(tablePageCount - 1, p + 1));
                    if (!useDemo && postsStatus === 'CanLoadMore') loadMore(PAGE_SIZE);
                  }}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
        </div>

        {previewPost ? (
          (() => {
            const displayName =
              creator?.displayName?.trim() ||
              creator?.username ||
              (useDemo ? 'AlexPicks' : 'You');
            const initials = displayName
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const avatarUrl = creator?.avatarUrl ?? null;
            const verified = useDemo || creator?.verificationStatus === 'verified';
            const parsed = parsePostContent(previewPost.content);
            const { intro, items, outro } = splitPreviewBody(parsed.notes);
            const fallbackLine = [
              previewPost.pick,
              previewPost.usOdds && `(${previewPost.usOdds})`,
              `${previewPost.units} unit`,
            ]
              .filter(Boolean)
              .join(' — ');
            const whenLabel = formatDistanceToNowStrict(new Date(previewPost.created_at), {
              addSuffix: true,
            });

            return (
              <aside
                className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] xl:sticky xl:top-6 xl:w-[min(100%,420px)] xl:max-h-[calc(100dvh-6rem)]"
                aria-label="Post preview"
              >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Post Preview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      This is how your subscribers see your post.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    aria-label="Close preview"
                    onClick={() => setPreviewPost(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
                  <article className="rounded-2xl border border-border bg-background p-5">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
                          aria-hidden
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-foreground">
                            {displayName}
                          </span>
                          {verified ? (
                            <BadgeCheck
                              className="h-4 w-4 shrink-0 text-primary"
                              aria-label="Verified"
                            />
                          ) : null}
                          <span className="text-xs text-muted-foreground">{whenLabel}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {previewPost.is_premium ? (
                          <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                            Premium
                          </span>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          aria-label="Post options"
                          onClick={() =>
                            toast.message('Post options', {
                              description:
                                'Subscriber menu actions are not available in preview.',
                            })
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="mt-4 text-lg font-extrabold leading-snug tracking-tight text-foreground">
                      {previewPost.title}
                    </h3>

                    {intro || items.length > 0 || outro ? (
                      <div className="mt-2.5 space-y-3 text-sm leading-relaxed text-foreground/90">
                        {intro ? <p>{intro}</p> : null}
                        {items.length > 0 ? (
                          <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-foreground">
                            {items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ol>
                        ) : null}
                        {outro ? <p>{outro}</p> : null}
                      </div>
                    ) : (
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                        {fallbackLine}
                      </p>
                    )}

                    <div
                      className={cn(
                        'relative mt-4 overflow-hidden rounded-xl border border-border bg-muted',
                        previewPost.postType === 'Video' && 'cursor-pointer',
                      )}
                      role={previewPost.postType === 'Video' ? 'button' : undefined}
                      tabIndex={previewPost.postType === 'Video' ? 0 : undefined}
                      onClick={
                        previewPost.postType === 'Video'
                          ? () =>
                              toast.message('Video', {
                                description: useDemo
                                  ? 'Sample preview — video playback is not live.'
                                  : 'Video player opens when media posts ship.',
                              })
                          : undefined
                      }
                      onKeyDown={
                        previewPost.postType === 'Video'
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toast.message('Video', {
                                  description: useDemo
                                    ? 'Sample preview — video playback is not live.'
                                    : 'Video player opens when media posts ship.',
                                });
                              }
                            }
                          : undefined
                      }
                      aria-label={
                        previewPost.postType === 'Video' ? 'Play video preview' : undefined
                      }
                    >
                      <img
                        src={PREVIEW_MEDIA_URL}
                        alt=""
                        className="aspect-[16/10] w-full object-cover"
                      />
                      {previewPost.postType === 'Video' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md">
                            <Play className="h-5 w-5 fill-current" aria-hidden />
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </article>

                  <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-3 text-sm leading-snug text-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <p>{previewBannerCopy(previewPost.uiStatus)}</p>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end border-t border-border px-5 py-4 sm:px-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-6"
                    onClick={() => setPreviewPost(null)}
                  >
                    Close
                  </Button>
                </div>
              </aside>
            );
          })()
        ) : null}
      </div>

      {deleteDialog}
    </DashboardLayout>
  );
};

export default CreatorPosts;
