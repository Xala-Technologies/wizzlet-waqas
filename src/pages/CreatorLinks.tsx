import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Link2, Plus, Copy, Trash2, MousePointerClick, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CreatorLinks = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const links = useQuery(api.creators.growth.listMyLinks);
  const upsertLink = useMutation(api.creators.growth.upsertLink);
  const removeLink = useMutation(api.creators.growth.removeLink);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const loading = creatorLoading || links === undefined;

  const handleCreate = async () => {
    if (!creator) return;
    if (!name.trim() || !url.trim()) { toast.error('Fill in all fields'); return; }
    setSaving(true);
    try {
      await upsertLink({ name: name.trim(), url: url.trim() });
      setName('');
      setUrl('');
      toast.success('Tracking link created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<'creatorLinks'>) => {
    try {
      await removeLink({ linkId: id });
      toast.success('Link deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete link');
    }
  };

  const rows = links ?? [];
  const totalClicks = rows.reduce((a, b) => a + b.clicks, 0);
  const totalConversions = rows.reduce((a, b) => a + b.conversions, 0);

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Links</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track link performance and conversions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <MousePointerClick className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{totalClicks}</p>
          <p className="text-xs text-muted-foreground">Total Clicks</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">{totalConversions}</p>
          <p className="text-xs text-muted-foreground">Conversions</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Create Trackable Link</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Link Name</Label>
            <Input placeholder="e.g. Instagram Bio" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Destination URL</Label>
            <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-end">
            <Button variant="hero" size="sm" onClick={handleCreate} disabled={saving || !creator} className="w-full">
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Create Link
            </Button>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Your Links</h2>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tracking links yet — create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(link => (
            <div key={link._id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{link.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold">{link.clicks}</p>
                  <p className="text-[10px] text-muted-foreground">clicks</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{link.conversions}</p>
                  <p className="text-[10px] text-muted-foreground">conv.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(link.url); toast.success('Copied!'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(link._id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorLinks;
