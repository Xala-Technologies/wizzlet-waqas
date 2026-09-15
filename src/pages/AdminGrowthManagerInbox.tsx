import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminSupportTabs } from '@/components/dashboard/AdminSupportTabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Inbox, Send, Loader2, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function threadTimeLabel(ts: number) {
  const d = new Date(ts);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

const AdminGrowthManagerInbox = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const markedRef = useRef<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

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

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.messages[t.messages.length - 1]?.body ?? '').toLowerCase().includes(q),
    );
  }, [threads, query]);

  const active = useMemo(
    () => threads.find((t) => t.creatorId === activeId) ?? null,
    [threads, activeId],
  );

  useEffect(() => {
    if (activeId || threads.length === 0) return;
    // Desktop: open first thread by default; mobile keeps list-first.
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setActiveId(threads[0]!.creatorId);
    }
  }, [threads, activeId]);

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.creatorId, active?.messages.length]);

  const openThread = (thread: Thread) => {
    setActiveId(thread.creatorId);
  };

  const send = async () => {
    if (!growthEnabled) {
      toast.error('Growth chat is disabled in Settings');
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
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Creator coaching conversations and platform broadcasts
          </p>
        </div>
        <AdminSupportTabs />
      </div>

      {!growthEnabled && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Growth chat is turned off in Settings. Creators cannot message you, and replies are blocked.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold mb-1">No conversations yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When creators message the growth team, their threads will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-w-0">
          {/* Thread list */}
          <div
            className={cn(
              'rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-[min(70vh,560px)]',
              activeId && 'hidden lg:flex',
            )}
          >
            <div className="border-b border-border px-3 py-3 space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-sm font-semibold">Inbox</p>
                {totalUnread > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-semibold text-primary-foreground">
                    {totalUnread}
                  </span>
                ) : (
                  <span className="text-caption text-muted-foreground">{threads.length} open</span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search creators…"
                  className="h-9 pl-8 text-sm"
                  aria-label="Search conversations"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No matches</p>
              ) : (
                filteredThreads.map((t) => {
                  const last = t.messages[t.messages.length - 1];
                  const selected = active?.creatorId === t.creatorId;
                  return (
                    <button
                      key={t.creatorId}
                      type="button"
                      onClick={() => openThread(t)}
                      className={cn(
                        'w-full text-left px-3.5 py-3 border-b border-border/70 last:border-0 transition-colors',
                        selected ? 'bg-primary/5' : 'hover:bg-muted/40',
                      )}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9 mt-0.5">
                          <AvatarFallback className="text-caption font-semibold bg-muted text-muted-foreground">
                            {initials(t.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-sm truncate', t.unread > 0 ? 'font-semibold' : 'font-medium')}>
                              {t.name}
                            </p>
                            <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
                              {threadTimeLabel(t.lastAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-caption text-muted-foreground truncate flex-1">
                              {last?.sender_role === 'admin' ? 'You: ' : ''}
                              {last?.body ?? 'No messages'}
                            </p>
                            {t.unread > 0 && (
                              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-caption font-semibold text-primary-foreground shrink-0">
                                {t.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {(status === 'CanLoadMore' || status === 'LoadingMore') && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-caption text-muted-foreground"
                  disabled={status === 'LoadingMore'}
                  onClick={() => loadMore(PAGE_SIZE)}
                >
                  {status === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Load earlier messages
                </Button>
              </div>
            )}
          </div>

          {/* Conversation pane */}
          <div
            className={cn(
              'rounded-xl border border-border bg-card flex-col min-w-0 min-h-[min(70vh,560px)]',
              activeId ? 'flex' : 'hidden lg:flex',
            )}
          >
            {active ? (
              <>
                <div className="border-b border-border px-3 sm:px-5 py-3.5 flex items-center gap-3">
                  <button
                    type="button"
                    className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    aria-label="Back to inbox"
                    onClick={() => setActiveId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-caption font-semibold bg-muted text-muted-foreground">
                      {initials(active.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate">{active.name}</h2>
                    <p className="text-caption text-muted-foreground">Growth coaching</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-muted/20">
                  {active.messages.map((m) => {
                    const fromAdmin = m.sender_role === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={cn('flex gap-2', fromAdmin ? 'justify-end' : 'justify-start')}
                      >
                        {!fromAdmin && (
                          <Avatar className="h-7 w-7 mt-0.5">
                            <AvatarFallback className="text-caption font-semibold bg-muted text-muted-foreground">
                              {initials(active.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-[min(85%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                            fromAdmin
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-background border border-border rounded-bl-md',
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                          <div
                            className={cn(
                              'mt-1.5 flex items-center justify-between gap-2 text-caption',
                              fromAdmin ? 'text-primary-foreground/65' : 'text-muted-foreground',
                            )}
                          >
                            <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                            {fromAdmin && <MessageSeenReceipt seen={m.read} light />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                <div className="border-t border-border p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder={growthEnabled ? 'Write a reply…' : 'Messaging is disabled'}
                      disabled={!growthEnabled}
                      rows={2}
                      className="resize-none min-w-0 flex-1 min-h-[72px]"
                    />
                    <Button
                      onClick={() => void send()}
                      disabled={sending || !growthEnabled || !reply.trim()}
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      aria-label="Send reply"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-caption text-muted-foreground mt-2 hidden sm:block">
                    Press ⌘ Enter to send
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <Inbox className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">Select a conversation</p>
                <p className="text-caption text-muted-foreground max-w-xs">
                  Choose a creator on the left to review their thread and reply.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminGrowthManagerInbox;
