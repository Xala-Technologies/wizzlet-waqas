import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppUser } from '@/hooks/useAppUser';
import { MessageSquare, User, Loader2, Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';

const PAGE_SIZE = 25;

interface DirectMessage {
  id: string;
  creator_id: string;
  sender_role: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  creatorId: string;
  name: string;
  messages: DirectMessage[];
  unread: number;
  lastAt: string;
}

const CustomerMessages = () => {
  const { appUserId, loading: userLoading } = useAppUser();
  const [searchParams] = useSearchParams();
  const creatorIdParam = searchParams.get('creatorId');

  const { results: inbox, status: inboxStatus, loadMore } = usePaginatedQuery(
    api.messaging.mutations.mySubscriberInboxPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const subscriptions = useQuery(
    api.subscriptions.mutations.mySubscriptionsDetailed,
    appUserId ? {} : 'skip',
  );
  const sendMessage = useMutation(api.messaging.mutations.send);
  const markRead = useMutation(api.messaging.mutations.markReadSubscriber);

  const [activeId, setActiveId] = useState<string | null>(creatorIdParam);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const markedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (creatorIdParam) setActiveId(creatorIdParam);
  }, [creatorIdParam]);

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subscriptions ?? []) {
      map.set(
        s.creator._id,
        s.creator.displayName || s.creator.username || 'Creator',
      );
    }
    return map;
  }, [subscriptions]);

  const activeThreadMessages = useQuery(
    api.messaging.mutations.listThread,
    appUserId && activeId
      ? {
          creatorId: activeId as Id<'creators'>,
          subscriberId: appUserId,
        }
      : 'skip',
  );

  const threads = useMemo(() => {
    if (inboxStatus === 'LoadingFirstPage') return [] as Thread[];
    const grouped = new Map<string, DirectMessage[]>();
    for (const r of inbox) {
      const msg: DirectMessage = {
        id: r._id,
        creator_id: r.creatorId,
        sender_role: r.senderRole,
        body: r.body,
        read: r.read,
        created_at: new Date(r.createdAt).toISOString(),
      };
      grouped.set(r.creatorId, [...(grouped.get(r.creatorId) ?? []), msg]);
    }
    return [...grouped.entries()]
      .map(([creatorId, messages]) => ({
        creatorId,
        name: nameMap.get(creatorId) ?? 'Creator',
        messages: messages.sort((a, b) => a.created_at.localeCompare(b.created_at)),
        unread: messages.filter((m) => m.sender_role === 'creator' && !m.read).length,
        lastAt: messages[messages.length - 1]?.created_at ?? '',
      }))
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [inbox, inboxStatus, nameMap]);

  useEffect(() => {
    // Auto-select first thread only on desktop so phones stay on the list first.
    if (typeof window === 'undefined') return;
    if (creatorIdParam) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    if (!activeId && threads.length > 0) setActiveId(threads[0]?.creatorId ?? null);
  }, [threads, activeId, creatorIdParam]);

  const active = useMemo(() => {
    if (!activeId) return null;
    const base = threads.find((t) => t.creatorId === activeId);
    const name = nameMap.get(activeId) ?? base?.name ?? 'Creator';
    const mappedThreadMessages = activeThreadMessages
      ? activeThreadMessages.map((m) => ({
          id: m._id,
          creator_id: m.creatorId,
          sender_role: m.senderRole,
          body: m.body,
          read: m.read,
          created_at: new Date(m.createdAt).toISOString(),
        }))
      : null;
    if (base) {
      return {
        ...base,
        name,
        messages: mappedThreadMessages ?? base.messages,
      };
    }
    // Preselected via ?creatorId= with no prior inbox messages yet.
    return {
      creatorId: activeId,
      name,
      messages: mappedThreadMessages ?? [],
      unread: 0,
      lastAt: '',
    };
  }, [threads, activeId, activeThreadMessages, nameMap]);

  useEffect(() => {
    if (!active) return;
    const unreadIds = active.messages
      .filter((m) => m.sender_role === 'creator' && !m.read && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markRead({ messageIds: unreadIds as Id<'directMessages'>[] }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [active, markRead]);

  const openThread = (thread: Thread) => {
    setActiveId(thread.creatorId);
  };

  const send = async () => {
    if (!appUserId || !active || !reply.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        creatorId: active.creatorId as Id<'creators'>,
        subscriberId: appUserId,
        senderRole: 'subscriber',
        body: reply.trim(),
      });
      setReply('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const busy =
    userLoading ||
    inboxStatus === 'LoadingFirstPage' ||
    (appUserId ? subscriptions === undefined : false);

  const showEmpty = !busy && threads.length === 0 && !activeId;

  return (
    <DashboardLayout type="member">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Direct conversations with creators you subscribe to</p>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : showEmpty ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Start a conversation from a creator you subscribe to, or wait for them to message you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          <div className={cn('space-y-2', activeId && 'hidden lg:block')}>
            {threads.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No prior conversations
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.creatorId}
                  type="button"
                  onClick={() => openThread(thread)}
                  className={`w-full min-h-14 text-left rounded-xl border p-4 transition-colors ${
                    thread.creatorId === activeId ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{thread.name}</p>
                        {thread.unread > 0 && (
                          <Badge className="text-caption shrink-0">{thread.unread}</Badge>
                        )}
                      </div>
                      <p className="text-caption text-muted-foreground truncate mt-0.5">
                        {thread.messages[thread.messages.length - 1]?.body}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
            {(inboxStatus === 'CanLoadMore' || inboxStatus === 'LoadingMore') && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inboxStatus === 'LoadingMore'}
                  onClick={() => loadMore(PAGE_SIZE)}
                >
                  {inboxStatus === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Load more
                </Button>
              </div>
            )}
          </div>

          <div
            className={cn(
              'lg:col-span-2 rounded-xl border border-border bg-card flex-col min-w-0 min-h-[min(70vh,520px)] lg:min-h-[420px]',
              activeId ? 'flex' : 'hidden lg:flex',
            )}
          >
            {active ? (
              <>
                <div className="border-b border-border px-3 sm:px-5 py-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    aria-label="Back to conversations"
                    onClick={() => setActiveId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <p className="text-sm font-semibold truncate">{active.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {active.messages.length === 0 ? (
                    <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
                      Say hello — start the conversation
                    </div>
                  ) : (
                    active.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_role === 'subscriber' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                            msg.sender_role === 'subscriber'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/60'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.body}</p>
                          <div
                            className={`mt-1 flex items-center justify-between gap-2 text-caption ${
                              msg.sender_role === 'subscriber'
                                ? 'text-primary-foreground/60'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                            {msg.sender_role === 'subscriber' && (
                              <MessageSeenReceipt seen={msg.read} light />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-border p-3 flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Textarea
                    placeholder="Write a message…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={2}
                    className="resize-none min-w-0 flex-1"
                  />
                  <Button
                    onClick={send}
                    disabled={sending || !reply.trim() || !appUserId}
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerMessages;
