import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';
import { Seo } from '@/components/Seo';
import { useAppUser } from '@/hooks/useAppUser';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import {
  isMemberMessagesDemoId,
  MEMBER_MESSAGES_DEMO_THREADS,
  MEMBER_MESSAGES_SUPPORT_ID,
  shouldUseMemberMessagesDemo,
  type MemberMessagesDemoMessage,
} from '@/lib/memberMessagesDemo';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

type FilterKey = 'all' | 'creators' | 'support';

type UiMessage = {
  id: string;
  senderRole: 'creator' | 'subscriber' | 'support';
  body: string;
  read: boolean;
  createdAtMs: number;
};

type UiThread = {
  id: string;
  kind: 'creator' | 'support';
  username: string | null;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials: string;
  avatarTone: string;
  verified: boolean;
  online: boolean;
  unread: number;
  preview: string;
  listTimeLabel: string;
  lastAtMs: number;
  messages: UiMessage[];
  isDemo: boolean;
};

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatListTime(isoOrMs: string | number): string {
  const d = new Date(isoOrMs);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return format(d, 'HH:mm');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }
  return format(d, 'MMM d');
}

function formatBubbleTime(ms: number): string {
  return format(new Date(ms), 'HH:mm');
}

function sameCalendarDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function daySeparatorLabel(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  if (sameCalendarDay(ms, now.getTime())) return 'Today';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameCalendarDay(ms, y.getTime())) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

const CustomerMessages = () => {
  const { appUserId, loading: userLoading } = useAppUser();
  const [searchParams] = useSearchParams();
  const creatorIdParam = searchParams.get('creatorId');
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

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

  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(creatorIdParam);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [demoExtra, setDemoExtra] = useState<Record<string, MemberMessagesDemoMessage[]>>({});
  const markedRef = useRef<Set<string>>(new Set());
  const prevActiveIdRef = useRef<string | null>(activeId);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (creatorIdParam) setActiveId(creatorIdParam);
  }, [creatorIdParam]);

  useEffect(() => {
    if (prevActiveIdRef.current !== activeId) {
      setReply('');
      prevActiveIdRef.current = activeId;
    }
  }, [activeId]);

  const nameMap = useMemo(() => {
    const map = new Map<string, { name: string; username: string; avatarUrl: string | null }>();
    for (const s of subscriptions ?? []) {
      map.set(s.creator._id, {
        name: s.creator.displayName || s.creator.username || 'Creator',
        username: s.creator.username,
        avatarUrl: s.creator.avatarUrl ?? null,
      });
    }
    return map;
  }, [subscriptions]);

  const liveThreads: UiThread[] = useMemo(() => {
    if (inboxStatus === 'LoadingFirstPage') return [];
    const grouped = new Map<string, UiMessage[]>();
    for (const r of inbox) {
      const msg: UiMessage = {
        id: r._id,
        senderRole: r.senderRole === 'creator' ? 'creator' : 'subscriber',
        body: r.body,
        read: r.read,
        createdAtMs: r.createdAt,
      };
      grouped.set(r.creatorId, [...(grouped.get(r.creatorId) ?? []), msg]);
    }
    return [...grouped.entries()]
      .map(([creatorId, messages]) => {
        const sorted = [...messages].sort((a, b) => a.createdAtMs - b.createdAtMs);
        const last = sorted[sorted.length - 1];
        const meta = nameMap.get(creatorId);
        const displayName = meta?.name ?? 'Creator';
        return {
          id: creatorId,
          kind: 'creator' as const,
          username: meta?.username ?? null,
          displayName,
          bio: 'Subscribed creator on Prizelet.',
          avatarUrl: meta?.avatarUrl ?? null,
          avatarInitials: initialsFrom(displayName),
          avatarTone: 'bg-slate-900',
          verified: true,
          online: false,
          unread: sorted.filter((m) => m.senderRole === 'creator' && !m.read).length,
          preview: last?.body ?? '',
          listTimeLabel: last ? formatListTime(last.createdAtMs) : '',
          lastAtMs: last?.createdAtMs ?? 0,
          messages: sorted,
          isDemo: false,
        };
      })
      .sort((a, b) => b.lastAtMs - a.lastAtMs);
  }, [inbox, inboxStatus, nameMap]);

  const useDemo = shouldUseMemberMessagesDemo({
    threadCount: liveThreads.length,
    forceDemo,
    disableDemo,
  });

  const demoThreads: UiThread[] = useMemo(
    () =>
      MEMBER_MESSAGES_DEMO_THREADS.map((t) => {
        const extras = demoExtra[t.id] ?? [];
        const messages = [...t.messages, ...extras].sort((a, b) => a.createdAtMs - b.createdAtMs);
        const last = messages[messages.length - 1];
        const lastInbound = [...messages].reverse().find((m) => m.senderRole !== 'subscriber');
        const unread = extras.length > 0 ? 0 : t.unread;
        return {
          id: t.id,
          kind: t.kind,
          username: t.username,
          displayName: t.displayName,
          bio: t.bio,
          avatarUrl: null,
          avatarInitials: t.avatarInitials,
          avatarTone: t.avatarTone,
          verified: t.verified,
          online: t.online,
          unread,
          preview:
            unread > 0 && lastInbound
              ? lastInbound.body
              : (last?.body ?? t.preview),
          listTimeLabel: extras.length > 0 && last ? formatListTime(last.createdAtMs) : t.listTimeLabel,
          lastAtMs: last?.createdAtMs ?? t.lastAtMs,
          messages,
          isDemo: true,
        };
      }),
    [demoExtra],
  );

  const threads = useDemo ? demoThreads : liveThreads;

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === 'creators' && t.kind !== 'creator') return false;
      if (filter === 'support' && t.kind !== 'support') return false;
      if (!q) return true;
      return (
        t.displayName.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q) ||
        t.messages.some((m) => m.body.toLowerCase().includes(q))
      );
    });
  }, [threads, filter, search]);

  const activeLiveMessages = useQuery(
    api.messaging.mutations.listThread,
    appUserId && activeId && !useDemo && !isMemberMessagesDemoId(activeId)
      ? {
          creatorId: activeId as Id<'creators'>,
          subscriberId: appUserId,
        }
      : 'skip',
  );

  const active = useMemo(() => {
    if (!activeId) return null;
    const base = threads.find((t) => t.id === activeId);
    if (useDemo) return base ?? null;
    if (base) {
      if (activeLiveMessages) {
        return {
          ...base,
          messages: activeLiveMessages.map((m) => ({
            id: m._id,
            senderRole: (m.senderRole === 'creator' ? 'creator' : 'subscriber') as UiMessage['senderRole'],
            body: m.body,
            read: m.read,
            createdAtMs: m.createdAt,
          })),
        };
      }
      return base;
    }
    // Preselected via ?creatorId= with no prior inbox messages yet.
    const meta = nameMap.get(activeId);
    const displayName = meta?.name ?? 'Creator';
    return {
      id: activeId,
      kind: 'creator' as const,
      username: meta?.username ?? null,
      displayName,
      bio: 'Subscribed creator on Prizelet.',
      avatarUrl: meta?.avatarUrl ?? null,
      avatarInitials: initialsFrom(displayName),
      avatarTone: 'bg-slate-900',
      verified: true,
      online: false,
      unread: 0,
      preview: '',
      listTimeLabel: '',
      lastAtMs: 0,
      messages: (activeLiveMessages ?? []).map((m) => ({
        id: m._id,
        senderRole: (m.senderRole === 'creator' ? 'creator' : 'subscriber') as UiMessage['senderRole'],
        body: m.body,
        read: m.read,
        createdAtMs: m.createdAt,
      })),
      isDemo: false,
    };
  }, [activeId, threads, useDemo, activeLiveMessages, nameMap]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (creatorIdParam) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    if (!activeId && filteredThreads.length > 0) {
      setActiveId(filteredThreads[0]?.id ?? null);
    }
  }, [filteredThreads, activeId, creatorIdParam]);

  useEffect(() => {
    if (!active || active.isDemo) return;
    const unreadIds = active.messages
      .filter((m) => m.senderRole === 'creator' && !m.read && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markRead({ messageIds: unreadIds as Id<'directMessages'>[] }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [active, markRead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.id, active?.messages.length]);

  const send = async () => {
    if (!active || !reply.trim() || sending) return;
    const body = reply.trim();
    if (active.isDemo || isMemberMessagesDemoId(active.id)) {
      const msg: MemberMessagesDemoMessage = {
        id: `demo-local-${Date.now()}`,
        senderRole: 'subscriber',
        body,
        read: true,
        createdAtMs: Date.now(),
      };
      setDemoExtra((prev) => ({
        ...prev,
        [active.id]: [...(prev[active.id] ?? []), msg],
      }));
      setReply('');
      toast.message('Sample preview — messages sync after a real subscription.');
      return;
    }
    if (!appUserId) return;
    if (active.id === MEMBER_MESSAGES_SUPPORT_ID) {
      toast.message('Contact support from Help for live tickets.');
      return;
    }
    setSending(true);
    try {
      await sendMessage({
        creatorId: active.id as Id<'creators'>,
        subscriberId: appUserId,
        senderRole: 'subscriber',
        body,
      });
      setReply('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const busy =
    !useDemo &&
    (userLoading ||
      inboxStatus === 'LoadingFirstPage' ||
      (appUserId ? subscriptions === undefined : false));

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'creators', label: 'Creators' },
    { key: 'support', label: 'Support' },
  ];

  const Avatar = ({
    thread,
    size = 'md',
  }: {
    thread: Pick<UiThread, 'avatarUrl' | 'avatarInitials' | 'avatarTone' | 'displayName'>;
    size?: 'sm' | 'md' | 'lg';
  }) => {
    const sizeClass = size === 'lg' ? 'h-11 w-11 text-sm' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white',
          sizeClass,
          !thread.avatarUrl && thread.avatarTone,
        )}
      >
        {thread.avatarUrl ? (
          <img src={thread.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          thread.avatarInitials || initialsFrom(thread.displayName)
        )}
      </div>
    );
  };

  return (
    <DashboardLayout type="member">
      <Seo
        title="Messages — Prizelet"
        description="Chat with creators or get help from our support team."
      />

      <header className="mb-5">
        <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
          Messages
        </h1>
        <p className="mt-1.5 text-support text-muted-foreground">
          Chat with creators or get help from our support team.
        </p>
      </header>

      {useDemo ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample Messages inbox for design review. Add{' '}
            <code className="rounded bg-amber-500/20 px-1">?demo=0</code> for live threads only.
          </p>
        </div>
      ) : null}

      {busy ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid min-h-[min(70vh,640px)] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          {/* Inbox column */}
          <div
            className={cn(
              'flex min-h-0 flex-col border-border lg:border-r',
              activeId ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="space-y-3 border-b border-border p-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="h-10 rounded-xl border-border bg-muted/40 pl-9 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors',
                      filter === f.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-foreground">No conversations</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {search.trim()
                      ? 'Try a different search.'
                      : 'Subscribe to creators to start chatting.'}
                  </p>
                  {!search.trim() ? (
                    <Button asChild className="mt-4 rounded-xl" size="sm">
                      <Link to="/dashboard/discover">Browse creators</Link>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <ul>
                  {filteredThreads.map((thread) => {
                    const selected = thread.id === activeId;
                    return (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => setActiveId(thread.id)}
                          className={cn(
                            'flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left transition-colors',
                            selected ? 'bg-primary/5' : 'hover:bg-muted/50',
                          )}
                        >
                          <Avatar thread={thread} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-bold text-foreground">
                                {thread.displayName}
                              </p>
                              {thread.verified ? (
                                <BadgeCheck
                                  className="h-3.5 w-3.5 shrink-0 text-primary"
                                  aria-label="Verified"
                                />
                              ) : null}
                              <span className="ml-auto shrink-0 text-[11px] font-medium text-muted-foreground">
                                {thread.listTimeLabel}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="truncate text-sm text-muted-foreground">{thread.preview}</p>
                              {thread.unread > 0 ? (
                                <span className="ml-auto flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                                  {thread.unread > 9 ? '9+' : thread.unread}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!useDemo &&
              (inboxStatus === 'CanLoadMore' || inboxStatus === 'LoadingMore') ? (
                <div className="flex justify-center p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={inboxStatus === 'LoadingMore'}
                    onClick={() => loadMore(PAGE_SIZE)}
                  >
                    {inboxStatus === 'LoadingMore' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Chat column */}
          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-col',
              activeId ? 'flex' : 'hidden lg:flex',
            )}
          >
            {active ? (
              <>
                <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-5">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/50 lg:hidden"
                    aria-label="Back to conversations"
                    onClick={() => setActiveId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar thread={active} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-foreground">
                        {active.displayName}
                      </p>
                      {active.verified ? (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
                      ) : null}
                      {active.online ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{active.bio}</p>
                  </div>
                  {active.username ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="hidden h-9 rounded-xl border-border sm:inline-flex"
                    >
                      <Link to={creatorProfilePath(active.username)}>View Profile</Link>
                    </Button>
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        aria-label="Conversation options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {active.username ? (
                        <DropdownMenuItem asChild>
                          <Link to={creatorProfilePath(active.username)}>View profile</Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link to="/support">Open help center</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/discover">Discover creators</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/40 px-3 py-4 sm:px-5">
                  {active.messages.length === 0 ? (
                    <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
                      Say hello — start the conversation
                    </div>
                  ) : (
                    active.messages.map((msg, index) => {
                      const prev = active.messages[index - 1];
                      const showDay = !prev || !sameCalendarDay(prev.createdAtMs, msg.createdAtMs);
                      const mine = msg.senderRole === 'subscriber';
                      const showAvatar =
                        !mine && (!prev || prev.senderRole === 'subscriber' || showDay);
                      return (
                        <div key={msg.id}>
                          {showDay ? (
                            <div className="my-3 flex justify-center">
                              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-[var(--shadow-card)] ring-1 ring-border">
                                {daySeparatorLabel(msg.createdAtMs)}
                              </span>
                            </div>
                          ) : null}
                          <div className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start')}>
                            {!mine ? (
                              showAvatar ? (
                                <Avatar thread={active} size="sm" />
                              ) : (
                                <div className="w-8 shrink-0" />
                              )
                            ) : null}
                            <div className={cn('max-w-[min(100%,28rem)]', mine && 'items-end')}>
                              <div
                                className={cn(
                                  'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                                  mine
                                    ? 'rounded-br-md bg-primary text-primary-foreground'
                                    : 'rounded-bl-md bg-card text-foreground shadow-[var(--shadow-card)] ring-1 ring-border',
                                )}
                              >
                                <p className="whitespace-pre-line">{msg.body}</p>
                              </div>
                              <div
                                className={cn(
                                  'mt-1 flex items-center gap-1.5 px-1 text-[11px] font-medium text-muted-foreground',
                                  mine && 'justify-end',
                                )}
                              >
                                <span>{formatBubbleTime(msg.createdAtMs)}</span>
                                {mine ? <MessageSeenReceipt seen={msg.read} /> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground"
                      aria-label="Attach file"
                      onClick={() =>
                        toast.message(
                          active.isDemo
                            ? 'Sample preview — attachments need a live chat.'
                            : 'Attachments coming soon.',
                        )
                      }
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="relative min-w-0 flex-1">
                      <Textarea
                        placeholder="Type a message..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={1}
                        className="min-h-11 resize-none rounded-xl border-border pr-10 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void send();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                        aria-label="Emoji"
                        onClick={() =>
                          toast.message(
                            active.isDemo
                              ? 'Sample preview — emoji picker is design-only.'
                              : 'Emoji picker coming soon.',
                          )
                        }
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      type="button"
                      className="h-11 shrink-0 rounded-xl px-4 font-semibold"
                      disabled={sending || !reply.trim()}
                      onClick={() => void send()}
                    >
                      {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      Send
                      <Send className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm font-semibold text-foreground">Select a conversation</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Choose a creator from the list, or browse Discover to start chatting.
                </p>
                <Button asChild variant="outline" className="mt-2 rounded-xl">
                  <Link to="/dashboard/discover">Browse creators</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerMessages;
