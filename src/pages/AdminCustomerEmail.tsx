import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Mail, Send, Users, Eye, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  subject: string;
  body: string;
  audience: string;
  recipients: number;
  status: string;
  created_at: string;
}

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
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [subs, setSubs] = useState<{ user_id: string; creator_id: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from('email_campaigns')
      .select('id, subject, body, audience, recipients, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setCampaigns((data ?? []) as Campaign[]);
  };

  useEffect(() => {
    const load = async () => {
      const [{ data: users }, { data: subscriptions }, { data: creatorRows }] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('subscriptions').select('user_id, creator_id, status'),
        supabase.from('creators').select('id, display_name, username'),
      ]);
      setAllUsers((users ?? []).map(u => u.id));
      setSubs((subscriptions ?? []) as { user_id: string; creator_id: string; status: string }[]);
      setCreators((creatorRows ?? []).map(c => ({
        id: c.id,
        label: c.display_name || c.username || 'Unnamed creator',
      })));
      await loadCampaigns();
      setLoading(false);
    };
    void load();
  }, []);

  const recipientIds = useMemo(() => {
    const activeUsers = new Set(subs.filter(s => s.status === 'active').map(s => s.user_id));
    if (audience === 'all') return allUsers;
    if (audience === 'active') return [...activeUsers];
    if (audience === 'canceled') {
      return [...new Set(subs.filter(s => s.status !== 'active' && !activeUsers.has(s.user_id)).map(s => s.user_id))];
    }
    if (audience === 'specific' && creatorId) {
      return [...new Set(subs.filter(s => s.creator_id === creatorId && s.status === 'active').map(s => s.user_id))];
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
    const { error: campaignError } = await supabase.from('email_campaigns').insert({
      subject: subject.trim(),
      body: body.trim(),
      audience: audienceLabel,
      recipients: recipientIds.length,
      status: 'sent',
    });

    if (campaignError) {
      setSending(false);
      toast.error(campaignError.message);
      return;
    }

    const { error: notifyError } = await supabase.from('notifications').insert(
      recipientIds.map(id => ({
        user_id: id,
        type: 'announcement',
        title: subject.trim(),
        description: body.trim().slice(0, 400),
      })),
    );
    setSending(false);

    if (notifyError) {
      toast.error(`Campaign logged, but in-app delivery failed: ${notifyError.message}`);
    } else {
      toast.success(`Delivered to ${recipientIds.length} customer${recipientIds.length === 1 ? '' : 's'}`);
    }

    setSubject('');
    setBody('');
    await loadCampaigns();
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customer Email</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Send announcements to your customer base</p>
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
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Campaign History</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No campaigns sent yet.</p>
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
                  <Badge variant="outline" className="text-[9px] shrink-0 capitalize">{c.status}</Badge>
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
