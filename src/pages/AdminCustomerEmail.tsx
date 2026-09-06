import { useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
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

const PAGE_SIZE = 25;

const AdminCustomerEmail = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'active' | 'canceled' | 'specific'>('all');
  const [creatorId, setCreatorId] = useState<string>('');
  const [sending, setSending] = useState(false);

  const {
    results: creatorResults,
    status: creatorStatus,
    loadMore: loadMoreCreators,
  } = usePaginatedQuery(
    api.admin.paginatedLists.listCreatorsPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const {
    results: campaignResults,
    status: campaignStatus,
    loadMore: loadMoreCampaigns,
  } = usePaginatedQuery(
    api.admin.paginatedLists.listCampaignsPage,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const preview = useQuery(api.admin.queries.previewAnnouncementAudience, {
    audience,
    creatorId: audience === 'specific' && creatorId
      ? (creatorId as Id<'creators'>)
      : undefined,
  });
  const sendAnnouncement = useMutation(api.admin.queries.sendAnnouncement);

  const creators = (creatorResults ?? []).map((c) => ({
    id: c.id,
    label: c.displayName || c.username || 'Unnamed creator',
  }));
  const campaigns = (campaignResults ?? []).map((c) => ({
    id: c.id,
    subject: c.subject,
    body: c.body,
    audience: c.audience ?? '',
    recipients: c.recipients,
    status: c.status,
    created_at: c.createdAt,
  }));

  const recipientCount = preview?.count ?? 0;
  const previewLoading = preview === undefined;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both subject and email content');
      return;
    }
    if (audience === 'specific' && !creatorId) {
      toast.error('Select a creator for this audience');
      return;
    }
    if (recipientCount === 0) {
      toast.error('No customers match this audience');
      return;
    }

    setSending(true);
    try {
      const result = await sendAnnouncement({
        subject: subject.trim(),
        body: body.trim(),
        audience,
        creatorId: audience === 'specific' ? (creatorId as Id<'creators'>) : undefined,
      });
      toast.success(`Delivered to ${result.recipients} customer${result.recipients === 1 ? '' : 's'}`);
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
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
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
                    {creators.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(creatorStatus === 'CanLoadMore' || creatorStatus === 'LoadingMore') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    disabled={creatorStatus === 'LoadingMore'}
                    onClick={() => loadMoreCreators(PAGE_SIZE)}
                  >
                    Load more creators
                  </Button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {previewLoading
              ? 'Counting recipients…'
              : `${recipientCount} customer${recipientCount === 1 ? '' : 's'} will receive this${preview?.truncated ? ' (scan capped)' : ''}`}
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject Line</label>
            <Input placeholder="Enter subject…" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content</label>
            <Textarea placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="resize-none" />
          </div>
          <Button onClick={handleSend} disabled={sending || previewLoading}>
            {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            Send to {recipientCount} customer{recipientCount === 1 ? '' : 's'}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Announcement history</h2>
        {campaignStatus === 'LoadingFirstPage' ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {campaigns.map((c) => (
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
            {(campaignStatus === 'CanLoadMore' || campaignStatus === 'LoadingMore') && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm" disabled={campaignStatus === 'LoadingMore'} onClick={() => loadMoreCampaigns(PAGE_SIZE)}>
                  {campaignStatus === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomerEmail;
