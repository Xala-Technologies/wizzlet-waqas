import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  Archive,
  ArrowLeft,
  Ban,
  CheckCheck,
  Crown,
  Gift,
  Loader2,
  MapPin,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Percent,
  Power,
  Radio,
  Search,
  Send,
  Shield,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  User,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_MESSAGES_DEMO_NOW_MS,
  CREATOR_MESSAGES_DEMO_THREADS,
  isCreatorMessagesDemoId,
  shouldUseCreatorMessagesDemo,
  type DemoMessageThread,
} from '@/lib/creatorMessagesDemo';
import { initialsFromName } from '@/lib/creatorSubscribersDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const SUPPORT_THREAD_ID = '__prizelet_support__';
const NOTES_KEY_PREFIX = 'prizelet:creator-msg-notes:';

type InboxTab = 'inbox' | 'unread' | 'starred' | 'archive' | 'broadcasts';
type ThreadKind = 'subscriber' | 'support' | 'demo';
type SubStatus = 'active' | 'cancelled' | 'trial';

interface ChatMessage {
  id: string;
  sender_role: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface ThreadNote {
  id: string;
  body: string;
  createdAtMs: number;
}

interface Thread {
  id: string;
  kind: ThreadKind;
  name: string;
  email: string;
  location: string | null;
  messages: ChatMessage[];
  unread: number;
  lastAt: string;
  online: boolean;
  lastActiveLabel: string | null;
  starred: boolean;
  archived: boolean;
  plan: string;
  planPriceCents: number | null;
  status: SubStatus | 'support';
  memberSinceMs: number | null;
  totalSpentCents: number | null;
  noteHistory: ThreadNote[];
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

function shortTime(iso: string, nowMs: number = Date.now()): string {
  const d = new Date(iso);
  const now = new Date(nowMs);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return format(d, 'h:mm a');
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
    location: d.location,
    messages,
    unread: d.unread,
    lastAt: messages[messages.length - 1]?.created_at ?? new Date(d.memberSinceMs).toISOString(),
    online: d.online,
    lastActiveLabel: d.lastActiveLabel,
    starred: d.starred,
    archived: d.archived,
    plan: d.plan,
    planPriceCents: d.planPriceCents,
    status: d.status,
    memberSinceMs: d.memberSinceMs,
    totalSpentCents: d.totalSpentCents,
    noteHistory: d.notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAtMs: n.createdAtMs,
    })),
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
  const [tab, setTab] = useState<InboxTab>('inbox');
  const [search, setSearch] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [starredIds, setStarredIds] = useState<Set<string>>(
    () => new Set(CREATOR_MESSAGES_DEMO_THREADS.filter((t) => t.starred).map((t) => t.id)),
  );
  const [archivedIds, setArchivedIds] = useState<Set<string>>(
    () => new Set(CREATOR_MESSAGES_DEMO_THREADS.filter((t) => t.archived).map((t) => t.id)),
  );
  const [notes, setNotes] = useState('');
  const markedRef = useRef<Set<string>>(new Set());
  const prevActiveIdRef = useRef<string | null>(activeId);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
      location: null,
      messages: msgs,
      unread: msgs.filter((m) => m.sender_role === 'admin' && !m.read).length,
      lastAt: msgs[msgs.length - 1]?.created_at ?? '',
      online: true,
      lastActiveLabel: null,
      starred: starredIds.has(SUPPORT_THREAD_ID),
      archived: archivedIds.has(SUPPORT_THREAD_ID),
      plan: '—',
      planPriceCents: null,
      status: 'support',
      memberSinceMs: null,
      totalSpentCents: null,
      noteHistory: [],
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
          planPriceCents: s.amountCents ?? null,
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
          location: null,
          messages: sorted,
          unread: sorted.filter((m) => m.sender_role === 'subscriber' && !m.read).length,
          lastAt: sorted[sorted.length - 1]?.created_at ?? '',
          online: false,
          lastActiveLabel: null,
          starred: starredIds.has(subscriberId),
          archived: archivedIds.has(subscriberId),
          plan: detail?.plan ?? '—',
          planPriceCents: detail?.planPriceCents ?? null,
          status: detail?.status ?? ('trial' as const),
          memberSinceMs: detail?.memberSinceMs ?? null,
          totalSpentCents: detail?.totalSpentCents ?? null,
          noteHistory: [],
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
      if (tab === 'inbox' && (t.archived || t.kind === 'support')) return false;
      if (tab === 'unread' && (t.unread <= 0 || t.archived)) return false;
      if (tab === 'starred' && (!t.starred || t.archived)) return false;
      if (tab === 'archive' && !t.archived) return false;
      if (tab === 'broadcasts' && t.kind !== 'support') return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.messages[t.messages.length - 1]?.body ?? '').toLowerCase().includes(q)
      );
    });
  }, [threads, tab, search]);

  const inboxUnread = useMemo(
    () => threads.filter((t) => t.unread > 0 && !t.archived && t.kind !== 'support').length,
    [threads],
  );

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
          <Button asChild size="sm">
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
          <Button asChild variant="outline" size="sm">
            <Link to="/creator/subscribers">View subscribers</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }


  const isMine = (role: string) => role === 'creator';
  const showList = !activeId;
  const showChat = Boolean(activeId);

  const saveNote = () => {
    if (!activeId || !noteDraft.trim()) return;
    const existing = readNotes(activeId);
    const next = existing ? `${existing}\n---\n${noteDraft.trim()}` : noteDraft.trim();
    writeNotes(activeId, next);
    setNotes(next);
    setNoteDraft('');
    toast.success('Note saved');
  };

  const statusLabel =
    active?.status === 'active'
      ? 'Active subscriber'
      : active?.status === 'cancelled'
        ? 'Canceled'
        : active?.status === 'trial'
          ? 'Trial'
          : active?.status === 'support'
            ? 'Support'
            : '';

  const tabs: { id: InboxTab; label: string; count?: number }[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      count: threads.filter((t) => !t.archived && t.kind !== 'support').length,
    },
    { id: 'unread', label: 'Unread', count: inboxUnread },
    { id: 'starred', label: 'Starred' },
    { id: 'archive', label: 'Archived' },
    { id: 'broadcasts', label: 'Broadcasts' },
  ];

  const listNowMs = useDemo ? CREATOR_MESSAGES_DEMO_NOW_MS : Date.now();

  const composer = (
    <div className="border-t border-border bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/20 p-2">
        <div className="flex shrink-0 items-center gap-0.5 pb-1">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Attach file"
            onClick={() => toast.message('Attachments coming soon')}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Emoji"
            onClick={() => toast.message('Emoji picker coming soon')}
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="GIF"
            onClick={() => toast.message('GIFs coming soon')}
          >
            <Gift className="h-4 w-4" />
          </button>
        </div>
        <Textarea
          placeholder="Write a message..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={1}
          className="min-h-[2.5rem] min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
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
          size="sm"
          className="shrink-0 px-4"
        >
          {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          Send
        </Button>
      </div>
    </div>
  );

  const supportReadOnlyNote = (
    <div className="border-t border-border bg-muted/30 px-4 py-3">
      <p className="text-support text-muted-foreground">
        Prizelet Support broadcasts are one-way announcements — replies are not available here.
      </p>
    </div>
  );

  return (
    <DashboardLayout type="creator">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Messages
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-medium text-muted-foreground sm:text-base">
            Connect with your subscribers, answer questions, and build your community.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() =>
            toast.message('New message', {
              description: 'Pick a subscriber from the list, or message them from Subscribers.',
            })
          }
        >
          <Pencil className="mr-1.5 h-4 w-4" /> New Message
        </Button>
      </header>

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
        <p className="mb-4 rounded-xl border border-border bg-muted/40 px-3 py-2 text-support text-muted-foreground">
          Subscriber messaging is off. You can still read Prizelet Support in Broadcasts.
        </p>
      ) : null}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'relative shrink-0 px-3 pb-3 pt-1 text-sm font-semibold transition-colors',
              tab === t.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.count != null && t.count > 0 ? (
              <span className="ml-1.5 tabular-nums text-muted-foreground">({t.count})</span>
            ) : null}
            {tab === t.id ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="grid min-h-[min(72vh,720px)] grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(280px,320px)]">
        {/* Inbox list */}
        <section
          className={cn(
            'flex min-h-0 flex-col border-border lg:border-r',
            showChat ? 'hidden lg:flex' : 'flex',
          )}
        >
          <div className="flex items-center gap-2 border-b border-border p-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="h-10 rounded-xl border-border bg-muted/30 ps-9"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
              aria-label="Filter conversations"
              onClick={() => toast.message('Sort & filter coming soon')}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredThreads.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
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
                      'relative mb-0.5 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                      selected
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold',
                          thread.kind === 'support'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            : cn('bg-violet-500/15 text-violet-700 dark:text-violet-300'),
                        )}
                      >
                        {thread.kind === 'support' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          initialsFromName(thread.name)
                        )}
                      </div>
                      {thread.online && thread.kind !== 'support' ? (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{thread.name}</p>
                        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                          {thread.lastAt ? shortTime(thread.lastAt, listNowMs) : ''}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {snippet}
                        </p>
                        {thread.unread > 0 ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
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
                    size="sm"
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

        {/* Chat */}
        <section
          className={cn(
            'min-h-0 flex-col border-border lg:border-r',
            showList ? 'hidden lg:flex' : 'flex',
            !active && 'lg:flex',
          )}
        >
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border px-3 py-3.5 sm:px-5">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
                  aria-label="Back to conversations"
                  onClick={backToList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold text-foreground">{active.name}</p>
                    {active.kind !== 'support' ? (
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold',
                          statusPill(active.status),
                        )}
                      >
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {active.kind === 'support'
                      ? 'Official Prizelet announcements'
                      : [
                          active.plan !== '—' ? active.plan : null,
                          active.memberSinceMs
                            ? `Member since ${format(new Date(active.memberSinceMs), 'MMM d, yyyy')}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Subscriber'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Conversation actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => toggleStar(active.id)}>
                      <Star className="mr-2 h-4 w-4" /> {active.starred ? 'Unstar' : 'Star'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchive(active.id)}>
                      <Archive className="mr-2 h-4 w-4" />{' '}
                      {active.archived ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/10 p-4 sm:p-5">
                {active.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', isMine(msg.sender_role) ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[min(85%,28rem)] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                        isMine(msg.sender_role)
                          ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-2xl rounded-bl-md border border-border bg-card text-foreground',
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.body}</p>
                      <div
                        className={cn(
                          'mt-1.5 flex items-center justify-end gap-1.5 text-[11px]',
                          isMine(msg.sender_role)
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground',
                        )}
                      >
                        <span>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                        {isMine(msg.sender_role) && !active.isDemo ? (
                          <MessageSeenReceipt seen={msg.read} light />
                        ) : isMine(msg.sender_role) && msg.read ? (
                          <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {active.kind === 'support' ? supportReadOnlyNote : composer}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">Select a conversation</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Choose a subscriber from the inbox to read and reply.
              </p>
            </div>
          )}
        </section>

        {/* CRM panel */}
        <aside
          className={cn(
            'hidden min-h-0 flex-col overflow-y-auto lg:flex',
            !active || active.kind === 'support' ? 'opacity-55' : '',
          )}
        >
          {active && active.kind !== 'support' ? (
            <>
              <div className="border-b border-border px-5 pb-5 pt-6 text-center">
                <div
                  className={cn(
                    'mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold',
                    kpiIconTone.violet,
                  )}
                >
                  {initialsFromName(active.name)}
                </div>
                <p className="text-base font-bold text-foreground">{active.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{active.email}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  {active.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {active.location}
                    </span>
                  ) : null}
                  {active.memberSinceMs ? (
                    <span>Joined {format(new Date(active.memberSinceMs), 'MMM d, yyyy')}</span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                    statusPill(active.status),
                  )}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-border p-4">
                <div className="rounded-xl border border-border bg-muted/20 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Total spent
                  </p>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-foreground">
                    {active.totalSpentCents != null
                      ? `$${(active.totalSpentCents / 100).toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Messages
                  </p>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-foreground">
                    {active.messages.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-2 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Last active
                  </p>
                  <p className="mt-1 text-[11px] font-bold leading-tight text-foreground">
                    {active.lastActiveLabel ??
                      (active.online ? 'Now' : active.lastAt ? shortTime(active.lastAt, listNowMs) : '—')}
                  </p>
                </div>
              </div>

              <div className="border-b border-border p-4">
                <div className="rounded-xl border border-border bg-muted/15 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          kpiIconTone.amber,
                        )}
                      >
                        <Crown className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          Subscription
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-foreground">{active.plan}</p>
                        <p className="text-xs text-muted-foreground">
                          {active.planPriceCents != null
                            ? `$${(active.planPriceCents / 100).toFixed(2)} / month`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-lg"
                      asChild
                    >
                      <Link to="/creator/subscribers">Manage</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1 border-b border-border p-3">
                <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Quick actions
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-start rounded-xl px-2"
                  asChild
                >
                  <Link to="/creator/subscribers">
                    <User className="mr-2 h-4 w-4" /> View Profile
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-start rounded-xl px-2"
                  asChild
                >
                  <Link to="/creator/products">
                    <Percent className="mr-2 h-4 w-4" /> Update Subscription
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-start rounded-xl px-2"
                  onClick={() =>
                    toast.message('Discounts', {
                      description: 'Offer discounts from Products or promo tools.',
                    })
                  }
                >
                  <Gift className="mr-2 h-4 w-4" /> Give a Discount
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-start rounded-xl px-2"
                  onClick={() => setTab('broadcasts')}
                >
                  <Radio className="mr-2 h-4 w-4" /> Send Broadcast
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-start rounded-xl bg-rose-500/10 px-2 text-rose-600 hover:bg-rose-500/15 hover:text-rose-700 dark:text-rose-400"
                  onClick={() =>
                    toast.message('Blocked', {
                      description: 'Blocking is preview-only and does not write to Convex.',
                    })
                  }
                >
                  <Ban className="mr-2 h-4 w-4" /> Block User
                </Button>
              </div>

              <div className="space-y-3 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <div className="flex gap-2">
                  <Input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add a note..."
                    className="h-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    className="h-10 shrink-0 rounded-xl"
                    disabled={!noteDraft.trim()}
                    onClick={saveNote}
                  >
                    Save
                  </Button>
                </div>
                <ul className="space-y-2">
                  {active.noteHistory.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"
                    >
                      <p className="text-xs leading-snug text-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                        {format(n.createdAtMs, 'MMM d, yyyy')}
                      </p>
                    </li>
                  ))}
                  {notes
                    ? notes.split('\n---\n').filter(Boolean).map((body, i) => (
                        <li
                          key={`local-note-${i}`}
                          className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"
                        >
                          <p className="text-xs leading-snug text-foreground">{body}</p>
                          <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                            Saved locally
                          </p>
                        </li>
                      ))
                    : null}
                  {active.noteHistory.length === 0 && !notes ? (
                    <p className="text-xs text-muted-foreground">No notes yet.</p>
                  ) : null}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <UserMinus className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {active?.kind === 'support'
                  ? 'Support broadcasts have no subscriber profile.'
                  : 'Select a conversation to see subscriber details.'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default CreatorMessages;
