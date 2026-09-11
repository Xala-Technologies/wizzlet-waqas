import { useEffect, useMemo, useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminSupportTabs } from '@/components/dashboard/AdminSupportTabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Loader2, Users, Search, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CREATOR_PAGE = 50;
const MSG_PAGE = 50;

interface CreatorOption {
  id: string;
  name: string;
}

interface SentMessage {
  id: string;
  creator_id: string;
  creatorName: string;
  body: string;
  created_at: number;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

const AdminCreatorMessaging = () => {
  const [searchParams] = useSearchParams();
  const prefillCreatorId = searchParams.get('creatorId');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const {
    results: creatorResults,
    status: creatorStatus,
    loadMore: loadMoreCreators,
  } = usePaginatedQuery(
    api.admin.paginatedLists.listCreatorsPage,
    {},
    { initialNumItems: CREATOR_PAGE },
  );
  const {
    results: supportResults,
    status: supportStatus,
    loadMore: loadMoreSupport,
  } = usePaginatedQuery(
    api.admin.paginatedLists.listSupportMessagesPage,
    {},
    { initialNumItems: MSG_PAGE },
  );
  const platformSettings = useQuery(api.platform.mutations.get);
  const sendMessage = useMutation(api.support.mutations.send);

  const flags = (platformSettings?.featureFlags ?? {}) as Record<string, unknown>;
  const messagingEnabled =
    flags.creatorMessagingEnabled !== false && flags.creator_messaging_enabled !== false;

  const loading = creatorStatus === 'LoadingFirstPage';

  const creators = useMemo((): CreatorOption[] => (creatorResults ?? []).map((c) => ({
    id: c.id,
    name: c.displayName || c.username || 'Unnamed creator',
  })), [creatorResults]);

  useEffect(() => {
    if (prefillApplied || !prefillCreatorId || creators.length === 0) return;
    if (creators.some((c) => c.id === prefillCreatorId)) {
      setSelected(new Set([prefillCreatorId]));
      setPrefillApplied(true);
    }
  }, [prefillCreatorId, creators, prefillApplied]);

  const recent = useMemo((): SentMessage[] => (supportResults ?? [])
    .filter((m) => m.senderRole === 'admin' && m.channel === 'support')
    .slice(0, 20)
    .map((m) => ({
      id: m.id,
      creator_id: m.creatorId,
      creatorName: m.creatorName,
      body: m.body,
      created_at: m.createdAt,
    })), [supportResults]);

  const filtered = useMemo(
    () => creators.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [creators, search],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = async () => {
    if (!messagingEnabled) {
      toast.error('Creator messaging is disabled in Settings');
      return;
    }
    if (selected.size === 0) { toast.error('Select at least one creator'); return; }
    if (!body.trim()) { toast.error('Write a message'); return; }
    setSending(true);
    try {
      await Promise.all([...selected].map((creatorId) =>
        sendMessage({
          creatorId: creatorId as Id<'creators'>,
          senderRole: 'admin',
          channel: 'support',
          body: body.trim(),
        }),
      ));
      setBody('');
      setSelected(new Set());
      toast.success(`Sent to ${selected.size} creator${selected.size === 1 ? '' : 's'}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Creator coaching conversations and platform broadcasts
          </p>
        </div>
        <AdminSupportTabs />
      </div>

      {!messagingEnabled && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Creator messaging is turned off in Settings. Broadcasts are blocked until you re-enable it.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <section className="rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-[420px]">
            <div className="border-b border-border px-4 py-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Recipients
                </h2>
                <span className="text-caption text-muted-foreground tabular-nums">
                  {selected.size} selected
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search creators…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8 text-sm"
                  aria-label="Search creators"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-caption"
                  onClick={() => setSelected(new Set(filtered.map((c) => c.id)))}
                >
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-caption"
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No creators found</p>
              ) : (
                filtered.map((c) => {
                  const checked = selected.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm cursor-pointer transition-colors',
                        checked ? 'bg-primary/5' : 'hover:bg-muted/40',
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggle(c.id)} />
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-caption font-semibold bg-muted text-muted-foreground">
                          {initials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{c.name}</span>
                    </label>
                  );
                })
              )}
            </div>

            {(creatorStatus === 'CanLoadMore' || creatorStatus === 'LoadingMore') && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-caption text-muted-foreground"
                  disabled={creatorStatus === 'LoadingMore'}
                  onClick={() => loadMoreCreators(CREATOR_PAGE)}
                >
                  {creatorStatus === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Load more creators
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col min-h-[420px]">
            <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Compose broadcast
            </h2>
            <p className="text-caption text-muted-foreground mb-4">
              Send the same message to every selected creator.
            </p>
            <Label htmlFor="broadcast-body" className="text-caption text-muted-foreground mb-1.5">
              Message
            </Label>
            <Textarea
              id="broadcast-body"
              rows={8}
              className="flex-1 min-h-[160px] resize-none"
              placeholder={messagingEnabled ? 'Write a clear, professional message…' : 'Messaging is disabled'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={!messagingEnabled}
            />
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-caption text-muted-foreground">
                {selected.size === 0
                  ? 'Select recipients to enable send'
                  : `Ready for ${selected.size} creator${selected.size === 1 ? '' : 's'}`}
              </p>
              <Button
                size="sm"
                className="sm:min-w-[140px]"
                onClick={() => void send()}
                disabled={sending || !messagingEnabled || selected.size === 0 || !body.trim()}
              >
                {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                Send broadcast
              </Button>
            </div>
          </section>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent broadcasts</h2>
          {(supportStatus === 'CanLoadMore' || supportStatus === 'LoadingMore') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-caption h-7"
              disabled={supportStatus === 'LoadingMore'}
              onClick={() => loadMoreSupport(MSG_PAGE)}
            >
              {supportStatus === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Load more
            </Button>
          )}
        </div>

        {supportStatus === 'LoadingFirstPage' ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No broadcasts sent yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-card px-4 py-3.5 flex gap-3"
              >
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarFallback className="text-caption font-semibold bg-muted text-muted-foreground">
                    {initials(m.creatorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{m.creatorName}</p>
                    <p className="text-caption text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {m.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCreatorMessaging;
