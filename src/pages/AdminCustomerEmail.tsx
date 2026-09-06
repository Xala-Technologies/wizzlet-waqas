import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, Eye, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CreatorOption {
  id: string;
  label: string;
}

const AUDIENCE_LABEL: Record<string, string> = {
  all: 'All Customers',
  active: 'Active Subscribers',
  canceled: 'Canceled Subscribers',
};

const AdminCustomerEmail = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [creatorId, setCreatorId] = useState<string>('');
  const [sending, setSending] = useState(false);

  const usersRaw = useQuery(api.admin.queries.listUsers);
  const subsRaw = useQuery(api.subscriptions.mutations.listAllAdmin);
  const creatorsRaw = useQuery(api.creators.queries.listAllAdmin);
  const campaignsRaw = useQuery(api.admin.queries.listCampaigns);
  const createCampaign = useMutation(api.admin.queries.createEmailCampaign);

  const loading = usersRaw === undefined || subsRaw === undefined || creatorsRaw === undefined || campaignsRaw === undefined;

  const allUsers = useMemo(() => (usersRaw ?? []).map(u => u._id), [usersRaw]);
  const subs = useMemo(() => subsRaw ?? [], [subsRaw]);
  const creators = useMemo((): CreatorOption[] => (creatorsRaw ?? []).map(c => ({
    id: c._id,
    label: c.displayName || c.username || 'Unnamed creator',
  })), [creatorsRaw]);

  const campaigns = useMemo(() => (campaignsRaw ?? [])
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50)
    .map(c => ({
      id: c._id,
      subject: c.subject,
      body: c.body,
      audience: c.audience ?? '',
      recipients: c.recipients,
      status: c.status,
      created_at: c.createdAt,
    })), [campaignsRaw]);

  const recipientIds = useMemo(() => {
    const activeUsers = new Set(subs.filter(s => s.status === 'active').map(s => s.userId));
    if (audience === 'all') return allUsers;
    if (audience === 'active') return [...activeUsers];
    if (audience === 'canceled') {
      return [...new Set(subs.filter(s => s.status !== 'active' && !activeUsers.has(s.userId)).map(s => s.userId))];
    }
    if (audience === 'specific' && creatorId) {
      return [...new Set(subs.filter(s => s.creatorId === creatorId && s.status === 'active').map(s => s.userId))];
    }
    return [];
  }, [audience, creatorId, allUsers, subs]);

  const audienceLabel = audience === 'specific'
    ? `Customers of ${creators.find(c => c.id === creatorId)?.label ?? 'creator'}`
    : AUDIENCE_LABEL[audience];

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both subject and email content');
      return;
    }
    if (audience === 'specific' && !creatorId) {
      toast.error('Select a creator for this audience');
      return;
    }
    if (recipientIds.length === 0) {
      toast.error('No customers match this audience');
      return;
    }

    setSending(true);
    try {
      await createCampaign({
        subject: subject.trim(),
        body: body.trim(),
        audience: audienceLabel,
        recipientUserIds: recipientIds as Id<'users'>[],
      });
      toast.success(`Delivered to ${recipientIds.length} customer${recipientIds.length === 1 ? '' : 's'}`);
      setSubject('');
      setBody('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">In-app announcements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Delivers notifications in the app. Email outbox is not enabled yet.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Compose Message
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Audience</label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active Subscribers</SelectItem>
                  <SelectItem value="canceled">Canceled Subscribers</SelectItem>
                  <SelectItem value="specific">Customers of Specific Creator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience === 'specific' && (
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Creator</label>
                <Select value={creatorId} onValueChange={setCreatorId}>
                  <SelectTrigger><SelectValue placeholder="Select creator" /></SelectTrigger>
                  <SelectContent>
                    {creators.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {loading ? 'Counting recipients…' : `${recipientIds.length} customer${recipientIds.length === 1 ? '' : 's'} will receive this`}
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject Line</label>
            <Input placeholder="Enter subject…" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content</label>
            <Textarea placeholder="Write your message…" value={body} onChange={e => setBody(e.target.value)} rows={8} className="resize-none" />
          </div>
          <Button onClick={handleSend} disabled={sending || loading}>
            {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            Send to {recipientIds.length} customer{recipientIds.length === 1 ? '' : 's'}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Announcement history</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.body}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {c.status === 'in_app_announcement' || c.status === 'sent'
                      ? 'In-app'
                      : c.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.recipients} recipients</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {c.audience}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomerEmail;
