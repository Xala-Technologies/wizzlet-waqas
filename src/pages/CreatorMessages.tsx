import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { MessageSquare, User, Power, Loader2, Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';

const PAGE_SIZE = 25;

interface DirectMessage {
  id: string;
  subscriber_id: string;
  sender_role: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  subscriberId: string;
  name: string;
  messages: DirectMessage[];
  unread: number;
  lastAt: string;
}

const CreatorMessages = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const subscriberIdParam = searchParams.get('subscriberId');

  const { results: inbox, status: inboxStatus, loadMore } = usePaginatedQuery(
    api.messaging.mutations.myCreatorInboxPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const subscribers = useQuery(api.subscriptions.mutations.listSubscribersDetailed);
  const setMessagingEnabledMut = useMutation(api.messaging.mutations.setMessagingEnabled);
  const sendMessage = useMutation(api.messaging.mutations.send);
  const markRead = useMutation(api.messaging.mutations.markReadCreator);

  const [activeId, setActiveId] = useState<string | null>(subscriberIdParam);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const markedRef = useRef<Set<string>>(new Set());
  const prevActiveIdRef = useRef<string | null>(activeId);

  useEffect(() => {
    if (subscriberIdParam) setActiveId(subscriberIdParam);
  }, [subscriberIdParam]);

  useEffect(() => {
    if (creator) setMessagingEnabled(creator.messaging_enabled ?? true);
  }, [creator]);

  useEffect(() => {
    if (prevActiveIdRef.current !== activeId) {
      setReply('');
      prevActiveIdRef.current = activeId;
    }
  }, [activeId]);

  const activeThreadMessages = useQuery(
    api.messaging.mutations.listThread,
    creator && activeId
      ? {
          creatorId: creator.id as Id<'creators'>,
          subscriberId: activeId as Id<'users'>,
        }
      : 'skip',
  );

  const threads = useMemo(() => {
    if (inboxStatus === 'LoadingFirstPage') return [] as Thread[];
    const nameMap = new Map(
      (subscribers ?? []).map((s) => [
        s.userId,
        s.user?.fullName || s.user?.username || s.user?.email || 'Subscriber',
      ]),
    );
    const grouped = new Map<string, DirectMessage[]>();
    for (const r of inbox) {
      const msg: DirectMessage = {
        id: r._id,
        subscriber_id: r.subscriberId,
        sender_role: r.senderRole,
        body: r.body,
        read: r.read,
        created_at: new Date(r.createdAt).toISOString(),
      };
      grouped.set(r.subscriberId, [...(grouped.get(r.subscriberId) ?? []), msg]);
    }
    return [...grouped.entries()]
      .map(([subscriberId, messages]) => ({
        subscriberId,
        name: nameMap.get(subscriberId as Id<'users'>) ?? 'Subscriber',
        messages: messages.sort((a, b) => a.created_at.localeCompare(b.created_at)),
        unread: messages.filter((m) => m.sender_role === 'subscriber' && !m.read).length,
        lastAt: messages[messages.length - 1]?.created_at ?? '',
      }))
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [inbox, inboxStatus, subscribers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    if (!activeId && threads.length > 0) setActiveId(threads[0]?.subscriberId ?? null);
  }, [threads, activeId]);

  const active = useMemo(() => {
    if (!activeId) return null;
    const base = threads.find((t) => t.subscriberId === activeId);
    if (!base) return null;
    if (activeThreadMessages) {
      return {
        ...base,
        messages: activeThreadMessages.map((m) => ({
          id: m._id,
          subscriber_id: m.subscriberId,
          sender_role: m.senderRole,
          body: m.body,
          read: m.read,
          created_at: new Date(m.createdAt).toISOString(),
        })),
      };
    }
    return base;
  }, [threads, activeId, activeThreadMessages]);

  useEffect(() => {
    if (!active) return;
    const unreadIds = active.messages
      .filter((m) => m.sender_role === 'subscriber' && !m.read && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markRead({ messageIds: unreadIds as Id<'directMessages'>[] }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [active, markRead]);

  const toggleMessaging = async (next: boolean) => {
    setMessagingEnabled(next);
    setSavingToggle(true);
    try {
      await setMessagingEnabledMut({ enabled: next });
      toast.success(next ? 'Messaging enabled' : 'Messaging turned off');
    } catch (e) {
      setMessagingEnabled(!next);
      toast.error(e instanceof Error ? e.message : 'Failed to update messaging');
    } finally {
      setSavingToggle(false);
    }
  };

  const openThread = (thread: Thread) => {
    setActiveId(thread.subscriberId);
    setSearchParams({ subscriberId: thread.subscriberId }, { replace: true });
  };

  const backToList = () => {
    setActiveId(null);
    setSearchParams({}, { replace: true });
  };

  const send = async () => {
    if (!creator || !active || !reply.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        creatorId: creator.id as Id<'creators'>,
        subscriberId: active.subscriberId as Id<'users'>,
        senderRole: 'creator',
        body: reply.trim(),
      });
      setReply('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const busy = creatorLoading || inboxStatus === 'LoadingFirstPage' || subscribers === undefined;

  if (busy) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const header = (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-heading font-bold text-foreground">Messages</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Direct conversations with your subscribers
        </p>
      </div>
      {creator ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 min-h-11 py-2">
          <Power
            className={`h-4 w-4 shrink-0 ${messagingEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}
          />
          <span className="text-ui font-medium text-foreground">
            {messagingEnabled ? 'Messaging Active' : 'Messaging Off'}
          </span>
          <Switch
            aria-label="Accept subscriber messages"
            checked={messagingEnabled}
            onCheckedChange={(v) => void toggleMessaging(v)}
            disabled={savingToggle}
          />
        </div>
      ) : null}
    </header>
  );

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        {header}
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Finish onboarding to start receiving subscriber messages.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!messagingEnabled) {
    return (
      <DashboardLayout type="creator">
        {header}
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">
            Messaging is currently turned off
          </h3>
          <p className="text-support text-muted-foreground max-w-sm mx-auto">
            Enable messaging above to receive messages from your subscribers.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (threads.length === 0) {
    return (
      <DashboardLayout type="creator">
        {header}
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No messages yet</h3>
          <p className="text-support text-muted-foreground max-w-sm mx-auto mb-5">
            When a subscriber writes to you, the conversation appears here.
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/creator/subscribers">View subscribers</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const composer = (
    <div className="border-t border-border p-3 flex gap-2 items-end bg-card pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Textarea
        placeholder="Write a reply…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={2}
        className="resize-none min-w-0 flex-1 text-ui min-h-[2.75rem]"
        disabled={sending}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <Button
        type="button"
        onClick={() => void send()}
        disabled={sending || !reply.trim()}
        className="min-h-11 min-w-11 h-11 w-11 shrink-0"
        aria-label="Send reply"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <DashboardLayout type="creator">
      {header}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 min-w-0">
        <div className={cn('space-y-2', activeId && 'hidden lg:block')}>
          {threads.map((thread) => (
            <button
              key={thread.subscriberId}
              type="button"
              onClick={() => openThread(thread)}
              className={`w-full min-h-14 text-left rounded-xl border p-4 transition-colors ${
                thread.subscriberId === activeId
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-ui font-medium text-foreground truncate">{thread.name}</p>
                    {thread.unread > 0 && (
                      <Badge className="text-caption shrink-0">{thread.unread}</Badge>
                    )}
                  </div>
                  <p className="text-support text-muted-foreground truncate mt-0.5">
                    {thread.messages[thread.messages.length - 1]?.body}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {(inboxStatus === 'CanLoadMore' || inboxStatus === 'LoadingMore') && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={inboxStatus === 'LoadingMore'}
                onClick={() => loadMore(PAGE_SIZE)}
              >
                {inboxStatus === 'LoadingMore' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
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
                  onClick={backToList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <p className="text-ui font-semibold text-foreground truncate">{active.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {active.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_role === 'creator' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-ui ${
                        msg.sender_role === 'creator'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.body}</p>
                      <div
                        className={`mt-1 flex items-center justify-between gap-2 text-caption ${
                          msg.sender_role === 'creator'
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {msg.sender_role === 'creator' && (
                          <MessageSeenReceipt seen={msg.read} light />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block">{composer}</div>
              <div className="lg:hidden sticky bottom-0 z-20">{composer}</div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-support text-muted-foreground p-6">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorMessages;
