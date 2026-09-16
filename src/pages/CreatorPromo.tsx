import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Code2,
  Gift,
  Lightbulb,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  MousePointerClick,
  Percent,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { resolveDiscountDuration, type PromoDiscountDuration } from '../../convex/lib/promoCodes';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { copyToClipboard } from '@/lib/clipboard';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import {
  CREATOR_MARKETING_DEMO_CAMPAIGNS,
  CREATOR_MARKETING_DEMO_GROWTH,
  CREATOR_MARKETING_DEMO_METRICS,
  CREATOR_MARKETING_DEMO_TRAFFIC,
  shouldUseCreatorMarketingDemo,
} from '@/lib/creatorMarketingDemo';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

const THIRTY_DAYS_MS = 30 * 86_400_000;

type CampaignStatus = 'active' | 'paused' | 'ended';

type CampaignRow = {
  id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  reach: number;
  conversions: number;
};

function statusPill(status: CampaignStatus): string {
  if (status === 'active') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  if (status === 'paused') {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }
  return 'border-border bg-muted text-muted-foreground';
}

const CreatorPromo = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const promos = useQuery(api.creators.growth.listMyPromos);
  const links = useQuery(api.creators.growth.listMyLinks);
  const analytics = useQuery(api.analytics.mutations.listForMyCreator);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const upsertPromo = useMutation(api.creators.growth.upsertPromo);
  const removePromo = useMutation(api.creators.growth.removePromo);

  const [range, setRange] = useState('30');
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('15');
  const [duration, setDuration] = useState<PromoDiscountDuration>('once');
  const [maxUses, setMaxUses] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<'promoCodes'> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loading =
    creatorLoading ||
    promos === undefined ||
    links === undefined ||
    analytics === undefined ||
    subs === undefined;

  const promoRows = promos ?? [];
  const linkRows = links ?? [];
  const deleteTarget = promoRows.find((p) => p._id === deleteId);

  const realLinkClicks = linkRows.reduce((sum, l) => sum + l.clicks, 0);
  const realConversions = linkRows.reduce((sum, l) => sum + l.conversions, 0);
  const realProfileViews = (analytics ?? []).filter((e) => e.eventType === 'profile_view').length;
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const realNewSubs = (subs ?? []).filter((s) => s.createdAt >= cutoff).length;

  const useDemo = shouldUseCreatorMarketingDemo({
    linkClicks: realLinkClicks,
    profileViews: realProfileViews,
    promoCount: promoRows.length,
    forceDemo,
    disableDemo,
  });

  const metrics = useDemo
    ? CREATOR_MARKETING_DEMO_METRICS
    : {
        newSubscribers: realNewSubs,
        newSubscribersDelta: null as number | null,
        profileViews: realProfileViews,
        profileViewsDelta: null as number | null,
        linkClicks: realLinkClicks,
        linkClicksDelta: null as number | null,
        conversionRate:
          realLinkClicks > 0
            ? Math.round((realConversions / realLinkClicks) * 1000) / 10
            : realProfileViews > 0
              ? Math.round((realNewSubs / realProfileViews) * 1000) / 10
              : 0,
        conversionRateDelta: null as number | null,
      };

  const growthSeries = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_GROWTH;
    const active = (subs ?? []).filter((s) => s.status === 'active').length;
    if (active === 0 && realNewSubs === 0) return [];
    const base = Math.max(0, active - realNewSubs);
    return [
      { label: 'Week 1', subscribers: base },
      { label: 'Week 2', subscribers: base + Math.round(realNewSubs * 0.3) },
      { label: 'Week 3', subscribers: base + Math.round(realNewSubs * 0.65) },
      { label: 'Week 4', subscribers: active },
    ];
  }, [useDemo, subs, realNewSubs]);

  const trafficSources = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_TRAFFIC;
    if (linkRows.length === 0 && realProfileViews === 0) return [];
    const linkShare = realLinkClicks;
    const directShare = realProfileViews;
    const total = linkShare + directShare || 1;
    return [
      {
        name: 'Tracking links',
        value: Math.round((linkShare / total) * 100) || (linkShare > 0 ? 1 : 0),
        color: 'hsl(239 84% 67%)',
      },
      {
        name: 'Profile views',
        value: Math.round((directShare / total) * 100) || (directShare > 0 ? 1 : 0),
        color: 'hsl(199 89% 48%)',
      },
    ].filter((s) => s.value > 0);
  }, [useDemo, linkRows.length, realLinkClicks, realProfileViews]);

  const campaigns: CampaignRow[] = useMemo(() => {
    if (useDemo) return CREATOR_MARKETING_DEMO_CAMPAIGNS;
    const fromPromos: CampaignRow[] = promoRows.slice(0, 4).map((p) => ({
      id: p._id,
      name: p.code,
      channel: 'Promo code',
      status: p.isActive ? 'active' : 'paused',
      reach: p.maxUses ?? p.usedCount * 4,
      conversions: p.usedCount,
    }));
    const fromLinks: CampaignRow[] = linkRows.slice(0, 4).map((l) => ({
      id: l._id,
      name: l.name,
      channel: 'Tracking link',
      status: 'active' as const,
      reach: l.clicks,
      conversions: l.conversions,
    }));
    return [...fromPromos, ...fromLinks].slice(0, 6);
  }, [useDemo, promoRows, linkRows]);

  const profileUrl =
    creator?.username != null && creator.username.trim()
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}${creatorProfilePath(creator.username)}`
      : '';

  const reviewCode = code.trim().toUpperCase() || 'CODE';
  const reviewDiscount = Number(discount);
  const reviewBits = [
    Number.isInteger(reviewDiscount) && reviewDiscount >= 1 && reviewDiscount <= 100
      ? `${reviewDiscount}%`
      : null,
    duration === 'forever' ? 'Forever' : 'Once',
    maxUses.trim() ? `max ${maxUses.trim()}` : 'unlimited',
  ].filter(Boolean);

  const copyProfileLink = async () => {
    if (!profileUrl) {
      toast.error('Set a username on your profile first');
      return;
    }
    const ok = await copyToClipboard(profileUrl);
    if (ok) toast.success('Profile link copied');
    else toast.error('Could not copy — try selecting the text manually');
  };

  const comingSoon = (label: string) => {
    toast.message(`${label} coming soon`, {
      description: 'This marketing tool is not live yet — use Shareable Link or Referrals for now.',
    });
  };

  const handleCreate = async () => {
    if (!creator || saving) return;
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) {
      toast.error('Codes need at least 3 characters');
      return;
    }
    const d = Number(discount);
    if (!Number.isInteger(d) || d < 1 || d > 100) {
      toast.error('Discount must be a whole number between 1% and 100%');
      return;
    }
    const max = maxUses.trim() ? Number(maxUses) : undefined;
    if (max !== undefined && (Number.isNaN(max) || max < 1)) {
      toast.error('Max uses must be a positive number');
      return;
    }
    setSaving(true);
    try {
      await upsertPromo({
        code: clean,
        discountPercent: d,
        discountDuration: duration,
        maxUses: max,
        isActive: true,
      });
      toast.success(`${clean} created`);
      setCode('');
      setMaxUses('');
      setDuration('once');
      setCreateOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create code';
      if (msg.includes('PROMO_CODE_TAKEN')) toast.error('That code is already taken');
      else if (msg.includes('INVALID_')) toast.error('Invalid promo details');
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (
    promoId: Id<'promoCodes'>,
    next: boolean,
    existing: {
      code: string;
      discountPercent: number;
      discountDuration: PromoDiscountDuration;
      maxUses?: number;
      expiresAt?: number;
    },
  ) => {
    try {
      await upsertPromo({
        promoId,
        code: existing.code,
        discountPercent: existing.discountPercent,
        discountDuration: existing.discountDuration,
        maxUses: existing.maxUses,
        expiresAt: existing.expiresAt,
        isActive: next,
      });
      toast.success(next ? `${existing.code} enabled` : `${existing.code} disabled`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removePromo({ promoId: deleteId });
      toast.success('Code removed');
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
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
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Marketing
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground">
            Grow Your Audience
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Share links, run promos, and track how fans find you.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Megaphone className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to unlock marketing tools and promo codes.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const tools = [
    {
      id: 'share',
      title: 'Shareable Link',
      description: 'Copy your public profile URL',
      icon: Share2,
      tone: kpiIconTone.violet,
      action: () => void copyProfileLink(),
    },
    {
      id: 'templates',
      title: 'Social Templates',
      description: 'Ready-to-post captions & graphics',
      icon: Megaphone,
      tone: kpiIconTone.sky,
      action: () => comingSoon('Social templates'),
    },
    {
      id: 'embed',
      title: 'Embed',
      description: 'Add a subscribe widget to your site',
      icon: Code2,
      tone: kpiIconTone.emerald,
      action: () => comingSoon('Embed'),
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Blast announcements to subscribers',
      icon: Mail,
      tone: kpiIconTone.amber,
      action: () => comingSoon('Email campaigns'),
    },
    {
      id: 'referral',
      title: 'Referral',
      description: 'Share your referral link & track signups',
      icon: Gift,
      tone: kpiIconTone.rose,
      href: '/creator/referrals',
    },
  ] as const;

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Marketing
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Grow Your Audience
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Track reach, share your profile, and convert fans with promos and links.
          </p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="min-h-11 w-full rounded-xl sm:w-[10.5rem]" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — charts and campaigns are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states. Promo codes
            below stay live.
          </p>
        </div>
      ) : null}

      <div className="mb-6 sm:mb-8">
        <DashboardKpiStrip
          items={[
            {
              label: 'New Subscribers',
              value: String(metrics.newSubscribers),
              icon: UserPlus,
              iconClassName: kpiIconTone.violet,
              trendLabel:
                metrics.newSubscribersDelta != null
                  ? `↑ ${metrics.newSubscribersDelta}%`
                  : undefined,
              trendPositive: true,
            },
            {
              label: 'Profile Views',
              value: metrics.profileViews.toLocaleString(),
              icon: Users,
              iconClassName: kpiIconTone.sky,
              trendLabel:
                metrics.profileViewsDelta != null ? `↑ ${metrics.profileViewsDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Link Clicks',
              value: metrics.linkClicks.toLocaleString(),
              icon: MousePointerClick,
              iconClassName: kpiIconTone.emerald,
              trendLabel:
                metrics.linkClicksDelta != null ? `↑ ${metrics.linkClicksDelta}%` : undefined,
              trendPositive: true,
            },
            {
              label: 'Conversion Rate',
              value: `${metrics.conversionRate}%`,
              icon: TrendingUp,
              iconClassName: kpiIconTone.amber,
              trendLabel:
                metrics.conversionRateDelta != null
                  ? `↑ ${metrics.conversionRateDelta}%`
                  : undefined,
              trendPositive: true,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-8">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Audience Growth
          </h2>
          <div className="h-72 min-w-0 w-full">
            {growthSeries.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">
                No subscriber growth to chart yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="subscribers"
                    name="Subscribers"
                    stroke="hsl(239 84% 55%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(239 84% 55%)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] xl:col-span-4">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Traffic Sources
          </h2>
          <div className="h-56">
            {trafficSources.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No traffic data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {trafficSources.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-2 space-y-1.5">
            {trafficSources.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold tabular-nums">{s.value}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-base font-extrabold tracking-tight text-foreground">
            Marketing Tools
          </h2>
          <ul className="space-y-2">
            {tools.map((tool) => {
              const inner = (
                <>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      tool.tone,
                    )}
                  >
                    <tool.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ui font-semibold text-foreground">{tool.title}</p>
                    <p className="text-support text-muted-foreground">{tool.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </>
              );
              if ('href' in tool && tool.href) {
                return (
                  <li key={tool.id}>
                    <Link
                      to={tool.href}
                      className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
                    >
                      {inner}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={'action' in tool ? tool.action : undefined}
                    className="flex w-full min-h-11 items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    {inner}
                  </button>
                </li>
              );
            })}
          </ul>
          {profileUrl ? (
            <p className="mt-3 truncate font-mono text-caption text-muted-foreground">{profileUrl}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">Promo Codes</h2>
            <Button
              type="button"
              className="min-h-11 shrink-0 rounded-xl"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Code
            </Button>
          </div>
          {promoRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <Percent className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-ui font-semibold text-foreground">No promo codes yet</p>
              <p className="mt-1 text-support text-muted-foreground">
                Create a percent-off code for first month or forever.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2">Code</th>
                    <th className="py-2 pr-2">Discount</th>
                    <th className="py-2 pr-2">Used</th>
                    <th className="py-2 pr-2 text-center">Active</th>
                    <th className="py-2 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {promoRows.map((p) => {
                    const dur = resolveDiscountDuration(p);
                    return (
                      <tr key={p._id} className="border-b border-border/70 last:border-0">
                        <td className="py-3 pr-2 font-mono font-semibold">{p.code}</td>
                        <td className="py-3 pr-2 text-muted-foreground">
                          {p.discountPercent}% · {dur === 'forever' ? 'forever' : 'once'}
                        </td>
                        <td className="py-3 pr-2 tabular-nums text-muted-foreground">
                          {p.usedCount}
                          {p.maxUses != null ? `/${p.maxUses}` : ''}
                        </td>
                        <td className="py-3 pr-2 text-center">
                          <Switch
                            aria-label={`Promo code ${p.code} active`}
                            checked={p.isActive}
                            onCheckedChange={(v) =>
                              void handleToggle(p._id, v, {
                                code: p.code,
                                discountPercent: p.discountPercent,
                                discountDuration: dur,
                                maxUses: p.maxUses,
                                expiresAt: p.expiresAt,
                              })
                            }
                          />
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(p._id)}
                            aria-label={`Delete ${p.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-caption text-muted-foreground">
            Disabling or deleting a code does not change past purchases.
          </p>
        </section>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/creator/links"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
        >
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              kpiIconTone.violet,
            )}
          >
            <Link2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-foreground">
                Tracking Links
              </h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Create `/go/…` URLs, copy them into bios, and measure clicks vs conversions.
            </p>
          </div>
        </Link>
        <Link
          to="/creator/referrals"
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
        >
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              kpiIconTone.rose,
            )}
          >
            <Gift className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-foreground">Referrals</h3>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your referral link and track attributed signups and conversions.
            </p>
          </div>
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            Recent Campaigns
          </h2>
          <Link to="/creator/links" className="text-xs font-bold text-primary hover:underline">
            Manage links
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No campaigns yet — create a promo or tracking link to see activity here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2">Campaign</th>
                  <th className="py-2 pr-2">Channel</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2 text-right">Reach</th>
                  <th className="py-2 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-2 font-semibold text-foreground">{c.name}</td>
                    <td className="py-3 pr-2 text-muted-foreground">{c.channel}</td>
                    <td className="py-3 pr-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                          statusPill(c.status),
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right tabular-nums text-muted-foreground">
                      {c.reach.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold tabular-nums">{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 sm:items-center sm:px-5">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary sm:mt-0" aria-hidden />
        <p className="text-sm font-semibold leading-snug text-foreground">
          Pro tip: Put your shareable profile link in every social bio, then pair a limited promo
          code with a tracking link so you can see which channel converts best.
        </p>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create promo code</DialogTitle>
            <DialogDescription>
              Percent off for the first month only, or forever on every renewal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-code">Code</Label>
              <Input
                id="promo-code"
                className="h-11 min-h-11 font-mono uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER_SALE"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-discount">Discount % (1–100)</Label>
              <Input
                id="promo-discount"
                className="h-11 min-h-11"
                type="number"
                min={1}
                max={100}
                step={1}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <fieldset className="space-y-2">
              <Legend className="text-support font-medium text-muted-foreground">
                Discount duration
              </Legend>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="promo-duration"
                  className="mt-1"
                  checked={duration === 'once'}
                  onChange={() => setDuration('once')}
                />
                <span>
                  <span className="block text-ui font-medium text-foreground">Once</span>
                  <span className="text-support text-muted-foreground">First month only</span>
                </span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="promo-duration"
                  className="mt-1"
                  checked={duration === 'forever'}
                  onChange={() => setDuration('forever')}
                />
                <span>
                  <span className="block text-ui font-medium text-foreground">Forever</span>
                  <span className="text-support text-muted-foreground">Every renewal</span>
                </span>
              </label>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="promo-max">Max redemptions (optional)</Label>
              <Input
                id="promo-max"
                className="h-11 min-h-11"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-caption uppercase tracking-wider text-muted-foreground">Preview</p>
              <p className="truncate font-mono text-ui text-foreground">{reviewCode}</p>
              <p className="truncate text-support text-muted-foreground">{reviewBits.join(' · ')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={saving || !code.trim()}
              onClick={() => void handleCreate()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.code}” will be removed from your catalogue. Existing purchases keep their original discount terms.`
                : 'This code will be removed from your catalogue. Existing purchases keep their original discount terms.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

function Legend({ className, children }: { className?: string; children: ReactNode }) {
  return <legend className={className}>{children}</legend>;
}

export default CreatorPromo;
