import { useMemo, useState } from 'react';
import { useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  const [readOverrides, setReadOverrides] = useState<Set<string>>(new Set());

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.paginatedLists.listSupportMessagesPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const sendMessage = useMutation(api.support.mutations.send);

  const loading = status === 'LoadingFirstPage';

  const threads = useMemo((): Thread[] => {
    const rows: Message[] = (results ?? []).map((r) => ({
      id: r.id,
      creator_id: r.creatorId,
      sender_role: r.senderRole,
      channel: r.channel,
      body: r.body,
      read: r.read || readOverrides.has(r.id),
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
  }, [results, readOverrides]);

  const active = useMemo(
    () => threads.find((t) => t.creatorId === activeId) ?? threads[0] ?? null,
    [threads, activeId],
  );

  const openThread = (thread: Thread) => {
    setActiveId(thread.creatorId);
    const unreadIds = thread.messages.filter((m) => m.sender_role === 'creator' && !m.read).map((m) => m.id);
    if (unreadIds.length > 0) {
      setReadOverrides((prev) => new Set([...prev, ...unreadIds]));
    }
  };

  const send = async () => {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Growth Manager Inbox</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {totalUnread} unread · {threads.length} conversations from {(results ?? []).length} loaded messages
          {status === 'CanLoadMore' || status === 'LoadingMore' ? ' (more available)' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No creator conversations yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {threads.map((t) => (
                <button
                  key={t.creatorId}
                  onClick={() => openThread(t)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                    active?.creatorId === t.creatorId ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    {t.unread > 0 && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{t.unread}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{t.messages[t.messages.length - 1]?.body}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{format(new Date(t.lastAt), 'MMM d, HH:mm')}</p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col">
              {!active ? (
                <p className="text-sm text-muted-foreground">Select a conversation.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{active.name}</p>
                  </div>
                  <div className="space-y-2 flex-1 max-h-[420px] overflow-y-auto mb-4">
                    {active.messages.map((m) => (
                      <div key={m.id} className={`rounded-lg p-3 text-xs ${m.sender_role === 'admin' ? 'bg-primary/10 ml-10' : 'bg-muted/40 mr-10'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium capitalize">{m.sender_role === 'admin' ? 'You' : active.name}</p>
                          <Badge variant="outline" className="text-[9px] capitalize">{m.channel}</Badge>
                        </div>
                        <p className="text-muted-foreground whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{format(new Date(m.created_at), 'MMM d, HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea rows={2} placeholder="Reply to this creator…" value={reply} onChange={(e) => setReply(e.target.value)} />
                    <Button variant="hero" size="sm" onClick={send} disabled={sending || !reply.trim()}>
                      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {(status === 'CanLoadMore' || status === 'LoadingMore') && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" disabled={status === 'LoadingMore'} onClick={() => loadMore(PAGE_SIZE)}>
                {status === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Load more messages
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminGrowthManagerInbox;
