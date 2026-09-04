import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MobileTopBar } from '@/components/dashboard/MobileTopBar';
import DemoRoleSwitcher from '@/components/demo/DemoRoleSwitcher';
import {
  useDemoCreatorStore, usToDecimal, unitsFor, defaultSettings,
  type DemoStore, type DemoPost, type PickResult, type DemoProduct, type DemoSubscriber,
} from '@/components/demo/demoCreatorStore';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Users, DollarSign, FileText, Plus, TrendingUp, Package, Clock, Trash2,
  LayoutGrid, PenLine, FileStack, Settings, LogOut, Megaphone, MessageSquare,
  Eye, Percent, Send, RotateCcw, Check, Download, Search, AlertTriangle,
} from 'lucide-react';

type TabKey =
  | 'overview' | 'create' | 'content' | 'products'
  | 'subscribers' | 'promotions' | 'messages' | 'earnings' | 'settings';

const sidebarItems: { label: string; tab: TabKey; icon: typeof LayoutGrid }[] = [
  { label: 'Overview', tab: 'overview', icon: LayoutGrid },
  { label: 'Create Post', tab: 'create', icon: PenLine },
  { label: 'Content', tab: 'content', icon: FileStack },
  { label: 'Products', tab: 'products', icon: Package },
  { label: 'Subscribers', tab: 'subscribers', icon: Users },
  { label: 'Promotions', tab: 'promotions', icon: Megaphone },
  { label: 'Messages', tab: 'messages', icon: MessageSquare },
  { label: 'Earnings', tab: 'earnings', icon: DollarSign },
  { label: 'Settings', tab: 'settings', icon: Settings },
];

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const resultStyles: Record<PickResult, string> = {
  pending: 'bg-muted text-muted-foreground',
  won: 'bg-emerald-500/10 text-emerald-500',
  lost: 'bg-destructive/10 text-destructive',
  push: 'bg-amber-500/10 text-amber-500',
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</div>;
}

function Stat({ label, value, icon: Icon, hint }: { label: string; value: string; icon: typeof Users; hint?: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>}
    </Card>
  );
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- Overview -------------------------------- */

function Overview({ store, go }: { store: DemoStore; go: (t: TabKey) => void }) {
  const { metrics, state } = store;
  const onIntro = metrics.introDaysLeft > 0;
  const pending = state.posts.filter(p => p.result === 'pending').length;
  return (
    <>
      {onIntro ? (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-6 flex items-start gap-3">
        <div className="rounded-lg p-2 bg-emerald-500/10"><Clock className="h-4 w-4 text-emerald-500" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Intro fee: {Math.round(metrics.feeRate * 100)}% for your first 30 days</p>
            <Badge variant="secondary" className="text-[10px] uppercase">Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{metrics.introDaysLeft} days remaining before the standard 10% rate applies</p>
          <div className="mt-2.5">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${((30 - metrics.introDaysLeft) / 30) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 mb-6 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><Percent className="h-4 w-4 text-muted-foreground" /></div>
          <p className="text-sm">Standard platform fee of {Math.round(metrics.feeRate * 100)}% applies — your intro period has ended.</p>
        </div>
      )}

      <SectionHeader
        title="Overview"
        description={`Welcome back, @${state.settings.username}`}
        action={<Button size="sm" onClick={() => go('create')}><Plus className="mr-1.5 h-3.5 w-3.5" /> New Post</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Active subscribers" value={String(metrics.activeSubscribers)} icon={Users} hint={`${metrics.churned} churned`} />
        <Stat label="Monthly recurring" value={money(metrics.mrr)} icon={DollarSign} hint={`${money(metrics.netEarnings)} after fees`} />
        <Stat label="Posts published" value={String(metrics.totalPosts)} icon={FileText} hint={`${metrics.premiumPosts} premium`} />
        <Stat label="Win rate" value={`${metrics.winRate}%`} icon={TrendingUp} hint={`${metrics.settledPicks} settled picks`} />
      </div>

      {(pending > 0 || metrics.unreadMessages > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {pending > 0 && (
            <button onClick={() => go('content')} className="text-left rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 hover:border-amber-500/50 transition-colors">
              <p className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> {pending} pick{pending > 1 ? 's' : ''} awaiting settlement</p>
              <p className="text-xs text-muted-foreground mt-1">Unsettled picks are excluded from your verified win rate.</p>
            </button>
          )}
          {metrics.unreadMessages > 0 && (
            <button onClick={() => go('messages')} className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <p className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> {metrics.unreadMessages} unread message{metrics.unreadMessages > 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Fast replies are the single biggest driver of retention.</p>
            </button>
          )}
        </div>
      )}

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {([
          { label: 'Create Post', icon: Plus, tab: 'create' as TabKey },
          { label: 'New Product', icon: Package, tab: 'products' as TabKey },
          { label: 'Promotions', icon: Megaphone, tab: 'promotions' as TabKey },
          { label: 'Earnings', icon: DollarSign, tab: 'earnings' as TabKey },
        ]).map(a => (
          <Button key={a.label} variant="outline" className="w-full h-auto py-4 flex-col gap-2" onClick={() => go(a.tab)}>
            <a.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent activity</h2>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => go('content')}>View all</Button>
      </div>
      <div className="space-y-2">
        {state.posts.slice(0, 4).map(post => (
          <div key={post.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                {post.isPremium ? 'Premium' : 'Free'} · {post.sport} · {format(new Date(post.createdAt), 'MMM d')}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${resultStyles[post.result]}`}>{post.result}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------ Create Post ------------------------------ */

function CreatePost({ store, go }: { store: DemoStore; go: (t: TabKey) => void }) {
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('NFL');
  const [event, setEvent] = useState('');
  const [usOdds, setUsOdds] = useState('-110');
  const [units, setUnits] = useState('1');
  const [content, setContent] = useState('');
  const [isPremium, setIsPremium] = useState(true);
  const decimal = usToDecimal(usOdds);

  const submit = () => {
    if (!title.trim()) return toast.error('Add a title so subscribers know what the pick is');
    if (!event.trim()) return toast.error('Add the matchup or event');
    if (decimal === null) return toast.error('Enter valid American odds, e.g. -110 or +150');
    const u = Number(units);
    if (Number.isNaN(u) || u <= 0 || u > 10) return toast.error('Units must be between 0.1 and 10');
    store.addPost({ title: title.trim(), content: content.trim(), sport, event: event.trim(), usOdds, units: u, isPremium });
    toast.success(isPremium ? 'Pick published to your premium subscribers' : 'Free pick published');
    setTitle(''); setEvent(''); setContent(''); setUnits('1'); setUsOdds('-110');
    go('content');
  };

  return (
    <>
      <SectionHeader title="Create Post" description="Structured picks convert better than plain text." />
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <Card className="space-y-4">
          <div>
            <Label className="text-xs">Title</Label>
            <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="NFL Week 15: my highest-conviction spread" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Sport</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={sport}
                onChange={e => setSport(e.target.value)}
              >
                {['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis', 'MMA'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Event / matchup</Label>
              <Input className="mt-1" value={event} onChange={e => setEvent(e.target.value)} placeholder="Chiefs vs Bills" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Odds (American)</Label>
              <Input className="mt-1" value={usOdds} onChange={e => setUsOdds(e.target.value)} placeholder="-110" />
              <p className="text-[11px] text-muted-foreground mt-1">
                {decimal ? `Decimal (EU): ${decimal.toFixed(2)}` : 'Enter -110 or +150 style odds'}
              </p>
            </div>
            <div>
              <Label className="text-xs">Units risked</Label>
              <Input className="mt-1" type="number" step="0.5" min="0.5" max="10" value={units} onChange={e => setUnits(e.target.value)} />
              <p className="text-[11px] text-muted-foreground mt-1">
                {decimal ? `Returns +${((decimal - 1) * (Number(units) || 0)).toFixed(2)}u on a win` : ' '}
              </p>
            </div>
          </div>
          <div>
            <Label className="text-xs">Analysis</Label>
            <Textarea className="mt-1 min-h-[120px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Why this play — line movement, injuries, model edge…" />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-sm font-medium mb-3">Visibility</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Premium only</p>
                <p className="text-[11px] text-muted-foreground">{isPremium ? 'Locked for non-subscribers' : 'Visible to everyone'}</p>
              </div>
              <Switch aria-label="Premium only" checked={isPremium} onCheckedChange={setIsPremium} />
            </div>
          </Card>
          <Card>
            <p className="text-sm font-medium mb-2">Preview</p>
            <p className="text-sm truncate">{title || 'Untitled pick'}</p>
            <p className="text-xs text-muted-foreground mt-1">{sport} · {event || 'No event'} · {usOdds} ({decimal?.toFixed(2) ?? '—'}) · {units}u</p>
          </Card>
          <Button className="w-full" onClick={submit}><Send className="mr-1.5 h-3.5 w-3.5" /> Publish</Button>
        </div>
      </div>
    </>
  );
}

/* -------------------------------- Content -------------------------------- */

function Content({ store }: { store: DemoStore }) {
  const [filter, setFilter] = useState<'all' | 'premium' | 'free' | 'pending'>('all');
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<DemoPost | null>(null);
  const all = store.state.posts;
  const counts = {
    all: all.length,
    premium: all.filter(p => p.isPremium).length,
    free: all.filter(p => !p.isPremium).length,
    pending: all.filter(p => p.result === 'pending').length,
  };
  const posts = all
    .filter(p => (filter === 'all' ? true : filter === 'premium' ? p.isPremium : filter === 'free' ? !p.isPremium : p.result === 'pending'))
    .filter(p => `${p.title} ${p.event} ${p.sport}`.toLowerCase().includes(query.trim().toLowerCase()));

  const settle = (post: DemoPost, result: PickResult) => {
    store.setPostResult(post.id, result);
    toast.success(`"${post.title.slice(0, 28)}…" marked ${result}`);
  };

  const exportCsv = () => {
    downloadCsv('creator-content.csv',
      ['Date', 'Title', 'Sport', 'Event', 'Odds', 'Units', 'Visibility', 'Result', 'Units P/L', 'Views', 'Saves'],
      posts.map(p => [
        format(new Date(p.createdAt), 'yyyy-MM-dd'), p.title, p.sport, p.event, p.usOdds, p.units,
        p.isPremium ? 'Premium' : 'Free', p.result, unitsFor(p), p.views, p.saves,
      ]));
    toast.success(`Exported ${posts.length} posts`);
  };

  return (
    <>
      <SectionHeader
        title="Content"
        description={`${counts.all} posts · ${counts.pending} awaiting settlement · settle picks to keep your win rate accurate`}
        action={<Button size="sm" variant="outline" onClick={exportCsv} disabled={posts.length === 0}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>}
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'premium', 'free', 'pending'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="capitalize text-xs" onClick={() => setFilter(f)}>
              {f} <span className="ml-1.5 opacity-60">{counts[f]}</span>
            </Button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title, event, sport" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        {posts.length === 0 && <Card><p className="text-sm text-muted-foreground">No posts match this filter.</p></Card>}
        {posts.map(post => (
          <Card key={post.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${resultStyles[post.result]}`}>{post.result}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {post.isPremium ? 'Premium' : 'Free'} · {post.sport} · {post.event} · {post.usOdds} ({usToDecimal(post.usOdds)?.toFixed(2) ?? '—'}) · {post.units}u ·{' '}
                  <span className={unitsFor(post) > 0 ? 'text-emerald-500' : unitsFor(post) < 0 ? 'text-destructive' : ''}>
                    {unitsFor(post) > 0 ? '+' : ''}{unitsFor(post)}u
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views}</span>
                  <span>{post.saves} saves</span>
                  <span>{format(new Date(post.createdAt), 'MMM d, HH:mm')}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {post.result === 'pending' ? (
                  <>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => settle(post, 'won')}>Won</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => settle(post, 'lost')}>Lost</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => settle(post, 'push')}>Push</Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => settle(post, 'pending')}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Reopen
                  </Button>
                )}
                <Button size="icon" variant="ghost" aria-label="Delete post" onClick={() => setConfirmDelete(post)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be removed for every subscriber, and its result will no longer count towards your win rate or units profit. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep post</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) store.deletePost(confirmDelete.id);
                setConfirmDelete(null);
                toast.success('Post deleted');
              }}
            >Delete post</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* -------------------------------- Products ------------------------------- */

function Products({ store }: { store: DemoStore }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('49');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [spots, setSpots] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<DemoProduct | null>(null);
  const statsFor = (id: string) => store.metrics.productStats.find(x => x.id === id);

  const create = () => {
    if (!name.trim()) return toast.error('Give the tier a name');
    if (store.state.products.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) return toast.error('You already have a tier with that name');
    const p = Number(price);
    if (Number.isNaN(p) || p < 1) return toast.error('Price must be at least $1');
    const max = spots.trim() ? Number(spots) : null;
    if (max !== null && (Number.isNaN(max) || max < 1)) return toast.error('Spot limit must be a positive number');
    store.addProduct({ name: name.trim(), description: description.trim(), price: p, billingPeriod: period, isFeatured: false, isActive: true, maxSpots: max });
    toast.success(`${name.trim()} is live`);
    setName(''); setDescription(''); setPrice('49'); setSpots('');
  };

  const periodLabel = (b: DemoProduct['billingPeriod']) => (b === 'monthly' ? 'mo' : b === 'yearly' ? 'yr' : 'qtr');

  return (
    <>
      <SectionHeader title="Products" description={`${store.state.products.length} tiers · fees are deducted automatically at ${Math.round(store.metrics.feeRate * 100)}%`} />
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-3">
          {store.state.products.length === 0 && <Card><p className="text-sm text-muted-foreground">No tiers yet — create one to start selling.</p></Card>}
          {store.state.products.map(p => {
            const st = statsFor(p.id);
            const full = st?.spotsLeft === 0;
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.isFeatured && <Badge variant="secondary" className="text-[10px]">Featured</Badge>}
                      {!p.isActive && <Badge variant="outline" className="text-[10px]">Paused</Badge>}
                      {full && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500">Sold out</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.description || 'No description'}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {money(p.price)}/{periodLabel(p.billingPeriod)} · {st?.activeSubs ?? 0} active · {money(st?.gross ?? 0)} gross
                      {st?.spotsLeft !== null && st !== undefined ? ` · ${st.spotsLeft} of ${p.maxSpots} spots left` : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      Fee -{money(st?.fee ?? 0)} · you keep <span className="text-emerald-500">{money(st?.net ?? 0)}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Switch aria-label={`${p.name} active`} checked={p.isActive} onCheckedChange={v => { store.updateProduct(p.id, { isActive: v }); toast.success(v ? 'Tier resumed' : 'Tier paused — no new signups'); }} />
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => { store.updateProduct(p.id, { isFeatured: !p.isFeatured }); toast.success(p.isFeatured ? 'Removed from featured' : 'Set as featured tier'); }}>
                      {p.isFeatured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setConfirmDelete(p)}>
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Card className="h-fit space-y-3">
          <p className="text-sm font-medium">New tier</p>
          <div><Label className="text-xs" htmlFor="tier-name">Name</Label><Input id="tier-name" className="mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="VIP Access" /></div>
          <div><Label className="text-xs" htmlFor="tier-desc">Description</Label><Textarea id="tier-desc" className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's included" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs" htmlFor="tier-price">Price ($)</Label><Input id="tier-price" className="mt-1" type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div>
              <Label className="text-xs" htmlFor="tier-billing">Billing</Label>
              <select id="tier-billing" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={period} onChange={e => setPeriod(e.target.value as typeof period)}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs" htmlFor="tier-spots">Spot limit (optional)</Label>
            <Input id="tier-spots" className="mt-1" type="number" min="1" value={spots} onChange={e => setSpots(e.target.value)} placeholder="Unlimited" />
            <p className="text-[11px] text-muted-foreground mt-1">Scarcity lifts conversion on high-priced tiers.</p>
          </div>
          <Button className="w-full" onClick={create}><Plus className="mr-1.5 h-3.5 w-3.5" /> Create tier</Button>
        </Card>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{confirmDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {statsFor(confirmDelete?.id ?? '')?.activeSubs ?? 0} active subscribers will be cancelled and that recurring revenue removed from your earnings. Pausing the tier instead keeps existing members billing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep tier</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) store.deleteProduct(confirmDelete.id);
                setConfirmDelete(null);
                toast.success('Tier deleted and subscribers cancelled');
              }}
            >Delete tier</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ------------------------------ Subscribers ------------------------------ */

function Subscribers({ store }: { store: DemoStore }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'cancelled'>('all');
  const [sort, setSort] = useState<{ key: 'name' | 'amount' | 'joinedAt'; dir: 'asc' | 'desc' }>({ key: 'joinedAt', dir: 'desc' });
  const [confirmCancel, setConfirmCancel] = useState<DemoSubscriber | null>(null);
  const all = store.state.subscribers;
  const counts = {
    all: all.length,
    active: all.filter(s => s.status === 'active').length,
    cancelled: all.filter(s => s.status === 'cancelled').length,
  };

  const rows = all
    .filter(s => (status === 'all' ? true : s.status === status))
    .filter(s => `${s.name} ${s.email}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'amount') return (a.amount - b.amount) * dir;
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
      return (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) * dir;
    });

  const toggleSort = (key: typeof sort.key) =>
    setSort(cur => ({ key, dir: cur.key === key && cur.dir === 'desc' ? 'asc' : 'desc' }));

  const productName = (id: string) => store.state.products.find(p => p.id === id)?.name ?? 'Removed tier';
  const filteredRevenue = rows.filter(r => r.status === 'active').reduce((sum, r) => sum + r.amount, 0);

  const exportCsv = () => {
    downloadCsv('creator-subscribers.csv',
      ['Name', 'Email', 'Tier', 'Amount', 'Status', 'Member since'],
      rows.map(r => [r.name, r.email, productName(r.productId), r.amount, r.status, format(new Date(r.joinedAt), 'yyyy-MM-dd')]));
    toast.success(`Exported ${rows.length} subscribers`);
  };

  const SortTh = ({ label, k, align = 'left' }: { label: string; k: typeof sort.key; align?: 'left' | 'right' }) => (
    <th className={`${align === 'right' ? 'text-right' : 'text-left'} font-medium px-4 py-3`}>
      <button className="inline-block py-1.5 -my-1.5 hover:text-foreground transition-colors" onClick={() => toggleSort(k)}>
        {label}{sort.key === k ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  );

  return (
    <>
      <SectionHeader
        title="Subscribers"
        description={`${counts.active} active · ${counts.cancelled} churned · ${money(filteredRevenue)} billed in this view`}
        action={<Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>}
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          {(['all', 'active', 'cancelled'] as const).map(f => (
            <Button key={f} size="sm" variant={status === f ? 'default' : 'outline'} className="capitalize text-xs" onClick={() => setStatus(f)}>
              {f} <span className="ml-1.5 opacity-60">{counts[f]}</span>
            </Button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name or email" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <SortTh label="Member" k="name" />
              <th className="text-left font-medium px-4 py-3">Tier</th>
              <SortTh label="Paying" k="amount" align="right" />
              <SortTh label="Since" k="joinedAt" />
              <th className="text-right font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{productName(s.productId)}</td>
                <td className="px-4 py-3 text-right">{money(s.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{format(new Date(s.joinedAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 text-right">
                  {s.status === 'active' ? (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setConfirmCancel(s)}>Cancel</Button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="outline" className="text-[10px]">Cancelled</Badge>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => { store.reactivateSubscriber(s.id); toast.success(`${s.name} reactivated`); }}>Reactivate</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No subscribers found.</td></tr>}
          </tbody>
        </table>
      </Card>

      <AlertDialog open={!!confirmCancel} onOpenChange={o => { if (!o) setConfirmCancel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {confirmCancel?.name}'s subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to premium picks immediately and {money(confirmCancel?.amount ?? 0)} leaves your recurring revenue. You can reactivate them afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep active</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancel) store.cancelSubscriber(confirmCancel.id);
                toast.success(`${confirmCancel?.name} cancelled`);
                setConfirmCancel(null);
              }}
            >Cancel subscription</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ------------------------------- Promotions ------------------------------ */

function Promotions({ store }: { store: DemoStore }) {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('15');
  const [maxUses, setMaxUses] = useState('');

  const create = () => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) return toast.error('Codes need at least 3 characters');
    if (store.state.promos.some(p => p.code === clean)) return toast.error('That code already exists');
    const d = Number(discount);
    if (Number.isNaN(d) || d < 1 || d > 90) return toast.error('Discount must be between 1% and 90%');
    const max = maxUses.trim() ? Number(maxUses) : null;
    if (max !== null && (Number.isNaN(max) || max < 1)) return toast.error('Max uses must be a positive number');
    store.addPromo({ code: clean, discountPercent: d, maxUses: max, isActive: true });
    toast.success(`${clean} created`);
    setCode(''); setMaxUses('');
  };

  return (
    <>
      <SectionHeader title="Promotions" description="Discount codes applied at checkout." />
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-3">
          {store.state.promos.map(p => (
            <Card key={p.id} className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-sm">{p.code}</p>
                  <Badge variant={p.isActive ? 'secondary' : 'outline'} className="text-[10px]">{p.isActive ? 'Active' : 'Disabled'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.discountPercent}% off · used {p.timesUsed}{p.maxUses ? `/${p.maxUses}` : ''} times
                  {p.maxUses && p.timesUsed >= p.maxUses ? ' · limit reached' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch aria-label={`Promo code ${p.code} active`} checked={p.isActive} onCheckedChange={v => { store.togglePromo(p.id); toast.success(v ? `${p.code} enabled` : `${p.code} disabled`); }} />
                <Button size="icon" variant="ghost" onClick={() => { store.deletePromo(p.id); toast.success('Code removed'); }}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
          {store.state.promos.length === 0 && <Card><p className="text-sm text-muted-foreground">No promo codes yet.</p></Card>}
        </div>
        <Card className="h-fit space-y-3">
          <p className="text-sm font-medium">New code</p>
          <div><Label className="text-xs">Code</Label><Input className="mt-1 font-mono uppercase" value={code} onChange={e => setCode(e.target.value)} placeholder="SUPERBOWL25" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Discount %</Label><Input className="mt-1" type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
            <div><Label className="text-xs">Max uses</Label><Input className="mt-1" type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="∞" /></div>
          </div>
          <Button className="w-full" onClick={create}><Percent className="mr-1.5 h-3.5 w-3.5" /> Create code</Button>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------- Messages ------------------------------- */

function Messages({ store }: { store: DemoStore }) {
  const [activeId, setActiveId] = useState(store.state.threads[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const thread = store.state.threads.find(t => t.id === activeId);
  const subscriberOf = (id: string) => store.state.subscribers.find(s => s.id === id);

  const send = () => {
    if (!thread || !draft.trim()) return;
    store.reply(thread.id, draft.trim());
    setDraft('');
    toast.success('Reply sent');
  };

  return (
    <>
      <SectionHeader
        title="Messages"
        description={store.state.settings.messagingEnabled ? `${store.metrics.unreadMessages} unread` : 'Messaging is turned off in Settings'}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Accept messages</span>
            <Switch
              aria-label="Accept messages"
              checked={store.state.settings.messagingEnabled}
              onCheckedChange={v => { store.updateSettings({ messagingEnabled: v }); toast.success(v ? 'Subscribers can message you' : 'Messaging disabled'); }}
            />
          </div>
        }
      />
      <div className="grid md:grid-cols-[260px_1fr] gap-4">
        <div className="space-y-2">
          {store.state.threads.map(t => {
            const sub = subscriberOf(t.subscriberId);
            return (
              <button
                key={t.id}
                onClick={() => { setActiveId(t.id); store.readThread(t.id); }}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${t.id === activeId ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{sub?.name ?? 'Subscriber'}</p>
                  {t.unread > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{t.unread}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{t.messages[t.messages.length - 1]?.body}</p>
              </button>
            );
          })}
        </div>
        <Card className="flex flex-col min-h-[380px]">
          {thread ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {thread.messages.map(m => (
                  <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.from === 'creator' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.body}
                    <p className={`text-[10px] mt-1 ${m.from === 'creator' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(m.createdAt), 'MMM d, HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-3 border-t border-border mt-3">
                <Input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send(); }}
                  placeholder={store.state.settings.messagingEnabled ? 'Write a reply…' : 'Messaging is disabled'}
                  disabled={!store.state.settings.messagingEnabled}
                />
                <Button onClick={send} disabled={!store.state.settings.messagingEnabled}><Send className="h-3.5 w-3.5" /></Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground m-auto">Select a conversation.</p>
          )}
        </Card>
      </div>
    </>
  );
}

/* -------------------------------- Earnings ------------------------------- */

function Earnings({ store }: { store: DemoStore }) {
  const { metrics, state } = store;
  const byTier = useMemo(() => state.products.map(p => {
    const st = metrics.productStats.find(x => x.id === p.id);
    return { ...p, activeSubs: st?.activeSubs ?? 0, gross: st?.gross ?? 0, fee: st?.fee ?? 0, net: st?.net ?? 0 };
  }), [state.products, metrics.productStats]);

  const grossTotal = byTier.reduce((s, t) => s + t.gross, 0);

  return (
    <>
      <SectionHeader
        title="Earnings"
        description={`Current platform fee: ${Math.round(metrics.feeRate * 100)}%${metrics.introDaysLeft > 0 ? ` · intro rate for ${metrics.introDaysLeft} more days` : ''}`}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCsv('creator-earnings.csv',
                ['Tier', 'Active subscribers', 'Gross', 'Platform fee', 'Net'],
                byTier.map(t => [t.name, t.activeSubs, t.gross, t.fee, t.net]));
              toast.success('Earnings exported');
            }}
          ><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Gross billed" value={money(grossTotal)} icon={DollarSign} />
        <Stat label="Platform fee" value={money(+(grossTotal * metrics.feeRate).toFixed(2))} icon={Percent} />
        <Stat label="Net payout" value={money(+(grossTotal * (1 - metrics.feeRate)).toFixed(2))} icon={Check} />
        <Stat label="Units profit" value={`${metrics.unitsNet > 0 ? '+' : ''}${metrics.unitsNet}u`} icon={TrendingUp} hint={`ROI ${metrics.roi}%`} />
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium px-4 py-3">Tier</th>
              <th className="text-right font-medium px-4 py-3">Subscribers</th>
              <th className="text-right font-medium px-4 py-3">Gross</th>
              <th className="text-right font-medium px-4 py-3">Fee</th>
              <th className="text-right font-medium px-4 py-3">Net</th>
            </tr>
          </thead>
          <tbody>
            {byTier.map(t => (
              <tr key={t.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-right">{t.activeSubs}</td>
                <td className="px-4 py-3 text-right">{money(t.gross)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">-{money(t.fee)}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-500">{money(t.net)}</td>
              </tr>
            ))}
            <tr className="bg-muted/40">
              <td className="px-4 py-3 font-medium">Total</td>
              <td className="px-4 py-3 text-right font-medium">{byTier.reduce((s2, t) => s2 + t.activeSubs, 0)}</td>
              <td className="px-4 py-3 text-right font-medium">{money(grossTotal)}</td>
              <td className="px-4 py-3 text-right font-medium text-muted-foreground">-{money(+(grossTotal * metrics.feeRate).toFixed(2))}</td>
              <td className="px-4 py-3 text-right font-medium text-emerald-500">{money(+(grossTotal * (1 - metrics.feeRate)).toFixed(2))}</td>
            </tr>
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground mt-3">
        Payouts run weekly once the balance clears $50. Demo figures recalculate as you add tiers or cancel subscribers.
      </p>
    </>
  );
}

/* -------------------------------- Settings ------------------------------- */

function SettingsTab({ store }: { store: DemoStore }) {
  const s = store.state.settings;
  const [form, setForm] = useState(s);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setForm(s); }, [s]);

  const dirty = JSON.stringify(form) !== JSON.stringify(s);

  const save = () => {
    if (form.displayName.trim().length < 2) return toast.error('Display name must be at least 2 characters');
    if (form.username.length < 3) return toast.error('Username must be at least 3 characters');
    if (!/^[a-z0-9_]+$/i.test(form.username)) return toast.error('Usernames can only contain letters, numbers and underscores');
    if (!form.monthlyPrice || form.monthlyPrice < 1) return toast.error('Price must be at least $1');
    store.updateSettings({ ...form, displayName: form.displayName.trim(), username: form.username.toLowerCase(), bio: form.bio.trim() });
    toast.success('Profile saved');
  };

  return (
    <>
      <SectionHeader
        title="Settings"
        description="Profile and payout preferences."
        action={dirty ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-500">Unsaved changes</span>
            <Button size="sm" variant="outline" onClick={() => setForm(s)}>Discard</Button>
          </div>
        ) : undefined}
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="space-y-4">
          <p className="text-sm font-medium">Public profile</p>
          <div><Label className="text-xs" htmlFor="set-name">Display name</Label><Input id="set-name" className="mt-1" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} /></div>
          <div>
            <Label className="text-xs" htmlFor="set-username">Username</Label>
            <Input id="set-username" className="mt-1" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.replace(/\s/g, '') })} />
            <p className="text-[11px] text-muted-foreground mt-1">wizzlet.com/{form.username || 'username'}</p>
          </div>
          <div><Label className="text-xs" htmlFor="set-bio">Bio</Label><Textarea id="set-bio" className="mt-1" maxLength={280} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /><p className="text-[11px] text-muted-foreground mt-1">{form.bio.length}/280</p></div>
          <div>
            <Label className="text-xs" htmlFor="set-price">Base monthly price ($)</Label>
            <Input id="set-price" className="mt-1" type="number" min="1" value={form.monthlyPrice} onChange={e => setForm({ ...form, monthlyPrice: Number(e.target.value) })} />
            <p className="text-[11px] text-muted-foreground mt-1">
              You keep {money(+(form.monthlyPrice * (1 - store.metrics.feeRate)).toFixed(2))} per subscriber after the {Math.round(store.metrics.feeRate * 100)}% fee.
            </p>
          </div>
          <Button onClick={save} disabled={!dirty}>Save profile</Button>
        </Card>
        <div className="space-y-4">
          <Card className="space-y-4">
            <p className="text-sm font-medium">Preferences</p>
            {([
              { key: 'published' as const, label: 'Profile published', hint: 'Visible in Discover and search' },
              { key: 'messagingEnabled' as const, label: 'Subscriber messaging', hint: 'Allow DMs from paying members' },
              { key: 'notifyOnSubscribe' as const, label: 'New subscriber alerts', hint: 'Notify me on every signup' },
            ]).map(row => (
              <div key={row.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{row.label}</p>
                  <p className="text-[11px] text-muted-foreground">{row.hint}</p>
                </div>
                <Switch
                  aria-label={row.label}
                  checked={s[row.key]}
                  onCheckedChange={v => { store.updateSettings({ [row.key]: v }); toast.success('Preference updated'); }}
                />
              </div>
            ))}
            {!s.published && (
              <p className="text-[11px] text-amber-500">Your profile is hidden — new members cannot find or subscribe to you.</p>
            )}
          </Card>
          <Card className="space-y-3">
            <p className="text-sm font-medium">Demo data</p>
            <p className="text-xs text-muted-foreground">Everything you change here lives in this browser session only.</p>
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset demo data
            </Button>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the creator demo?</AlertDialogTitle>
            <AlertDialogDescription>
              Every post, tier, subscriber, promo code, message and setting you changed in this session is discarded and the seeded demo data is restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my changes</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                store.reset();
                setForm(defaultSettings());
                setConfirmReset(false);
                toast.success('Demo data reset');
              }}
            >Reset demo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* --------------------------------- Shell --------------------------------- */

const DemoCreatorDashboard = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'overview';
  const store = useDemoCreatorStore();
  const go = (t: TabKey) => setParams(t === 'overview' ? {} : { tab: t });

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={
        mobile
          ? 'flex h-full w-full flex-col bg-card'
          : 'hidden md:flex w-[220px] flex-col border-r border-border bg-card/80 backdrop-blur-sm'
      }
    >
      <div className="px-5 py-5">
        <Link to="/" className="flex items-center gap-2 font-semibold text-[14px] tracking-tight text-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold text-[11px]">W</span>
          </div>
          Wizzlet
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {sidebarItems.map(item => {
          const isActive = item.tab === tab;
          return (
            <button
              key={item.label}
              onClick={() => go(item.tab)}
              className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {item.label}
              {item.tab === 'messages' && store.metrics.unreadMessages > 0 && (
                <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{store.metrics.unreadMessages}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <Link to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground text-[13px]">
            <LogOut className="mr-2 h-3.5 w-3.5" /> Exit Demo
          </Button>
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <SidebarNav />

      <main className="flex-1 min-w-0 overflow-auto">
        <MobileTopBar>
          <SidebarNav mobile />
        </MobileTopBar>
        <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl">
          <DemoRoleSwitcher />


          {tab === 'overview' && <Overview store={store} go={go} />}
          {tab === 'create' && <CreatePost store={store} go={go} />}
          {tab === 'content' && <Content store={store} />}
          {tab === 'products' && <Products store={store} />}
          {tab === 'subscribers' && <Subscribers store={store} />}
          {tab === 'promotions' && <Promotions store={store} />}
          {tab === 'messages' && <Messages store={store} />}
          {tab === 'earnings' && <Earnings store={store} />}
          {tab === 'settings' && <SettingsTab store={store} />}
        </div>
      </main>
    </div>
  );
};

export default DemoCreatorDashboard;
