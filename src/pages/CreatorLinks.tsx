import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Link2, Plus, Copy, Trash2, MousePointerClick, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';

function destinationHost(raw: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).host;
  } catch {
    return null;
  }
}

const CreatorLinks = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const links = useQuery(api.creators.growth.listMyLinks);
  const upsertLink = useMutation(api.creators.growth.upsertLink);
  const removeLink = useMutation(api.creators.growth.removeLink);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [deleteId, setDeleteId] = useState<Id<'creatorLinks'> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading = creatorLoading || links === undefined;
  const rows = links ?? [];
  const totalClicks = rows.reduce((a, b) => a + b.clicks, 0);
  const totalConversions = rows.reduce((a, b) => a + b.conversions, 0);
  const deleteTarget = rows.find((l) => l._id === deleteId);

  const trackingUrl = (id: string) => `${window.location.origin}/go/${id}`;

  const reviewName = name.trim() || 'Untitled link';
  const reviewHost = destinationHost(url.trim());
  const reviewBits = [reviewHost].filter(Boolean);

  const handleCreate = async () => {
    if (!creator || saving) return;
    if (!name.trim() || !url.trim()) {
      toast.error('Fill in all fields');
      return;
    }
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

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeLink({ linkId: deleteId });
      toast.success('Link deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete link');
    } finally {
      setDeleting(false);
    }
  };

  const copyTracking = async (id: string) => {
    const ok = await copyToClipboard(trackingUrl(id));
    if (ok) toast.success('Tracking link copied');
    else toast.error('Could not copy — try selecting the text manually');
  };

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <h1 className="text-heading font-bold text-foreground">Links</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Share tracking URLs (`/go/…`) so clicks are counted. Destination opens after redirect.
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Finish onboarding to create trackable links.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Links</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Share tracking URLs (`/go/…`) so clicks are counted. Destination opens after redirect.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-support text-muted-foreground">Total clicks</p>
          </div>
          <p className="text-ui font-bold text-foreground">{totalClicks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-support text-muted-foreground">Conversions</p>
          </div>
          <p className="text-ui font-bold text-foreground">{totalConversions}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-4">
        <h2 className="text-ui font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Create trackable link
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="link-name" className="text-support text-muted-foreground">
              Link name
            </Label>
            <Input
              id="link-name"
              placeholder="e.g. Instagram Bio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 min-h-11 text-ui"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="link-url" className="text-support text-muted-foreground">
              Destination URL
            </Label>
            <Input
              id="link-url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11 min-h-11 text-ui"
            />
          </div>
          <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1">
            <div className="hidden lg:block">
              <p className="text-caption text-muted-foreground uppercase tracking-wider mb-1">
                Ready to create
              </p>
              <p className="text-ui text-foreground truncate">{reviewName}</p>
              {reviewBits.length > 0 && (
                <p className="text-support text-muted-foreground truncate">{reviewBits.join(' · ')}</p>
              )}
            </div>
            <Button
              type="button"
              className="w-full min-h-11"
              onClick={() => void handleCreate()}
              disabled={saving || !name.trim() || !url.trim()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create link
            </Button>
          </div>
        </div>
        <div className="lg:hidden border-t border-border pt-3">
          <p className="text-caption text-muted-foreground uppercase tracking-wider mb-1">
            Ready to create
          </p>
          <p className="text-ui text-foreground truncate">{reviewName}</p>
          {reviewBits.length > 0 && (
            <p className="text-support text-muted-foreground truncate">{reviewBits.join(' · ')}</p>
          )}
        </div>
      </div>

      <h2 className="text-support font-medium text-muted-foreground mb-3">Your links</h2>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No tracking links yet</h3>
          <p className="text-support text-muted-foreground max-w-sm mx-auto">
            Create your first link above, then share the `/go/…` tracking URL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((link) => (
            <div
              key={link._id}
              className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-ui font-semibold text-foreground truncate">{link.name}</p>
                  <p className="text-support text-muted-foreground truncate mt-0.5">{link.url}</p>
                  <p className="text-caption text-muted-foreground font-mono mt-1 truncate">
                    /go/{link._id}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                <div className="text-left sm:text-right min-w-[3.5rem]">
                  <p className="text-ui font-bold text-foreground">{link.clicks}</p>
                  <p className="text-support text-muted-foreground">clicks</p>
                </div>
                <div className="text-left sm:text-right min-w-[3.5rem]">
                  <p className="text-ui font-bold text-foreground">{link.conversions}</p>
                  <p className="text-support text-muted-foreground">conv.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3"
                  onClick={() => void copyTracking(link._id)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(link._id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tracking link?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” and its /go/… URL will stop working. Past click counts are not rewritten.`
                : 'This tracking link will stop working. Past click counts are not rewritten.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
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
    </DashboardLayout>
  );
};

export default CreatorLinks;
