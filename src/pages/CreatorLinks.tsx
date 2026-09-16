import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { kpiIconTone } from '@/lib/kpiIconTones';
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
import {
  CREATOR_LINKS_DEMO_ROWS,
  isCreatorLinksDemoId,
  shouldUseCreatorLinksDemo,
} from '@/lib/creatorLinksDemo';
import { ArrowLeft, Gift, Link2, Plus, Copy, Trash2, MousePointerClick, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

function destinationHost(raw: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).host;
  } catch {
    return null;
  }
}

type DisplayLink = {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
  isDemo: boolean;
};

const CreatorLinks = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const links = useQuery(api.creators.growth.listMyLinks);
  const upsertLink = useMutation(api.creators.growth.upsertLink);
  const removeLink = useMutation(api.creators.growth.removeLink);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading = creatorLoading || links === undefined;
  const liveRows = links ?? [];

  const useDemo = shouldUseCreatorLinksDemo({
    count: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const rows: DisplayLink[] = useDemo
    ? CREATOR_LINKS_DEMO_ROWS.map((l) => ({ ...l, isDemo: true }))
    : liveRows.map((l) => ({
        id: l._id,
        name: l.name,
        url: l.url,
        clicks: l.clicks,
        conversions: l.conversions,
        isDemo: false,
      }));

  const totalClicks = rows.reduce((a, b) => a + b.clicks, 0);
  const totalConversions = rows.reduce((a, b) => a + b.conversions, 0);
  const deleteTarget = rows.find((l) => l.id === deleteId);

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
    if (useDemo) {
      toast.message('Sample preview — link not created', {
        description: 'Add a real tracking link when you leave demo mode (?demo=0).',
      });
      setName('');
      setUrl('');
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
    if (useDemo || isCreatorLinksDemoId(deleteId)) {
      toast.message('Sample preview — link not deleted', {
        description: 'Demo rows are mock content for design review.',
      });
      setDeleteId(null);
      return;
    }
    setDeleting(true);
    try {
      await removeLink({ linkId: deleteId as Id<'creatorLinks'> });
      toast.success('Link deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete link');
    } finally {
      setDeleting(false);
    }
  };

  const copyTracking = async (id: string) => {
    if (isCreatorLinksDemoId(id)) {
      toast.message('Sample preview — copy uses a demo path', {
        description: 'Live /go/… URLs appear when you create real links.',
      });
    }
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
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Marketing
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground">
            Tracking Links
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Share tracking URLs (`/go/…`) so clicks are counted. Destination opens after redirect.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Link2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Marketing
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Tracking Links
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Share tracking URLs (`/go/…`) so clicks are counted. Destination opens after redirect.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-xl">
            <Link to="/creator/promo">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Marketing
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-xl">
            <Link to="/creator/referrals">
              <Gift className="mr-1.5 h-4 w-4" /> Referrals
            </Link>
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — links and KPIs are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      <div className="mb-6">
        <DashboardKpiStrip
          items={[
            {
              label: 'Total clicks',
              value: String(totalClicks),
              icon: MousePointerClick,
              iconClassName: kpiIconTone.violet,
            },
            {
              label: 'Conversions',
              value: String(totalConversions),
              icon: TrendingUp,
              iconClassName: kpiIconTone.emerald,
            },
          ]}
        />
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 text-ui font-semibold text-foreground">
          <Plus className="h-4 w-4 text-primary" /> Create trackable link
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="mb-1 text-caption uppercase tracking-wider text-muted-foreground">
                Ready to create
              </p>
              <p className="truncate text-ui text-foreground">{reviewName}</p>
              {reviewBits.length > 0 && (
                <p className="truncate text-support text-muted-foreground">{reviewBits.join(' · ')}</p>
              )}
            </div>
            <Button
              type="button"
              className="min-h-11 w-full"
              onClick={() => void handleCreate()}
              disabled={saving || !name.trim() || !url.trim()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create link
            </Button>
          </div>
        </div>
        <div className="border-t border-border pt-3 lg:hidden">
          <p className="mb-1 text-caption uppercase tracking-wider text-muted-foreground">
            Ready to create
          </p>
          <p className="truncate text-ui text-foreground">{reviewName}</p>
          {reviewBits.length > 0 && (
            <p className="truncate text-support text-muted-foreground">{reviewBits.join(' · ')}</p>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-support font-medium text-muted-foreground">Your links</h2>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Link2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No tracking links yet</h3>
          <p className="mx-auto max-w-sm text-support text-muted-foreground">
            Create your first link above, then share the `/go/…` tracking URL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    kpiIconTone.violet,
                  )}
                >
                  <Link2 className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-ui font-semibold text-foreground">{link.name}</p>
                  <p className="mt-0.5 truncate text-support text-muted-foreground">{link.url}</p>
                  <p className="mt-1 truncate font-mono text-caption text-muted-foreground">
                    /go/{link.id}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
                <div className="min-w-[3.5rem] text-left sm:text-right">
                  <p className="text-ui font-bold text-foreground">{link.clicks}</p>
                  <p className="text-support text-muted-foreground">clicks</p>
                </div>
                <div className="min-w-[3.5rem] text-left sm:text-right">
                  <p className="text-ui font-bold text-foreground">{link.conversions}</p>
                  <p className="text-support text-muted-foreground">conv.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3"
                  onClick={() => void copyTracking(link.id)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(link.id)}
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
