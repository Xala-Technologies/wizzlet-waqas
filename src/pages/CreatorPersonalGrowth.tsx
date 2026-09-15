import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  Send,
  Users,
  User,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { MessageSeenReceipt } from '@/components/messaging/MessageSeenReceipt';

interface Metrics {
  revenue30: number;
  activeSubs: number;
  newSubs30: number;
  churnRate: number;
  conversion: number;
  views30: number;
  posts30: number;
  winRate: number;
  score: number;
  engagement: number;
  retention: number;
  revenueScore: number;
}

const EMPTY: Metrics = {
  revenue30: 0,
  activeSubs: 0,
  newSubs30: 0,
  churnRate: 0,
  conversion: 0,
  views30: 0,
  posts30: 0,
  winRate: 0,
  score: 0,
  engagement: 0,
  retention: 0,
  revenueScore: 0,
};

const SUGGESTIONS = [
  'Should I raise my price?',
  'How do I reduce churn?',
  'Review my last 30 days',
];

const CreatorPersonalGrowth = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const posts = useQuery(api.posts.queries.listMine);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const supportRows = useQuery(api.support.mutations.listForMyCreator);
  const platformSettings = useQuery(api.platform.mutations.get);
  const sendSupport = useMutation(api.support.mutations.send);
  const markReadSupport = useMutation(api.support.mutations.markReadCreator);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<Set<string>>(new Set());

  const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const messages = useMemo(
    () =>
      (supportRows ?? [])
        .filter((m) => m.channel === 'growth')
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((m) => ({
          id: m._id,
          sender_role: m.senderRole,
          body: m.body,
          read: m.read,
          created_at: new Date(m.createdAt).toISOString(),
        })),
    [supportRows],
  );

  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.sender_role === 'admin' && !m.read && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => markedRef.current.add(id));
    void markReadSupport({ messageIds: unreadIds as Id<'supportMessages'>[] }).catch(() => {
      unreadIds.forEach((id) => markedRef.current.delete(id));
    });
  }, [messages, markReadSupport]);

  const metrics = useMemo(() => {
    if (!subs || !posts || !analytics) return EMPTY;
    const subRows = subs;
    const postRows = posts;
    const eventRows = analytics.filter((e) => e.createdAt >= sinceMs);

    const active = subRows.filter((s) => s.status === 'active');
    const newSubs30 = subRows.filter((s) => s.createdAt >= sinceMs).length;
    const canceled = subRows.filter((s) => s.status !== 'active').length;
    const revenue30 = subRows
      .filter((s) => s.createdAt >= sinceMs)
      .reduce((sum, s) => sum + s.creatorEarningsCents / 100, 0);
    const views30 = eventRows.filter(
      (e) => e.eventType === 'profile_view' || e.eventType === 'post_view',
    ).length;
    const posts30 = postRows.filter((p) => p.createdAt >= sinceMs).length;
    const settled = postRows.filter((p) => p.result === 'won' || p.result === 'lost');
    const winRate = settled.length
      ? (settled.filter((p) => p.result === 'won').length / settled.length) * 100
      : 0;
    const churnRate = subRows.length ? (canceled / subRows.length) * 100 : 0;
    const conversion = views30 ? (newSubs30 / views30) * 100 : 0;

    const engagement = Math.min(100, Math.round(posts30 * 8 + Math.min(views30, 200) / 4));
    const retention = Math.round(Math.max(0, 100 - churnRate));
    const revenueScore = Math.min(100, Math.round(revenue30 / 20 + active.length * 4));
    const score = Math.round((engagement + retention + revenueScore) / 3);

    return {
      revenue30,
      activeSubs: active.length,
      newSubs30,
      churnRate,
      conversion,
      views30,
      posts30,
      winRate,
      score,
      engagement,
      retention,
      revenueScore,
    };
  }, [subs, posts, analytics, sinceMs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const insights = useMemo(() => {
    const list: { text: string; trend: 'up' | 'down'; icon: typeof TrendingUp }[] = [];
    if (metrics.posts30 < 4) {
      list.push({
        text: `Only ${metrics.posts30} posts in the last 30 days — consistency drives retention`,
        trend: 'down',
        icon: TrendingDown,
      });
    } else {
      list.push({
        text: `${metrics.posts30} posts published in the last 30 days`,
        trend: 'up',
        icon: TrendingUp,
      });
    }
    if (metrics.views30 > 0) {
      list.push({
        text: `${metrics.views30} views converted at ${metrics.conversion.toFixed(1)}%`,
        trend: metrics.conversion >= 5 ? 'up' : 'down',
        icon: Target,
      });
    }
    if (metrics.churnRate > 0) {
      list.push({
        text: `Churn is ${metrics.churnRate.toFixed(1)}% — ${metrics.churnRate > 10 ? 'review pricing and value' : 'healthy range'}`,
        trend: metrics.churnRate > 10 ? 'down' : 'up',
        icon: metrics.churnRate > 10 ? TrendingDown : TrendingUp,
      });
    }
    if (metrics.winRate > 0) {
      list.push({
        text: `Settled post win rate at ${metrics.winRate.toFixed(1)}%`,
        trend: metrics.winRate >= 52 ? 'up' : 'down',
        icon: BarChart3,
      });
    }
    return list;
  }, [metrics]);

  const send = async () => {
    if (!creator || !input.trim() || sending) return;
    setSending(true);
    try {
      await sendSupport({
        creatorId: creator.id as Id<'creators'>,
        senderRole: 'creator',
        channel: 'growth',
        body: input.trim(),
      });
      setInput('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-primary' : 'text-destructive';
  const scoreLevel = (score: number) => (score >= 80 ? 'Elite' : score >= 60 ? 'Pro' : 'Starter');

  const busy =
    creatorLoading ||
    subs === undefined ||
    posts === undefined ||
    analytics === undefined ||
    supportRows === undefined ||
    platformSettings === undefined;

  const flags = (platformSettings?.featureFlags ?? {}) as Record<string, unknown>;
  const growthEnabled =
    flags.growthManagerEnabled !== false && flags.growth_manager_enabled !== false;

  if (busy) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <header className="mb-6">
          <h1 className="text-heading font-bold text-foreground">Personal Growth Manager</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Human coaching via message thread — not an automated AI
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Finish onboarding to unlock growth coaching from the Prizelet team.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const composer = (
    <div className="border-t border-border bg-card">
      <div className="px-3 pt-3 pb-2 flex gap-2 flex-wrap">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInput(q)}
            className="min-h-11 px-3 rounded-lg text-support font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="p-3 pt-1 flex gap-2 items-stretch">
        <Input
          placeholder="Ask your growth team anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="flex-1 h-11 min-h-11 text-ui"
          disabled={sending}
        />
        <Button
          type="button"
          className="min-h-11 min-w-11 shrink-0"
          onClick={() => void send()}
          disabled={sending || !input.trim()}
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Personal Growth Manager</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Human coaching via message thread — not an automated AI
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-2 flex flex-col min-w-0">
          <div className="rounded-xl border border-border bg-card p-4 mb-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-ui font-semibold text-foreground">Prizelet Growth Team</h2>
              <p className="text-support text-muted-foreground mt-0.5">
                {growthEnabled
                  ? 'Ask about pricing, retention, or content — a teammate replies in this thread.'
                  : 'Growth Manager chat is currently turned off by the platform.'}
              </p>
            </div>
          </div>

          {!growthEnabled ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-ui font-semibold text-foreground mb-2">Chat unavailable</h3>
              <p className="text-support text-muted-foreground max-w-sm mx-auto">
                Messaging the growth team is disabled right now. Your activity estimates below still
                update from your account data.
              </p>
            </div>
          ) : (
            <>
          <div className="rounded-xl border border-border bg-card flex flex-col flex-1 min-h-[420px] max-h-[min(70vh,720px)] lg:max-h-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center py-10 px-4">
                  <Users className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-ui font-medium text-foreground mb-1">No conversation yet</p>
                  <p className="text-support text-muted-foreground max-w-xs">
                    Send a question and the Prizelet growth team will reply here.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender_role === 'creator' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender_role !== 'creator' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5 bg-primary/10">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-ui ${
                        msg.sender_role === 'creator'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.body}</p>
                      <div
                        className={`mt-1 flex items-center justify-between gap-2 text-caption ${
                          msg.sender_role === 'creator'
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {msg.sender_role === 'creator' && (
                          <MessageSeenReceipt seen={msg.read === true} light />
                        )}
                      </div>
                    </div>
                    {msg.sender_role === 'creator' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            <div className="hidden lg:block">{composer}</div>
          </div>

          <div className="lg:hidden sticky bottom-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-background mt-3">
            {composer}
          </div>
            </>
          )}
        </div>

        <div className="space-y-4 order-last">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-support font-medium text-muted-foreground">
                Performance Score (estimate)
              </h3>
              <span className={`text-support font-semibold ${scoreColor(metrics.score)}`}>
                {scoreLevel(metrics.score)}
              </span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeDasharray={`${metrics.score}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`absolute text-title-lg font-bold ${scoreColor(metrics.score)}`}>
                  {metrics.score}
                </span>
              </div>
              <div className="text-support text-muted-foreground space-y-1 min-w-0">
                <p>
                  <span className="text-foreground font-medium">{metrics.activeSubs}</span> active
                  subscribers
                </p>
                <p className="flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /> {metrics.newSubs30} new in 30 days
                </p>
                <p className="text-caption text-muted-foreground">
                  Heuristic estimate from recent activity — not a platform rating.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Engagement', value: metrics.engagement },
                { label: 'Retention', value: metrics.retention },
                { label: 'Revenue', value: metrics.revenueScore },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-support text-muted-foreground w-20 shrink-0">{m.label}</span>
                  <Progress value={m.value} className="flex-1 h-1.5" />
                  <span className="text-support font-medium w-8 text-right">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-support font-medium text-muted-foreground mb-3">Last 30 Days</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Earnings', value: `$${metrics.revenue30.toFixed(2)}` },
                { label: 'Churn Rate', value: `${metrics.churnRate.toFixed(1)}%` },
                { label: 'Conversion', value: `${metrics.conversion.toFixed(1)}%` },
                { label: 'New Subs', value: `${metrics.newSubs30}` },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-support text-muted-foreground">{m.label}</p>
                  <p className="text-ui font-bold mt-0.5 text-foreground">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-support font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" /> Growth Insights
            </h3>
            {insights.length === 0 ? (
              <p className="text-support text-muted-foreground">
                Publish picks and gather subscribers to unlock insights.
              </p>
            ) : (
              <div className="space-y-2.5">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-support">
                    <insight.icon
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        insight.trend === 'up' ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    />
                    <span className="text-muted-foreground">{insight.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatorPersonalGrowth;
