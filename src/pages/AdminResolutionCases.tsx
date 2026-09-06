import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileWarning, MessageSquare, Clock, User, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CaseRow {
  id: string;
  creator_id: string;
  subject: string;
  category: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: number;
  updated_at: number;
  creatorName: string;
}

interface CaseMessage {
  id: string;
  sender_role: string;
  body: string;
  created_at: number;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  escalated: 'bg-destructive/10 text-destructive border-destructive/20',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-muted text-muted-foreground',
  high: 'bg-destructive/10 text-destructive',
};

const AdminResolutionCases = () => {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const casesRaw = useQuery(api.resolution.mutations.listAllAdmin);
  const creatorsRaw = useQuery(api.creators.queries.listAllAdmin);
  const messagesRaw = useQuery(
    api.resolution.mutations.listMessages,
    selected ? { caseId: selected as Id<'resolutionCases'> } : 'skip',
  );
  const setStatus = useMutation(api.resolution.mutations.setStatus);
  const addMessage = useMutation(api.resolution.mutations.addMessage);

  const loading = casesRaw === undefined || creatorsRaw === undefined;

  const cases = useMemo((): CaseRow[] => {
    if (!casesRaw || !creatorsRaw) return [];
    const nameMap = new Map(creatorsRaw.map(c => [c._id, c.displayName || c.username || 'Unnamed creator']));
    return casesRaw
      .map(r => ({
        id: r._id,
        creator_id: r.creatorId,
        subject: r.subject,
        category: r.category ?? 'general',
        description: r.description ?? null,
        status: r.status,
        priority: r.priority ?? 'normal',
        created_at: r.createdAt,
        updated_at: r.updatedAt,
        creatorName: nameMap.get(r.creatorId) ?? 'Unknown creator',
      }))
      .sort((a, b) => b.updated_at - a.updated_at);
  }, [casesRaw, creatorsRaw]);

  const messages = useMemo((): CaseMessage[] => {
    if (!messagesRaw) return [];
    return messagesRaw.map(m => ({
      id: m._id,
      sender_role: m.senderRole,
      body: m.body,
      created_at: m.createdAt,
    }));
  }, [messagesRaw]);


  const filtered = useMemo(
    () => filter === 'all' ? cases : cases.filter(c => c.status === filter),
    [cases, filter],
  );

  const updateStatus = async (id: string, status: string) => {
    try {
      await setStatus({ caseId: id as Id<'resolutionCases'>, status });
      toast.success(`Case marked ${status.replace('_', ' ')}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update case');
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await addMessage({
        caseId: selected as Id<'resolutionCases'>,
        senderRole: 'admin',
        body: reply.trim(),
      });
      setReply('');
      toast.success('Reply sent');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const openCount = cases.filter(c => c.status === 'open' || c.status === 'escalated').length;

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Resolution Cases</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{openCount} open · {cases.length} total</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cases</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileWarning className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No cases in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{c.subject}</p>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[c.status] ?? ''}`}>{c.status.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[c.priority] ?? ''}`}>{c.priority}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {c.creatorName}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                    <span className="capitalize">{c.category}</span>
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={c.status} onValueChange={v => updateStatus(c.id, v)}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelected(selected === c.id ? null : c.id)}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" /> {selected === c.id ? 'Hide' : 'Thread'}
                  </Button>
                </div>
              </div>

              {selected === c.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                    {messages.length === 0 && <p className="text-xs text-muted-foreground">No messages yet.</p>}
                    {messages.map(m => (
                      <div key={m.id} className={`rounded-lg p-3 text-xs ${m.sender_role === 'admin' ? 'bg-primary/10 ml-8' : 'bg-muted/40 mr-8'}`}>
                        <p className="font-medium mb-1 capitalize">{m.sender_role}</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{format(new Date(m.created_at), 'MMM d, HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea rows={2} placeholder="Write a reply…" value={reply} onChange={e => setReply(e.target.value)} />
                    <Button variant="hero" size="sm" onClick={sendReply} disabled={sending || !reply.trim()}>
                      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminResolutionCases;
