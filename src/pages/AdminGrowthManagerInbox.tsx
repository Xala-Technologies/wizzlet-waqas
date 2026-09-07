import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminSupportTabs } from '@/components/dashboard/AdminSupportTabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Inbox, Send, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

interface Message {
  id: string;
  creator_id: string;
  sender_role: string;
  channel: string;
  body: string;
  read: boolean;
  created_at: number;
  creatorName: string;
}

interface Thread {
  creatorId: string;
  name: string;
  messages: Message[];
  unread: number;
  lastAt: number;
}

const AdminGrowthManagerInbox = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const markedRef = useRef<Set<string>>(new Set());

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.paginatedLists.listSupportMessagesPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const platformSettings = useQuery(api.platform.mutations.get);
  const sendMessage = useMutation(api.support.mutations.send);
  const markRead = useMutation(api.support.mutations.markReadAdmin);

  const flags = (platformSettings?.featureFlags ?? {}) as Record<string, unknown>;
  const growthEnabled =
    flags.growthManagerEnabled !== false && flags.growth_manager_enabled !== false;

  const loading = status === 'LoadingFirstPage';

  const threads = useMemo((): Thread[] => {
    const rows: Message[] = (results ?? [])
      .filter((r) => r.channel === 'growth')
      .map((r) => ({
        id: r.id,
        creator_id: r.creatorId,
        sender_role: r.senderRole,
        channel: r.channel,
        body: r.body,
        read: r.read,
        created_at: r.createdAt,
        creatorName: r.creatorName,
      }));

    const grouped = new Map<string, Message[]>();
    rows.forEach((r) => {
      const list = grouped.get(r.creator_id) ?? [];
      list.push(r);
      grouped.set(r.creator_id, list);
    });

    return [...grouped.entries()]
      .map(([creatorId, messages]) => {
        const sorted = [...messages].sort((a, b) => a.created_at - b.created_at);
        return {
          creatorId,
          name: sorted[0]?.creatorName ?? 'Unknown creator',
          messages: sorted,
          unread: sorted.filter((m) => m.sender_role === 'creator' && !m.read).length,
          lastAt: sorted[sorted.length - 1]?.created_at ?? 0,
        };
      })
      .sort((a, b) => b.lastAt - a.lastAt);
  }, [results]);

  const active = useMemo(
    () => threads.find((t) => t.creatorId === activeId) ?? threads[0] ?? null,
    [threads, activeId],
  );

  useEffect(() => {
    if (!active) return;
    const unreadIds = active.messages
      .filter((m) => m.sender_role === 'creator' && !m.read && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markRead({ messageIds: unreadIds as Id<'supportMessages'>[] }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [active, markRead]);

  const openThread = (thread: Thread) => {
    setActiveId(thread.creatorId);
  };

  const send = async () => {
    if (!growthEnabled) {
      toast.error('Growth Manager chat is disabled in Settings');
      return;
    }
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        creatorId: active.creatorId as Id<'creators'>,
        senderRole: 'admin',
        channel: 'growth',
        body: reply.trim(),
      });
      setReply('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const totalUnread = threads.reduce((a, t) => a + t.unread, 0);

  return (
    <DashboardLayout type="admin">
      <AdminSupportTabs />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Growth Manager Inbox</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {totalUnread} unread · {threads.length} conversations from {(results ?? []).length} loaded messages
        </p>
        {!growthEnabled && (
          <p className="text-amber-600 text-xs mt-2">Growth Manager chat is disabled in Settings — replies are blocked.</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No growth conversations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              {threads.map((t) => (
                <button
                  key={t.creatorId}
                  type="button"
                  onClick={() => openThread(t)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 ${
                    active?.creatorId === t.creatorId ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    {t.unread > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        {t.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {t.messages[t.messages.length - 1]?.body ?? ''}
                  </p>
                </button>
              ))}
            </div>
            {(status === 'CanLoadMore' || status === 'LoadingMore') && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={status === 'LoadingMore'}
                  onClick={() => loadMore(PAGE_SIZE)}
                >
                  {status === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Load more messages
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 flex flex-col min-h-[420px]">
            {active ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">{active.name}</h2>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[50vh] mb-4">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg p-3 text-xs ${
                        m.sender_role === 'admin' ? 'bg-primary/10 ml-8' : 'bg-muted/40 mr-8'
                      }`}
                    >
                      <p className="font-medium mb-1 capitalize">{m.sender_role}</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{m.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {format(new Date(m.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={growthEnabled ? 'Reply…' : 'Disabled in Settings'}
                    disabled={!growthEnabled}
                    className="min-h-[72px]"
                  />
                  <Button onClick={() => void send()} disabled={sending || !growthEnabled || !reply.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground m-auto">Select a conversation</p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminGrowthManagerInbox;
