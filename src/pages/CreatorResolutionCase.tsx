import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  escalated: 'bg-destructive/10 text-destructive border-destructive/20',
};

const CreatorResolutionCase = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId');

  const cases = useQuery(api.resolution.mutations.listMine);
  const createCase = useMutation(api.resolution.mutations.create);
  const addMessage = useMutation(api.resolution.mutations.addMessage);
  const markRead = useMutation(api.resolution.mutations.markReadCreator);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('payout');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(caseIdParam);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const markedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (caseIdParam) setSelected(caseIdParam);
  }, [caseIdParam]);

  const messages = useQuery(
    api.resolution.mutations.listMessages,
    selected ? { caseId: selected as Id<'resolutionCases'> } : 'skip',
  );

  useEffect(() => {
    if (!messages) return;
    const unreadIds = messages
      .filter((m) => m.senderRole === 'admin' && m.read !== true && !markedRef.current.has(m._id))
      .map((m) => m._id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markRead({ messageIds: unreadIds }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [messages, markRead]);

  const loading = creatorLoading || cases === undefined;

  const createCaseHandler = async () => {
    if (!creator) return;
    if (!subject.trim()) {
      toast.error('Add a subject');
      return;
    }
    setSaving(true);
    try {
      const id = await createCase({
        creatorId: creator.id as Id<'creators'>,
        subject: subject.trim(),
        category,
        priority,
        description: description.trim() || undefined,
      });
      setSubject('');
      setDescription('');
      setSelected(id);
      setSearchParams({ caseId: id }, { replace: true });
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

  const openCase = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    if (next) setSearchParams({ caseId: next }, { replace: true });
    else setSearchParams({}, { replace: true });
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
    read: m.read === true,
    created_at: new Date(m.createdAt).toISOString(),
  }));

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Support
        </p>
        <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
          Resolution Case
        </h1>
        <p className="mt-1.5 text-support text-muted-foreground">
          Raise an issue with the Prizelet team and track its progress.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
          Open a New Case
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label className="text-caption text-muted-foreground">Subject</Label>
            <Input
              className="mt-1.5 min-h-11"
              placeholder="Short summary"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-caption text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5 min-h-11">
                <SelectValue />
              </SelectTrigger>
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
            <Label className="text-caption text-muted-foreground">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1.5 min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-caption text-muted-foreground">Details</Label>
          <Textarea
            className="mt-1.5"
            rows={3}
            placeholder="Describe what happened…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button
          variant="hero"
          className="mt-4 min-h-11"
          onClick={() => void createCaseHandler()}
          disabled={saving || !creator}
        >
          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Submit Case
        </Button>
      </section>

      <h2 className="mb-3 text-support font-medium uppercase tracking-wider text-muted-foreground">
        Your Cases
      </h2>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : caseRows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <FileWarning className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No cases yet.</p>
          <Button asChild variant="outline" className="mt-4 min-h-11 rounded-xl">
            <Link to="/creator/personal-growth-manager">Growth Manager</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {caseRows.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{c.subject}</p>
                    <Badge
                      variant="outline"
                      className={`text-caption capitalize ${statusColors[c.status] ?? ''}`}
                    >
                      {c.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-caption text-muted-foreground">
                    <span className="capitalize">{c.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {c.description && (
                    <p className="mt-2 text-caption text-muted-foreground">{c.description}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-caption"
                  onClick={() => openCase(c.id)}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />{' '}
                  {selected === c.id ? 'Hide' : 'Thread'}
                </Button>
              </div>

              {selected === c.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
                    {messageRows.length === 0 && (
                      <p className="text-caption text-muted-foreground">No messages yet.</p>
                    )}
                    {messageRows.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg p-3 text-caption ${
                          m.sender_role === 'creator' ? 'ml-8 bg-primary/10' : 'mr-8 bg-muted/40'
                        }`}
                      >
                        <p className="mb-1 font-medium capitalize">
                          {m.sender_role === 'creator' ? 'You' : 'Prizelet team'}
                        </p>
                        <p className="whitespace-pre-wrap text-muted-foreground">{m.body}</p>
                        <div className="mt-1 flex items-center justify-between gap-2 text-caption text-muted-foreground/70">
                          <span>{format(new Date(m.created_at), 'MMM d, HH:mm')}</span>
                          {m.sender_role === 'creator' && <MessageSeenReceipt seen={m.read} />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      rows={2}
                      placeholder="Add a message…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <Button
                      variant="hero"
                      size="sm"
                      className="min-h-11 shrink-0"
                      onClick={() => void sendReply()}
                      disabled={sending || !reply.trim()}
                    >
                      {sending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
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
