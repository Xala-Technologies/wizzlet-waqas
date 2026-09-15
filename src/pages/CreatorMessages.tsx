import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Archive,
  ArrowLeft,
  Ban,
  Loader2,
  MessageSquare,
  Power,
  Search,
  Send,
  Shield,
  Sparkles,
  Star,
  MailOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_MESSAGES_DEMO_THREADS,
  isCreatorMessagesDemoId,
  shouldUseCreatorMessagesDemo,
  type DemoMessageThread,
} from '@/lib/creatorMessagesDemo';
import { initialsFromName } from '@/lib/creatorSubscribersDemo';
import { segmentedItemClassName, segmentedTrackClassName } from '@/lib/segmentedControl';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const SUPPORT_THREAD_ID = '__prizelet_support__';
const NOTES_KEY_PREFIX = 'prizelet:creator-msg-notes:';

type InboxTab = 'all' | 'unread' | 'starred' | 'archive';
type ThreadKind = 'subscriber' | 'support' | 'demo';
type SubStatus = 'active' | 'cancelled' | 'trial';

interface ChatMessage {
  id: string;
  sender_role: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  id: string;
  kind: ThreadKind;
  name: string;
  email: string;
  messages: ChatMessage[];
  unread: number;
  lastAt: string;
  online: boolean;
  starred: boolean;
  archived: boolean;
  plan: string;
  status: SubStatus | 'support';
  memberSinceMs: number | null;
  totalSpentCents: number | null;
  isDemo: boolean;
}

function mapPlan(amountCents: number | undefined): string {
  if (amountCents == null) return '—';
  if (amountCents >= 5000) return 'VIP';
  if (amountCents >= 2500) return 'Premium';
  return 'Monthly';
}

function mapStatus(status: string | undefined): SubStatus {
  if (status === 'active') return 'active';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'trial';
}

function statusPill(status: SubStatus | 'support'): string {
  if (status === 'support') return 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400';
  if (status === 'active') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400';
  if (status === 'cancelled') return 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400';
  return 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400';
}

function shortTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60_000) return 'now';
  if (diffMs < 3_600_000) return `${Math.max(1, Math.floor(diffMs / 60_000))}m`;
  if (diffMs < 86_400_000) return `${Math.max(1, Math.floor(diffMs / 3_600_000))}h`;
  if (diffMs < 7 * 86_400_000) return `${Math.max(1, Math.floor(diffMs / 86_400_000))}d`;
  return format(d, 'MMM d');
}

function demoToThread(d: DemoMessageThread): Thread {
  const messages = d.messages
    .slice()
    .sort((a, b) => a.createdAtMs - b.createdAtMs)
    .map((m) => ({
      id: m.id,
      sender_role: m.sender_role,
      body: m.body,
      read: m.read,
      created_at: new Date(m.createdAtMs).toISOString(),
    }));
  return {
    id: d.id,
    kind: 'demo',
    name: d.name,
    email: d.email,
    messages,
    unread: d.unread,
    lastAt: messages[messages.length - 1]?.created_at ?? new Date(d.memberSinceMs).toISOString(),
    online: d.online,
    starred: d.starred,
    archived: d.archived,
    plan: d.plan,
    status: d.status,
    memberSinceMs: d.memberSinceMs,
    totalSpentCents: d.totalSpentCents,
    isDemo: true,
  };
}

function readNotes(threadId: string): string {
  try {
    return localStorage.getItem(`${NOTES_KEY_PREFIX}${threadId}`) ?? '';
  } catch {
    return '';
  }
}

function writeNotes(threadId: string, value: string) {
  try {
    localStorage.setItem(`${NOTES_KEY_PREFIX}${threadId}`, value);
  } catch {
    /* ignore quota / private mode */
  }
}

const CreatorMessages = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const subscriberIdParam = searchParams.get('subscriberId');
  const threadParam = searchParams.get('thread');
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { results: inbox, status: inboxStatus, loadMore } = usePaginatedQuery(
    api.messaging.mutations.myCreatorInboxPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const subscribers = useQuery(api.subscriptions.mutations.listSubscribersDetailed);
  const supportRows = useQuery(api.support.mutations.listForMyCreator);
  const setMessagingEnabledMut = useMutation(api.messaging.mutations.setMessagingEnabled);
  const sendMessage = useMutation(api.messaging.mutations.send);
  const markRead = useMutation(api.messaging.mutations.markReadCreator);
  const markReadSupport = useMutation(api.support.mutations.markReadCreator);

  const initialActive =
    threadParam === 'support' ? SUPPORT_THREAD_ID : subscriberIdParam;
  const [activeId, setActiveId] = useState<string | null>(initialActive);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [tab, setTab] = useState<InboxTab>('all');
  const [search, setSearch] = useState('');
  const [starredIds, setStarredIds] = useState<Set<string>>(
    () => new Set(CREATOR_MESSAGES_DEMO_THREADS.filter((t) => t.starred).map((t) => t.id)),
  );
  const [archivedIds, setArchivedIds] = useState<Set<string>>(
    () => new Set(CREATOR_MESSAGES_DEMO_THREADS.filter((t) => t.archived).map((t) => t.id)),
  );
  const [notes, setNotes] = useState('');
  const markedRef = useRef<Set<string>>(new Set());
  const prevActiveIdRef = useRef<string | null>(activeId);

  useEffect(() => {
    if (threadParam === 'support') setActiveId(SUPPORT_THREAD_ID);
    else if (subscriberIdParam) setActiveId(subscriberIdParam);
  }, [subscriberIdParam, threadParam]);

  useEffect(() => {
    if (creator) setMessagingEnabled(creator.messaging_enabled ?? true);
  }, [creator]);

  useEffect(() => {
    if (prevActiveIdRef.current !== activeId) {
      setReply('');
      prevActiveIdRef.current = activeId;
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) {
      setNotes('');
      return;
    }
    setNotes(readNotes(activeId));
  }, [activeId]);

  const activeThreadMessages = useQuery(
    api.messaging.mutations.listThread,
    creator && activeId && activeId !== SUPPORT_THREAD_ID && !isCreatorMessagesDemoId(activeId)
      ? {
          creatorId: creator.id as Id<'creators'>,
          subscriberId: activeId as Id<'users'>,
        }
      : 'skip',
  );

  const supportThread = useMemo((): Thread | null => {
    if (supportRows === undefined) return null;
    const msgs = supportRows
      .filter((m) => m.channel === 'support')
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => ({
        id: m._id,
        sender_role: m.senderRole,
        body: m.body,
        read: m.read,
        created_at: new Date(m.createdAt).toISOString(),
      }));
    if (msgs.length === 0) return null;
    return {
      id: SUPPORT_THREAD_ID,
      kind: 'support',
      name: 'Prizelet Support',
      email: 'support@prizelet.com',
      messages: msgs,
      unread: msgs.filter((m) => m.sender_role === 'admin' && !m.read).length,
      lastAt: msgs[msgs.length - 1]?.created_at ?? '',
      online: true,
      starred: starredIds.has(SUPPORT_THREAD_ID),
      archived: archivedIds.has(SUPPORT_THREAD_ID),
      plan: '—',
      status: 'support',
      memberSinceMs: null,
      totalSpentCents: null,
      isDemo: false,
    };
  }, [supportRows, starredIds, archivedIds]);

  const subscriberThreads = useMemo(() => {
    if (inboxStatus === 'LoadingFirstPage') return [] as Thread[];
    const detailMap = new Map(
      (subscribers ?? []).map((s) => [
        s.userId as string,
        {
          name: s.user?.fullName || s.user?.username || s.user?.email || 'Subscriber',
          email: s.user?.email || '—',
          plan: mapPlan(s.amountCents),
          status: mapStatus(s.status),
          memberSinceMs: s.createdAt,
          totalSpentCents: s.amountCents ?? 0,
        },
      ]),
    );
    const grouped = new Map<string, ChatMessage[]>();
    for (const r of inbox) {
      const msg: ChatMessage = {
        id: r._id,
        sender_role: r.senderRole,
        body: r.body,
        read: r.read,
        created_at: new Date(r.createdAt).toISOString(),
      };
      grouped.set(r.subscriberId, [...(grouped.get(r.subscriberId) ?? []), msg]);
    }
    return [...grouped.entries()]
      .map(([subscriberId, messages]) => {
        const detail = detailMap.get(subscriberId);
        const sorted = messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
        return {
          id: subscriberId,
          kind: 'subscriber' as const,
          name: detail?.name ?? 'Subscriber',
          email: detail?.email ?? '—',
          messages: sorted,
          unread: sorted.filter((m) => m.sender_role === 'subscriber' && !m.read).length,
          lastAt: sorted[sorted.length - 1]?.created_at ?? '',
          online: false,
          starred: starredIds.has(subscriberId),
          archived: archivedIds.has(subscriberId),
          plan: detail?.plan ?? '—',
          status: detail?.status ?? ('trial' as const),
          memberSinceMs: detail?.memberSinceMs ?? null,
          totalSpentCents: detail?.totalSpentCents ?? null,
          isDemo: false,
        };
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [inbox, inboxStatus, subscribers, starredIds, archivedIds]);

  const useDemo = shouldUseCreatorMessagesDemo({
    realThreadCount: subscriberThreads.length + (supportThread ? 1 : 0),
    forceDemo,
    disableDemo,
  });

  const demoThreads = useMemo(
    () =>
      CREATOR_MESSAGES_DEMO_THREADS.map((d) => ({
        ...demoToThread(d),
        starred: starredIds.has(d.id),
        archived: archivedIds.has(d.id),
      })),
    [starredIds, archivedIds],
  );

  const threads = useMemo(() => {
    const list: Thread[] = [];
    if (supportThread) list.push(supportThread);
    if (useDemo) {
      list.push(...demoThreads);
    } else if (messagingEnabled) {
      list.push(...subscriberThreads);
    }
    return list;
  }, [supportThread, useDemo, demoThreads, messagingEnabled, subscriberThreads]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (tab === 'all' && t.archived) return false;
      if (tab === 'unread' && (t.unread <= 0 || t.archived)) return false;
      if (tab === 'starred' && (!t.starred || t.archived)) return false;
      if (tab === 'archive' && !t.archived) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.messages[t.messages.length - 1]?.body ?? '').toLowerCase().includes(q)
      );
    });
  }, [threads, tab, search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    if (!activeId && filteredThreads.length > 0) setActiveId(filteredThreads[0]?.id ?? null);
  }, [filteredThreads, activeId]);

  const active = useMemo(() => {
    if (!activeId) return null;
    if (activeId === SUPPORT_THREAD_ID) return supportThread;
    if (isCreatorMessagesDemoId(activeId)) {
      return demoThreads.find((t) => t.id === activeId) ?? null;
    }
    const base = subscriberThreads.find((t) => t.id === activeId);
    if (!base) return null;
    if (activeThreadMessages) {
      return {
        ...base,
        messages: activeThreadMessages.map((m) => ({
          id: m._id,
          sender_role: m.senderRole,
          body: m.body,
          read: m.read,
          created_at: new Date(m.createdAt).toISOString(),
        })),
      };
    }
    return base;
  }, [activeId, supportThread, subscriberThreads, activeThreadMessages, demoThreads]);

  useEffect(() => {
    if (!active || active.isDemo) return;
    if (active.kind === 'support') {
      const unreadIds = active.messages
        .filter((m) => m.sender_role === 'admin' && !m.read && !markedRef.current.has(m.id))
        .map((m) => m.id);
      if (unreadIds.length === 0) return;
      unreadIds.forEach((id) => markedRef.current.add(id));
      void markReadSupport({ messageIds: unreadIds as Id<'supportMessages'>[] }).catch(() => {
        unreadIds.forEach((id) => markedRef.current.delete(id));
      });
      return;
    }
    const unreadIds = active.messages
      .filter((m) => m.sender_role === 'subscriber' && !m.read && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markRead({ messageIds: unreadIds as Id<'directMessages'>[] }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [active, markRead, markReadSupport]);

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
    setActiveId(thread.id);
    if (thread.kind === 'support') {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('thread', 'support');
          next.delete('subscriberId');
          return next;
        },
        { replace: true },
      );
    } else if (thread.isDemo) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('subscriberId', thread.id);
          next.delete('thread');
          return next;
        },
        { replace: true },
      );
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('subscriberId', thread.id);
          next.delete('thread');
          return next;
        },
        { replace: true },
      );
    }
  };

  const backToList = () => {
    setActiveId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('subscriberId');
        next.delete('thread');
        return next;
      },
      { replace: true },
    );
  };

  const send = async () => {
    if (!active || active.kind === 'support' || !reply.trim() || sending) return;
    if (active.isDemo || !creator) {
      toast.message('Sample conversation', {
        description: 'Replies are preview-only. Real subscriber chats send through Convex.',
      });
      setReply('');
      return;
    }
    setSending(true);
    try {
      await sendMessage({
        creatorId: creator.id as Id<'creators'>,
        subscriberId: active.id as Id<'users'>,
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

  const toggleStar = (threadId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
    setArchivedIds((prev) => {
      if (!prev.has(threadId)) return prev;
      const next = new Set(prev);
      next.delete(threadId);
      return next;
    });
    toast.success('Starred', { description: 'Conversation flagged for later (local only).' });
  };

  const toggleArchive = (threadId: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
    toast.success('Archived', { description: 'Moved to Archive (local only).' });
  };

  const busy =
    creatorLoading ||
    inboxStatus === 'LoadingFirstPage' ||
    subscribers === undefined ||
    supportRows === undefined;

  if (busy) {
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
          <h1 className="text-heading font-bold text-foreground">Messages</h1>
          <p className="mt-0.5 text-support text-muted-foreground">
            Direct conversations with your subscribers
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <MessageSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to start receiving subscriber messages.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!messagingEnabled && !supportThread && !useDemo) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-heading font-bold text-foreground">Messages</h1>
            <p className="mt-0.5 text-support text-muted-foreground">
              Direct conversations with your subscribers
            </p>
          </div>
          <div className="flex items-center gap-2 text-support text-muted-foreground">
            <Power className="h-3.5 w-3.5" />
            <span>Messaging off</span>
            <Switch
              aria-label="Accept subscriber messages"
              checked={messagingEnabled}
              onCheckedChange={(v) => void toggleMessaging(v)}
              disabled={savingToggle}
            />
          </div>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <MessageSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">
            Messaging is currently turned off
          </h3>
          <p className="mx-auto max-w-sm text-support text-muted-foreground">
            Enable messaging to receive messages from your subscribers. Prizelet Support still
            appears here when Support writes to you.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!useDemo && threads.length === 0) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-heading font-bold text-foreground">Messages</h1>
            <p className="mt-0.5 text-support text-muted-foreground">
              Direct conversations with your subscribers
            </p>
          </div>
          <div className="flex items-center gap-2 text-support text-muted-foreground">
            <Power
              className={cn('h-3.5 w-3.5', messagingEnabled ? 'text-emerald-500' : 'text-muted-foreground')}
            />
            <span className="sr-only sm:not-sr-only">
              {messagingEnabled ? 'Messaging on' : 'Messaging off'}
            </span>
            <Switch
              aria-label="Accept subscriber messages"
              checked={messagingEnabled}
              onCheckedChange={(v) => void toggleMessaging(v)}
              disabled={savingToggle}
            />
          </div>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <MessageSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No messages yet</h3>
          <p className="mx-auto mb-5 max-w-sm text-support text-muted-foreground">
            When Prizelet Support or a subscriber writes to you, the conversation appears here.
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/creator/subscribers">View subscribers</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isMine = (role: string) => role === 'creator';
  const showList = !activeId;
  const showChat = Boolean(activeId);

  const composer = (
    <div className="flex items-end gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Textarea
        placeholder="Write a reply…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={2}
        className="min-h-[2.75rem] min-w-0 flex-1 resize-none text-ui"
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
        className="h-11 min-h-11 w-11 min-w-11 shrink-0"
        aria-label="Send reply"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );

  const supportReadOnlyNote = (
    <div className="border-t border-border bg-muted/30 px-4 py-3">
      <p className="text-support text-muted-foreground">
        Prizelet Support broadcasts are one-way announcements — replies are not available here.
      </p>
    </div>
  );

  const tabs: { id: InboxTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'starred', label: 'Starred' },
    { id: 'archive', label: 'Archive' },
  ];

  return (
    <DashboardLayout type="creator">
      {useDemo ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — not live messages. Real subscriber chats replace this, or add{' '}
            <span className="font-mono text-xs">?demo=0</span> for the empty state.
          </p>
        </div>
      ) : null}

      {!messagingEnabled && supportThread ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-support text-muted-foreground">
          Subscriber messaging is off. You can still read Prizelet Support below.
        </p>
      ) : null}

      <div className="grid min-h-[min(70vh,640px)] grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(240px,280px)] lg:gap-5">
        {/* Left: thread list */}
        <section
          className={cn(
            'flex min-h-0 flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]',
            showChat ? 'hidden lg:flex' : 'flex',
          )}
        >
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-ui font-bold text-foreground">Your Messages</h1>
                <p className="mt-0.5 text-caption text-muted-foreground">Inbox &amp; support</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5" title="Accept subscriber messages">
                <Power
                  className={cn(
                    'h-3.5 w-3.5',
                    messagingEnabled ? 'text-emerald-500' : 'text-muted-foreground',
                  )}
                />
                <Switch
                  aria-label="Accept subscriber messages"
                  checked={messagingEnabled}
                  onCheckedChange={(v) => void toggleMessaging(v)}
                  disabled={savingToggle}
                  className="scale-90"
                />
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="h-11 rounded-xl ps-9"
              />
            </div>
            <div className={cn(segmentedTrackClassName, 'w-full overflow-x-auto')}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={segmentedItemClassName(tab === t.id)}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredThreads.length === 0 ? (
              <p className="px-3 py-8 text-center text-support text-muted-foreground">
                No conversations in this view.
              </p>
            ) : (
              filteredThreads.map((thread) => {
                const snippet = thread.messages[thread.messages.length - 1]?.body ?? '';
                const selected = thread.id === activeId;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => openThread(thread)}
                    className={cn(
                      'mb-1 flex w-full min-h-14 items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                      selected ? 'bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-caption font-bold',
                          thread.kind === 'support'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            : 'bg-muted text-foreground',
                        )}
                      >
                        {thread.kind === 'support' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          initialsFromName(thread.name)
                        )}
                      </div>
                      {thread.online && thread.kind !== 'support' ? (
                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500"
                          aria-label="Online"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-ui font-semibold text-foreground">{thread.name}</p>
                        <span className="shrink-0 text-caption text-muted-foreground">
                          {thread.lastAt ? shortTime(thread.lastAt) : ''}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-support text-muted-foreground">{snippet}</p>
                        {thread.unread > 0 ? (
                          <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-caption">
                            {thread.unread}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            {!useDemo &&
              messagingEnabled &&
              (inboxStatus === 'CanLoadMore' || inboxStatus === 'LoadingMore') && (
                <div className="flex justify-center py-2">
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
        </section>

        {/* Center: chat */}
        <section
          className={cn(
            'min-h-0 flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]',
            showList ? 'hidden lg:flex' : 'flex',
            !active && 'lg:flex',
          )}
        >
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-border px-3 py-3 sm:px-5">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground lg:hidden"
                  aria-label="Back to conversations"
                  onClick={backToList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-caption font-bold',
                      active.kind === 'support'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    {active.kind === 'support' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      initialsFromName(active.name)
                    )}
                  </div>
                  {active.online && active.kind !== 'support' ? (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ui font-semibold text-foreground">{active.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {active.kind === 'support'
                      ? 'Official announcements'
                      : active.online
                        ? 'Active now'
                        : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {active.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', isMine(msg.sender_role) ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-ui',
                        isMine(msg.sender_role)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-foreground',
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.body}</p>
                      <div
                        className={cn(
                          'mt-1 flex items-center justify-between gap-2 text-caption',
                          isMine(msg.sender_role)
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground',
                        )}
                      >
                        <span>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {isMine(msg.sender_role) && !active.isDemo ? (
                          <MessageSeenReceipt seen={msg.read} light />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {active.kind === 'support' ? supportReadOnlyNote : composer}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-support text-muted-foreground">
              Select a conversation
            </div>
          )}
        </section>

        {/* Right: subscriber details */}
        <aside
          className={cn(
            'hidden min-h-0 flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] lg:flex',
            !active || active.kind === 'support' ? 'opacity-60' : '',
          )}
        >
          {active && active.kind !== 'support' ? (
            <>
              <div className="border-b border-border p-5 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">
                  {initialsFromName(active.name)}
                </div>
                <p className="text-ui font-semibold text-foreground">{active.name}</p>
                <p className="mt-0.5 truncate text-support text-muted-foreground">{active.email}</p>
                <span
                  className={cn(
                    'mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-caption font-semibold capitalize',
                    statusPill(active.status),
                  )}
                >
                  {active.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 border-b border-border p-4">
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-caption text-muted-foreground">Member Since</p>
                  <p className="mt-0.5 text-support font-semibold text-foreground">
                    {active.memberSinceMs
                      ? format(new Date(active.memberSinceMs), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-caption text-muted-foreground">Plan</p>
                  <p className="mt-0.5 text-support font-semibold text-foreground">{active.plan}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-caption text-muted-foreground">Total Spent</p>
                  <p className="mt-0.5 text-support font-semibold text-foreground">
                    {active.totalSpentCents != null
                      ? `$${(active.totalSpentCents / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="border-b border-border p-4">
                <label htmlFor="creator-msg-notes" className="text-support font-semibold text-foreground">
                  Notes
                </label>
                <Textarea
                  id="creator-msg-notes"
                  value={notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes(v);
                    if (activeId) writeNotes(activeId, v);
                  }}
                  placeholder="Private notes about this subscriber…"
                  rows={4}
                  className="mt-2 resize-none text-ui"
                />
              </div>

              <div className="flex flex-col gap-2 p-4">
                <p className="text-support font-semibold text-foreground">Quick actions</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 justify-start"
                  onClick={() =>
                    toast.message('Marked unread', {
                      description: 'Unread state is preview-only for now.',
                    })
                  }
                >
                  <MailOpen className="mr-2 h-4 w-4" /> Mark unread
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 justify-start"
                  onClick={() => toggleStar(active.id)}
                >
                  <Star className="mr-2 h-4 w-4" /> Star
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 justify-start"
                  onClick={() =>
                    toast.message('Blocked', {
                      description: 'Blocking is preview-only and does not write to Convex.',
                    })
                  }
                >
                  <Ban className="mr-2 h-4 w-4" /> Block
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 justify-start"
                  onClick={() => toggleArchive(active.id)}
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-support text-muted-foreground">
              {active?.kind === 'support'
                ? 'Support threads have no subscriber details.'
                : 'Select a subscriber conversation for details.'}
            </div>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default CreatorMessages;
