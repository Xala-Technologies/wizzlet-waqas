import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CreatorOption {
  id: string;
  name: string;
}

interface SentMessage {
  id: string;
  creator_id: string;
  body: string;
  created_at: number;
}

const AdminCreatorMessaging = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const creatorsRaw = useQuery(api.creators.queries.listAllAdmin);
  const supportRaw = useQuery(api.support.mutations.listAllAdmin);
  const sendMessage = useMutation(api.support.mutations.send);

  const loading = creatorsRaw === undefined || supportRaw === undefined;

  const creators = useMemo((): CreatorOption[] => (creatorsRaw ?? []).map(c => ({
    id: c._id,
    name: c.displayName || c.username || 'Unnamed creator',
  })), [creatorsRaw]);

  const recent = useMemo((): SentMessage[] => (supportRaw ?? [])
    .filter(m => m.senderRole === 'admin' && m.channel === 'support')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20)
    .map(m => ({
      id: m._id,
      creator_id: m.creatorId,
      body: m.body,
      created_at: m.createdAt,
    })), [supportRaw]);

  const filtered = useMemo(
    () => creators.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [creators, search],
  );

  const nameOf = (id: string) => creators.find(c => c.id === id)?.name ?? 'Creator';

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const send = async () => {
    if (selected.size === 0) { toast.error('Select at least one creator'); return; }
    if (!body.trim()) { toast.error('Write a message'); return; }
    setSending(true);
    try {
      await Promise.all([...selected].map(creatorId =>
        sendMessage({
          creatorId: creatorId as Id<'creators'>,
          senderRole: 'admin',
          channel: 'support',
          body: body.trim(),
        }),
      ));
      setBody('');
      setSelected(new Set());
      toast.success('Message delivered');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Creator Messaging</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Send announcements and direct messages to creators</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Recipients ({selected.size})</h2>
            <Input placeholder="Search creators…" value={search} onChange={e => setSearch(e.target.value)} className="mb-3" />
            <div className="flex items-center gap-2 mb-3">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set(filtered.map(c => c.id)))}>Select all</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filtered.length === 0 && <p className="text-xs text-muted-foreground">No creators found.</p>}
              {filtered.map(c => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/40 cursor-pointer">
                  <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Message</h2>
            <Label className="text-xs text-muted-foreground">Body</Label>
            <Textarea rows={7} className="mt-1.5" placeholder="Write your message…" value={body} onChange={e => setBody(e.target.value)} />
            <Button variant="hero" size="sm" className="mt-4" onClick={send} disabled={sending}>
              {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Send to {selected.size} creator{selected.size === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-8 mb-3">Recently Sent</h2>
      {recent.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No messages sent yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map(m => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{nameOf(m.creator_id)}</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), 'MMM d, HH:mm')}</p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCreatorMessaging;
