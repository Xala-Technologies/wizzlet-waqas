import { useState, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText, Plus, Loader2, Pencil, Trash2, Lock, Globe,
  CheckCircle2, ArrowRight, Zap, Mail, Smartphone, Flame,
  Clock, Trophy, XCircle, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { americanToDecimal, decimalToAmerican } from '@/lib/odds';

interface Post {
  id: string;
  title: string;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  result: string;
  tracking_mode: string;
}

interface Product {
  id: string;
  name: string;
  subCount: number;
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
  const postsRaw = useQuery(api.posts.queries.listMine);
  const productsRaw = useQuery(
    api.products.mutations.listByCreator,
    creator ? { creatorId: creator._id, activeOnly: true } : 'skip',
  );
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const upsertPost = useMutation(api.posts.queries.upsert);
  const removePost = useMutation(api.posts.queries.remove);
  const setResultMut = useMutation(api.posts.queries.setResult);

  const loading = creator === undefined || postsRaw === undefined || productsRaw === undefined || subs === undefined;
  const creatorId = creator?._id ?? null;
  const subCount = (subs ?? []).filter((s) => s.status === 'active').length;

  const posts = useMemo(
    () => (postsRaw ?? []).map((p) => ({
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

  const products = useMemo(
    () => (productsRaw ?? []).map((p) => ({ id: p._id, name: p.name, subCount })),
    [productsRaw, subCount],
  );

  // Create/Edit state
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sendApp, setSendApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [oddsSource, setOddsSource] = useState<'us' | 'eu' | null>(null);

  const resetForm = () => {
    setEditId(null); setTitle(''); setSport(''); setEvent(''); setPickType('');
    setPick(''); setUsOdds(''); setEuOdds(''); setUnits('1'); setNotes('');
    setIsPremium(true); setSelectedProducts([]); setSendApp(true); setSendEmail(false); setOddsSource(null);
  };

  const openCreate = () => { resetForm(); setMode('create'); };

  const openEdit = (post: Post) => {
    resetForm(); setEditId(post.id); setTitle(post.title); setNotes(post.content ?? '');
    setIsPremium(post.is_premium); setMode('create');
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
    if (usOdds || euOdds) parts.push(`Odds: ${usOdds ? usOdds + ' (US)' : ''} ${euOdds ? euOdds + ' (EU)' : ''}`.trim());
    if (units) parts.push(`Units: ${units}u`);
    if (notes) parts.push(`\n${notes}`);
    return parts.join('\n');
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!creatorId) return;
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

  const handleDelete = async (id: string) => {
    try {
      await removePost({ postId: id as Id<'posts'> });
      toast.success('Post deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete post');
    }
  };

  const handleResultChange = async (postId: string, newResult: string) => {
    try {
      await setResultMut({ postId: postId as Id<'posts'>, result: newResult });
      toast.success(`Marked as ${newResult}`);
    } catch {
      toast.error('Failed to update result');
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Streak calculation
  const winStreak = (() => {
    let streak = 0;
    for (const p of posts) {
      if (p.result === 'won') streak++;
      else if (p.result === 'lost') break;
      else continue;
    }
    return streak;
  })();

  // CREATE MODE
  if (mode === 'create') {
    return (
      <DashboardLayout type="creator">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => setMode('list')} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-1 block">← Back to posts</button>
            <h1 className="text-xl font-bold">{editId ? 'Edit Pick' : 'New Pick'}</h1>
          </div>
          <Button onClick={handleSave} disabled={saving || !title.trim()} size="sm">
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            <Zap className="mr-1.5 h-3.5 w-3.5" /> Publish Pick
          </Button>
        </div>

        <div className="max-w-2xl space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</Label>
            <Input placeholder="e.g. Lakers ML +150" value={title} onChange={e => setTitle(e.target.value)}
              className="text-base font-medium border-0 bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40" maxLength={200} />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pick Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Sport</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select sport" /></SelectTrigger>
                  <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Pick Type</Label>
                <Select value={pickType} onValueChange={setPickType}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{PICK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event</Label>
              <Input placeholder="e.g. Lakers vs Warriors" value={event} onChange={e => setEvent(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Pick</Label>
              <Input placeholder="e.g. Lakers ML, Over 2.5 goals" value={pick} onChange={e => setPick(e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">US Odds</Label>
                <Input placeholder="-120 or +150" value={usOdds} onChange={e => handleUsOddsChange(e.target.value)}
                  className={`h-10 ${oddsSource === 'eu' ? 'text-muted-foreground' : ''}`} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">EU Odds</Label>
                <Input placeholder="1.85" value={euOdds} onChange={e => handleEuOddsChange(e.target.value)}
                  className={`h-10 ${oddsSource === 'us' ? 'text-muted-foreground' : ''}`} />
              </div>
            </div>
            {oddsSource && <p className="text-[10px] text-muted-foreground -mt-2">{oddsSource === 'us' ? 'EU odds auto-calculated' : 'US odds auto-calculated'}</p>}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Units</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={units} onChange={e => setUnits(e.target.value)} className="h-10 w-24" min="0.5" max="100" step="0.5" />
                <span className="text-sm text-muted-foreground">units risked</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes (optional)</Label>
            <Textarea placeholder="Why do you like this play?" value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="resize-none border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibility</p>
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Premium (subscribers only)</p>
                <p className="text-xs text-muted-foreground">Only paying subscribers can see this</p>
              </div>
              <Switch aria-label="Premium only" checked={isPremium} onCheckedChange={setIsPremium} />
            </div>
            {products.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Send to products</p>
                <div className="space-y-2">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-3 rounded-lg bg-muted/20 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <Checkbox checked={selectedProducts.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.subCount} subscribers</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={sendApp} onCheckedChange={(v) => setSendApp(v === true)} />
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">Push notification</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(v === true)} />
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">Email notification</span>
              </label>
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-50">
            <Button onClick={handleSave} disabled={saving || !title.trim()} className="w-full h-12 text-sm font-semibold">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              <Zap className="mr-1.5 h-4 w-4" /> Publish Pick
            </Button>
          </div>
          <div className="h-20 md:hidden" />
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
                <DialogTitle className="text-center text-lg">Pick posted successfully</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Your pick is now live for subscribers.</p>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => { setShowSuccess(false); resetForm(); }} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" /> Create Another
                </Button>
                <Button variant="outline" onClick={() => { setShowSuccess(false); setMode('list'); }} className="w-full">
                  Go to Feed <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // LIST MODE
  const settled = posts.filter(p => p.result !== 'pending');
  const wins = settled.filter(p => p.result === 'won').length;
  const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0;

  return (
    <DashboardLayout type="creator">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Posts
            {winStreak >= 3 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
                <Flame className="h-3.5 w-3.5" /> {winStreak}W Streak
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''} · {winRate}% win rate</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> New Pick
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Total Picks', value: posts.length, color: 'text-foreground' },
          { label: 'Wins', value: wins, color: 'text-emerald-500' },
          { label: 'Losses', value: settled.filter(p => p.result === 'lost').length, color: 'text-red-500' },
          { label: 'Win Rate', value: `${winRate}%`, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No picks yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">Post your first pick and share it with subscribers.</p>
          <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> Create Pick</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const rc = resultConfig[post.result as keyof typeof resultConfig] || resultConfig.pending;
            const ResultIcon = rc.icon;
            return (
              <div key={post.id} className="group rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-border/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {post.is_premium ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wide"><Lock className="h-2.5 w-2.5" /> Premium</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide"><Globe className="h-2.5 w-2.5" /> Free</span>
                      )}
                      <Badge variant="outline" className={`text-[9px] font-semibold uppercase ${rc.className}`}>
                        <ResultIcon className="h-2.5 w-2.5 mr-0.5" />
                        {rc.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{post.title}</h3>
                    {post.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.content}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Result buttons */}
                    {post.result === 'pending' && (
                      <div className="flex items-center gap-0.5 mr-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                          onClick={() => handleResultChange(post.id, 'won')} title="Mark Won">
                          <Trophy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => handleResultChange(post.id, 'lost')} title="Mark Lost">
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted"
                          onClick={() => handleResultChange(post.id, 'push')} title="Mark Push">
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {post.result !== 'pending' && (
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground mr-1"
                        onClick={() => handleResultChange(post.id, 'pending')}>
                        Reset
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(post)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(post.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorPosts;
