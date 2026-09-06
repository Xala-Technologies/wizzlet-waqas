import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
  const inbox = useQuery(api.messaging.mutations.myCreatorInbox);
  const subscribers = useQuery(api.subscriptions.mutations.listSubscribersDetailed);
  const setMessagingEnabledMut = useMutation(api.messaging.mutations.setMessagingEnabled);
  const sendMessage = useMutation(api.messaging.mutations.send);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [readLocally, setReadLocally] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (creator) setMessagingEnabled(creator.messaging_enabled ?? true);
  }, [creator]);

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
    if (!inbox) return [] as Thread[];
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
        read: r.read || readLocally.has(r._id),
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
  }, [inbox, subscribers, readLocally]);

  useEffect(() => {
    // Auto-select first thread only on desktop so phones stay on the list first.
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
          read: m.read || readLocally.has(m._id),
          created_at: new Date(m.createdAt).toISOString(),
        })),
      };
    }
    return base;
  }, [threads, activeId, activeThreadMessages, readLocally]);

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
    const unreadIds = thread.messages.filter((m) => m.sender_role === 'subscriber' && !m.read).map((m) => m.id);
    if (unreadIds.length > 0) {
      setReadLocally((prev) => new Set([...prev, ...unreadIds]));
    }
  };

  const send = async () => {
    if (!creator || !active || !reply.trim()) return;
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

  const busy = creatorLoading || inbox === undefined || subscribers === undefined;

  return (
    <DashboardLayout type="creator">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Direct conversations with your subscribers</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
          <Power className={`h-4 w-4 ${messagingEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium">{messagingEnabled ? 'Messaging Active' : 'Messaging Off'}</span>
          <Switch aria-label="Accept subscriber messages" checked={messagingEnabled} onCheckedChange={toggleMessaging} disabled={savingToggle || !creator} />
        </div>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !creator ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No creator profile yet</h3>
          <p className="text-sm text-muted-foreground">Finish onboarding to start receiving subscriber messages.</p>
        </div>
      ) : !messagingEnabled ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">Messaging is currently turned off</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Enable messaging above to receive messages from your subscribers.
          </p>
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When a subscriber writes to you, the conversation appears here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          <div className={cn('space-y-2', activeId && 'hidden lg:block')}>
            {threads.map(thread => (
              <button
                key={thread.subscriberId}
                type="button"
                onClick={() => openThread(thread)}
                className={`w-full min-h-14 text-left rounded-xl border p-4 transition-colors ${
                  thread.subscriberId === activeId ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40'
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
                        <Badge className="text-[10px] shrink-0">{thread.unread}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {thread.messages[thread.messages.length - 1].body}
                    </p>
                  </div>
                </div>
              </button>
            ))}
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
                  {active.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'creator' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                        msg.sender_role === 'creator' ? 'bg-primary text-primary-foreground' : 'bg-muted/60'
                      }`}>
                        <p className="whitespace-pre-line">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender_role === 'creator' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-3 flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Textarea
                    placeholder="Write a reply…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={2}
                    className="resize-none min-w-0 flex-1"
                  />
                  <Button onClick={send} disabled={sending || !reply.trim()} size="icon" className="h-11 w-11 shrink-0" aria-label="Send reply">
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

export default CreatorMessages;
