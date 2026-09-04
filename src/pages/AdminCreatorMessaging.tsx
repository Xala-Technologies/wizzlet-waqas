import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
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
  created_at: string;
}

const AdminCreatorMessaging = () => {
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<SentMessage[]>([]);

  const loadRecent = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('id, creator_id, body, created_at')
      .eq('sender_role', 'admin')
      .eq('channel', 'support')
      .order('created_at', { ascending: false })
      .limit(20);
    setRecent(data ?? []);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('creators')
        .select('id, display_name, username')
        .order('created_at', { ascending: false });
      setCreators((data ?? []).map(c => ({ id: c.id, name: c.display_name || c.username || 'Unnamed creator' })));
      await loadRecent();
      setLoading(false);
    };
    void load();
  }, []);

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
    const { error } = await supabase.from('support_messages').insert(
      [...selected].map(creator_id => ({ creator_id, sender_role: 'admin', channel: 'support', body: body.trim() })),
    );
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody('');
    setSelected(new Set());
    await loadRecent();
    toast.success('Message delivered');
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
