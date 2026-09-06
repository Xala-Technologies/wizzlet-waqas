import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  Send, Bot, User, Circle, TrendingUp, TrendingDown, BarChart3, Target, Zap, ArrowUpRight, Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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
  revenue30: 0, activeSubs: 0, newSubs30: 0, churnRate: 0, conversion: 0,
  views30: 0, posts30: 0, winRate: 0, score: 0, engagement: 0, retention: 0, revenueScore: 0,
};

const CreatorPersonalGrowth = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const posts = useQuery(api.posts.queries.listMine);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const supportRows = useQuery(api.support.mutations.listForMyCreator);
  const sendSupport = useMutation(api.support.mutations.send);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const messages = useMemo(
    () => (supportRows ?? [])
      .filter((m) => m.channel === 'growth')
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => ({
        id: m._id,
        sender_role: m.senderRole,
        body: m.body,
        created_at: new Date(m.createdAt).toISOString(),
      })),
    [supportRows],
  );

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
    const views30 = eventRows.filter((e) => e.eventType === 'profile_view' || e.eventType === 'post_view').length;
    const posts30 = postRows.filter((p) => p.createdAt >= sinceMs).length;
    const settled = postRows.filter((p) => p.result === 'won' || p.result === 'lost');
    const winRate = settled.length ? (settled.filter((p) => p.result === 'won').length / settled.length) * 100 : 0;
    const churnRate = subRows.length ? (canceled / subRows.length) * 100 : 0;
    const conversion = views30 ? (newSubs30 / views30) * 100 : 0;

    const engagement = Math.min(100, Math.round(posts30 * 8 + Math.min(views30, 200) / 4));
    const retention = Math.round(Math.max(0, 100 - churnRate));
    const revenueScore = Math.min(100, Math.round(revenue30 / 20 + active.length * 4));
    const score = Math.round((engagement + retention + revenueScore) / 3);

    return {
      revenue30, activeSubs: active.length, newSubs30, churnRate, conversion,
      views30, posts30, winRate, score, engagement, retention, revenueScore,
    };
  }, [subs, posts, analytics, sinceMs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const insights = useMemo(() => {
    const list: { text: string; trend: 'up' | 'down'; icon: typeof TrendingUp }[] = [];
    if (metrics.posts30 < 4) {
      list.push({ text: `Only ${metrics.posts30} posts in the last 30 days — consistency drives retention`, trend: 'down', icon: TrendingDown });
    } else {
      list.push({ text: `${metrics.posts30} posts published in the last 30 days`, trend: 'up', icon: TrendingUp });
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
        text: `Verified win rate at ${metrics.winRate.toFixed(1)}%`,
        trend: metrics.winRate >= 52 ? 'up' : 'down',
        icon: BarChart3,
      });
    }
    return list;
  }, [metrics]);

  const send = async () => {
    if (!creator || !input.trim()) return;
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

  const busy = creatorLoading || subs === undefined || posts === undefined || analytics === undefined || supportRows === undefined;

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Personal Growth Manager</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Live performance coaching from your Wizzlet growth team</p>
      </div>

      {busy ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !creator ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bot className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No creator profile yet</h3>
          <p className="text-sm text-muted-foreground">Finish onboarding to unlock growth coaching.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <div className="rounded-xl border border-border bg-card p-4 mb-4 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm">Wizzlet Growth Team</h2>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                    <Circle className="h-1.5 w-1.5 fill-current" /> Online
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Ask about pricing, retention or content — replies arrive in this thread.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card flex flex-col flex-1" style={{ minHeight: 420 }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <Bot className="h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground max-w-xs">
                      No conversation yet. Send a question and your growth manager will reply here.
                    </p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.sender_role === 'creator' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender_role !== 'creator' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 bg-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                      msg.sender_role === 'creator' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground'
                    }`}>
                      <p className="whitespace-pre-line">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_role === 'creator' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {msg.sender_role === 'creator' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="px-4 py-2 border-t border-border flex gap-2 flex-wrap">
                {['Should I raise my price?', 'How do I reduce churn?', 'Review my last 30 days'].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  placeholder="Ask your growth manager anything…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  className="flex-1"
                />
                <Button size="icon" onClick={send} disabled={sending || !input.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance Score</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${scoreColor(metrics.score)}`}>
                  {scoreLevel(metrics.score)}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="relative flex items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray={`${metrics.score}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className={`absolute text-xl font-bold ${scoreColor(metrics.score)}`}>{metrics.score}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="text-foreground font-medium">{metrics.activeSubs}</span> active subscribers</p>
                  <p className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> {metrics.newSubs30} new in 30 days</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Engagement', value: metrics.engagement },
                  { label: 'Retention', value: metrics.retention },
                  { label: 'Revenue', value: metrics.revenueScore },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-20">{m.label}</span>
                    <Progress value={m.value} className="flex-1 h-1.5" />
                    <span className="text-[11px] font-medium w-8 text-right">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Last 30 Days</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Earnings', value: `$${metrics.revenue30.toFixed(2)}` },
                  { label: 'Churn Rate', value: `${metrics.churnRate.toFixed(1)}%` },
                  { label: 'Conversion', value: `${metrics.conversion.toFixed(1)}%` },
                  { label: 'New Subs', value: `${metrics.newSubs30}` },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                    <p className="text-lg font-bold mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" /> Growth Insights
              </h3>
              {insights.length === 0 ? (
                <p className="text-xs text-muted-foreground">Publish picks and gather subscribers to unlock insights.</p>
              ) : (
                <div className="space-y-2.5">
                  {insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <insight.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${insight.trend === 'up' ? 'text-emerald-500' : 'text-amber-500'}`} />
                      <span className="text-muted-foreground">{insight.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorPersonalGrowth;
