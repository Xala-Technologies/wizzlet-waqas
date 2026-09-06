import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { FileWarning, Loader2, MessageSquare, Send, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  escalated: 'bg-destructive/10 text-destructive border-destructive/20',
};

const CreatorResolutionCase = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const cases = useQuery(api.resolution.mutations.listMine);
  const createCase = useMutation(api.resolution.mutations.create);
  const addMessage = useMutation(api.resolution.mutations.addMessage);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('payout');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const messages = useQuery(
    api.resolution.mutations.listMessages,
    selected ? { caseId: selected as Id<'resolutionCases'> } : 'skip',
  );

  const loading = creatorLoading || cases === undefined;

  const createCaseHandler = async () => {
    if (!creator) return;
    if (!subject.trim()) { toast.error('Add a subject'); return; }
    setSaving(true);
    try {
      await createCase({
        creatorId: creator.id as Id<'creators'>,
        subject: subject.trim(),
        category,
        priority,
        description: description.trim() || undefined,
      });
      setSubject('');
      setDescription('');
      toast.success('Case submitted — our team will respond shortly');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit case');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await addMessage({
        caseId: selected as Id<'resolutionCases'>,
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

  const caseRows = (cases ?? []).map((c) => ({
    id: c._id,
    subject: c.subject,
    category: c.category ?? 'general',
    description: c.description ?? null,
    status: c.status,
    priority: c.priority ?? 'normal',
    created_at: new Date(c.createdAt).toISOString(),
  }));

  const messageRows = (messages ?? []).map((m) => ({
    id: m._id,
    sender_role: m.senderRole,
    body: m.body,
    created_at: new Date(m.createdAt).toISOString(),
  }));

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Resolution Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Raise an issue with the Wizzlet team and track its progress</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="text-sm font-semibold mb-4">Open a New Case</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input className="mt-1.5" placeholder="Short summary" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="payout">Payout</SelectItem>
                <SelectItem value="subscriber">Subscriber dispute</SelectItem>
                <SelectItem value="account">Account & verification</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-xs text-muted-foreground">Details</Label>
          <Textarea className="mt-1.5" rows={3} placeholder="Describe what happened…" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <Button variant="hero" size="sm" className="mt-4" onClick={createCaseHandler} disabled={saving || !creator}>
          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Submit Case
        </Button>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Your Cases</h2>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : caseRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileWarning className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No cases yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {caseRows.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{c.subject}</p>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[c.status] ?? ''}`}>{c.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize">{c.category}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-2">{c.description}</p>}
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelected(selected === c.id ? null : c.id)}>
                  <MessageSquare className="mr-1 h-3 w-3" /> {selected === c.id ? 'Hide' : 'Thread'}
                </Button>
              </div>

              {selected === c.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                    {messageRows.length === 0 && <p className="text-xs text-muted-foreground">No messages yet.</p>}
                    {messageRows.map(m => (
                      <div key={m.id} className={`rounded-lg p-3 text-xs ${m.sender_role === 'creator' ? 'bg-primary/10 ml-8' : 'bg-muted/40 mr-8'}`}>
                        <p className="font-medium mb-1 capitalize">{m.sender_role === 'creator' ? 'You' : 'Wizzlet team'}</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{format(new Date(m.created_at), 'MMM d, HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea rows={2} placeholder="Add a message…" value={reply} onChange={e => setReply(e.target.value)} />
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

export default CreatorResolutionCase;
