import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { MessageSquare, User, Power, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface DirectMessage {
  id: string;
  creator_id: string;
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
  const { creator, loading: creatorLoading, reload } = useCreatorProfile();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    if (!creator) {
      if (!creatorLoading) setLoading(false);
      return;
    }
    setMessagingEnabled(creator.messaging_enabled ?? true);

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('direct_messages')
        .select('id, creator_id, subscriber_id, sender_role, body, read, created_at')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as DirectMessage[];
      const subscriberIds = [...new Set(rows.map(r => r.subscriber_id))];
      const { data: people } = subscriberIds.length
        ? await supabase.from('users').select('id, username, full_name, email').in('id', subscriberIds)
        : { data: [] as { id: string; username: string | null; full_name: string | null; email: string }[] };
      const nameMap = new Map((people ?? []).map(p => [p.id, p.full_name || p.username || p.email]));

      const grouped = new Map<string, DirectMessage[]>();
      rows.forEach(r => grouped.set(r.subscriber_id, [...(grouped.get(r.subscriber_id) ?? []), r]));

      const list: Thread[] = [...grouped.entries()]
        .map(([subscriberId, messages]) => ({
          subscriberId,
          name: nameMap.get(subscriberId) ?? 'Subscriber',
          messages,
          unread: messages.filter(m => m.sender_role === 'subscriber' && !m.read).length,
          lastAt: messages[messages.length - 1].created_at,
        }))
        .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

      setThreads(list);
      setActiveId(prev => prev ?? list[0]?.subscriberId ?? null);
      setLoading(false);
    };

    void load();
  }, [creator, creatorLoading]);

  const active = useMemo(() => threads.find(t => t.subscriberId === activeId) ?? null, [threads, activeId]);

  const toggleMessaging = async (next: boolean) => {
    if (!creator) return;
    setMessagingEnabled(next);
    setSavingToggle(true);
    const { error } = await supabase
      .from('creators')
      .update({ messaging_enabled: next })
      .eq('id', creator.id);
    setSavingToggle(false);
    if (error) {
      setMessagingEnabled(!next);
      toast.error(error.message);
      return;
    }
    toast.success(next ? 'Messaging enabled' : 'Messaging turned off');
    void reload();
  };

  const openThread = async (thread: Thread) => {
    setActiveId(thread.subscriberId);
    const unreadIds = thread.messages.filter(m => m.sender_role === 'subscriber' && !m.read).map(m => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from('direct_messages').update({ read: true }).in('id', unreadIds);
    setThreads(prev => prev.map(t => t.subscriberId === thread.subscriberId
      ? { ...t, unread: 0, messages: t.messages.map(m => ({ ...m, read: true })) }
      : t));
  };

  const send = async () => {
    if (!creator || !active || !reply.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        creator_id: creator.id,
        subscriber_id: active.subscriberId,
        sender_role: 'creator',
        body: reply.trim(),
        read: true,
      })
      .select('id, creator_id, subscriber_id, sender_role, body, read, created_at')
      .maybeSingle();
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      const msg = data as DirectMessage;
      setThreads(prev => prev.map(t => t.subscriberId === active.subscriberId
        ? { ...t, messages: [...t.messages, msg], lastAt: msg.created_at }
        : t));
      setReply('');
    }
  };

  const busy = creatorLoading || loading;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {threads.map(thread => (
              <button
                key={thread.subscriberId}
                onClick={() => openThread(thread)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
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

          <div className="lg:col-span-2 rounded-xl border border-border bg-card flex flex-col" style={{ minHeight: 420 }}>
            {active ? (
              <>
                <div className="border-b border-border px-5 py-3">
                  <p className="text-sm font-semibold">{active.name}</p>
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
                <div className="border-t border-border p-3 flex gap-2">
                  <Textarea
                    placeholder="Write a reply…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <Button onClick={send} disabled={sending || !reply.trim()} size="icon" className="h-auto">
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
