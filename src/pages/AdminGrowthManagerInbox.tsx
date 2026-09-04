import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Inbox, Send, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  creator_id: string;
  sender_role: string;
  channel: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Thread {
  creatorId: string;
  name: string;
  messages: Message[];
  unread: number;
  lastAt: string;
}

const AdminGrowthManagerInbox = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('id, creator_id, sender_role, channel, body, read, created_at')
      .order('created_at', { ascending: true });
    if (error) { toast.error(error.message); setLoading(false); return; }

    const rows = (data ?? []) as Message[];
    const creatorIds = [...new Set(rows.map(r => r.creator_id))];
    const { data: creators } = creatorIds.length
      ? await supabase.from('creators').select('id, display_name, username').in('id', creatorIds)
      : { data: [] as { id: string; display_name: string | null; username: string | null }[] };
    const nameMap = new Map((creators ?? []).map(c => [c.id, c.display_name || c.username || 'Unnamed creator']));

    const grouped = new Map<string, Message[]>();
    rows.forEach(r => grouped.set(r.creator_id, [...(grouped.get(r.creator_id) ?? []), r]));

    const list: Thread[] = [...grouped.entries()].map(([creatorId, messages]) => ({
      creatorId,
      name: nameMap.get(creatorId) ?? 'Unknown creator',
      messages,
      unread: messages.filter(m => m.sender_role === 'creator' && !m.read).length,
      lastAt: messages[messages.length - 1].created_at,
    })).sort((a, b) => b.lastAt.localeCompare(a.lastAt));

    setThreads(list);
    setActiveId(prev => prev ?? list[0]?.creatorId ?? null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const active = useMemo(() => threads.find(t => t.creatorId === activeId) ?? null, [threads, activeId]);

  const openThread = async (thread: Thread) => {
    setActiveId(thread.creatorId);
    const unreadIds = thread.messages.filter(m => m.sender_role === 'creator' && !m.read).map(m => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from('support_messages').update({ read: true }).in('id', unreadIds);
    setThreads(prev => prev.map(t => t.creatorId === thread.creatorId
      ? { ...t, unread: 0, messages: t.messages.map(m => ({ ...m, read: true })) }
      : t));
  };

  const send = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from('support_messages')
      .insert({ creator_id: active.creatorId, sender_role: 'admin', channel: 'growth', body: reply.trim(), read: true })
      .select('id, creator_id, sender_role, channel, body, read, created_at')
      .maybeSingle();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    if (data) {
      setThreads(prev => prev.map(t => t.creatorId === active.creatorId
        ? { ...t, messages: [...t.messages, data as Message], lastAt: data.created_at }
        : t));
    }
    setReply('');
  };

  const totalUnread = threads.reduce((a, t) => a + t.unread, 0);

  return (
    <DashboardLayout type="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Growth Manager Inbox</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{totalUnread} unread · {threads.length} conversations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No creator conversations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {threads.map(t => (
              <button
                key={t.creatorId}
                onClick={() => openThread(t)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                  activeId === t.creatorId ? 'bg-muted/50' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  {t.unread > 0 && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{t.unread}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{t.messages[t.messages.length - 1].body}</p>
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
                  {active.messages.map(m => (
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
                  <Textarea rows={2} placeholder="Reply to this creator…" value={reply} onChange={e => setReply(e.target.value)} />
                  <Button variant="hero" size="sm" onClick={send} disabled={sending || !reply.trim()}>
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminGrowthManagerInbox;
