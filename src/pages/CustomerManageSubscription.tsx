import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  BadgeCheck,
  Ban,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  Radio,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
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
import { Seo } from '@/components/Seo';
import { useAppUser } from '@/hooks/useAppUser';
import { api } from '@convex/_generated/api';
import { cancelSubscription, openCustomerPortal } from '@/lib/stripe';
import { describeSubscriptionAccess } from '@/lib/billingAccess';
import {
  getMemberManageSubscriptionDemo,
  type MemberManageBillingRow,
  type MemberManageFeature,
  type MemberManageSubscriptionDetail,
} from '@/lib/memberMyCreatorsDemo';
import { cn } from '@/lib/utils';

const FEATURE_ICONS = [Target, BookOpen, Radio, Users, BookOpen] as const;

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

function VisaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded bg-[#1A1F71] px-1.5 text-[10px] font-extrabold italic tracking-wide text-white',
        className,
      )}
      aria-hidden
    >
      VISA
    </span>
  );
}

const CustomerManageSubscription = () => {
  const { username: usernameParam } = useParams<{ username: string }>();
  const username = (usernameParam ?? '').toLowerCase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const demoQs = forceDemo ? '?demo=1' : disableDemo ? '?demo=0' : '';
  const backHref = `/dashboard/subscriptions-billing${demoQs}`;

  const { appUserId, loading: userLoading } = useAppUser();
  const subsRaw = useQuery(
    api.subscriptions.mutations.mySubscriptionsDetailed,
    appUserId ? {} : 'skip',
  );
  const eventsRaw = useQuery(
    api.subscriptions.mutations.myPaymentEvents,
    appUserId ? {} : 'skip',
  );

  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const demoDetail = getMemberManageSubscriptionDemo(username);
  const liveSub = useMemo(() => {
    if (!subsRaw || !username) return null;
    return (
      subsRaw.find((s) => s.creator.username.toLowerCase() === username) ?? null
    );
  }, [subsRaw, username]);

  const useDemo = !disableDemo && !!demoDetail && (forceDemo || !liveSub);

  const detail: MemberManageSubscriptionDetail | null = useMemo(() => {
    if (useDemo && demoDetail) return demoDetail;
    if (!liveSub) return demoDetail;
    const now = Date.now();
    const access = describeSubscriptionAccess(
      {
        status: liveSub.status,
        billingStatus: liveSub.billingStatus,
        currentPeriodEnd: liveSub.currentPeriodEnd,
        cancelAtPeriodEnd: liveSub.cancelAtPeriodEnd === true,
      },
      now,
    );
    const name = liveSub.creator.displayName?.trim() || liveSub.creator.username;
    const price = liveSub.amountCents || liveSub.creator.monthlyPriceCents || 999;
    const planLabel = price >= 1999 ? 'VIP' : 'Premium';
    const features: MemberManageFeature[] = [
      {
        title: 'Daily picks',
        description: `Get ${name.split(' ')[0]}'s top picks every day.`,
      },
      {
        title: 'Detailed analysis',
        description: 'In-depth breakdowns and reasoning.',
      },
      {
        title: 'Live streams',
        description: 'Access to member-only live streams.',
      },
      {
        title: 'Private community',
        description: `Join discussions with ${name.split(' ')[0]} and other members.`,
      },
      {
        title: 'Betting guides & resources',
        description: 'Access to exclusive tools and guides.',
      },
    ];
    const billingHistory: MemberManageBillingRow[] = (eventsRaw ?? [])
      .filter((e) => e.creatorName.toLowerCase().includes(name.toLowerCase().slice(0, 6)))
      .slice(0, 8)
      .map((e) => ({
        id: e._id,
        dateLabel: format(new Date(e.createdAt), 'MMM d, yyyy'),
        amountCents: e.amountCents,
        status: e.status.toLowerCase().includes('fail')
          ? ('Failed' as const)
          : e.status.toLowerCase().includes('pend')
            ? ('Pending' as const)
            : ('Paid' as const),
      }));
    return {
      username: liveSub.creator.username,
      displayName: name,
      bio: 'Subscribed creator on Prizelet — exclusive picks and analysis.',
      avatarUrl: liveSub.creator.avatarUrl ?? null,
      avatarInitials: name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      avatarTone: 'bg-muted text-muted-foreground',
      planLabel,
      tags: ['Sports'],
      verified: true,
      statusLabel: access.hasAccess ? 'Active' : 'Canceled',
      priceCents: price,
      pricePeriod: 'month',
      paymentBrand: 'Visa',
      paymentLast4: '••••',
      features,
      billingHistory:
        billingHistory.length > 0
          ? billingHistory
          : [
              {
                id: 'empty',
                dateLabel: liveSub.currentPeriodEnd
                  ? format(new Date(liveSub.currentPeriodEnd), 'MMM d, yyyy')
                  : '—',
                amountCents: price,
                status: 'Paid' as const,
              },
            ],
    };
  }, [useDemo, demoDetail, liveSub, eventsRaw]);

  const loading = !useDemo && (userLoading || (appUserId && subsRaw === undefined));

  const openPortal = async () => {
    if (portalLoading) return;
    if (useDemo || !liveSub) {
      toast.message('Sample preview', {
        description: 'Payment methods update in Stripe after a real subscription.',
      });
      return;
    }
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (cancelling) return;
    if (useDemo || !liveSub) {
      toast.message('Sample preview', {
        description: 'Cancel is available on live subscriptions.',
      });
      setCancelOpen(false);
      return;
    }
    setCancelling(true);
    try {
      await cancelSubscription(liveSub.creator._id);
      setCancelOpen(false);
      navigate(backHref);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <Seo title="Manage Subscription — Prizelet" />
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!detail) {
    return (
      <DashboardLayout type="member">
        <Seo title="Manage Subscription — Prizelet" />
        <Link
          to={backHref}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to My Creators
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">Subscription not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This creator isn&apos;t in your active subscriptions.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to={backHref}>Back to My Creators</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isEmoji =
    detail.avatarInitials === '👑' ||
    detail.avatarInitials === '🎾' ||
    detail.avatarInitials.length === 1;

  return (
    <DashboardLayout type="member">
      <Seo
        title={`Manage ${detail.displayName} — Prizelet`}
        description={`View and manage your subscription to ${detail.displayName}.`}
      />

      <Link
        to={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to My Creators
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Manage Subscription
        </h1>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
          View and manage your subscription to {detail.displayName}.
        </p>
      </header>

      {useDemo ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample subscription details for design review. Add{' '}
            <code className="rounded bg-amber-500/20 px-1">?demo=0</code> for live data.
          </p>
        </div>
      ) : null}

      {/* Overview card */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold shadow-sm',
                !detail.avatarUrl && detail.avatarTone,
              )}
            >
              {detail.avatarUrl ? (
                <img src={detail.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className={isEmoji ? 'text-xl' : undefined}>{detail.avatarInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-lg font-extrabold text-foreground">{detail.displayName}</h2>
                {detail.verified ? (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
                ) : null}
              </div>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{detail.planLabel}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-2 lg:min-w-[280px]">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Subscription status</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    detail.statusLabel === 'Active' ? 'bg-emerald-500' : 'bg-muted-foreground',
                  )}
                  aria-hidden
                />
                {detail.statusLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Plan</dt>
              <dd className="mt-1 text-sm font-bold text-foreground">{detail.planLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Price</dt>
              <dd className="mt-1 text-sm font-bold text-foreground">
                {money(detail.priceCents)} / {detail.pricePeriod}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Payment method</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                <VisaMark />
                <span className="tracking-wider">
                  {detail.paymentLast4.length === 4
                    ? `•••• ${detail.paymentLast4}`
                    : detail.paymentLast4}
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:underline"
                  onClick={() => void openPortal()}
                >
                  Change
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Features + Manage actions */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h3 className="text-base font-extrabold tracking-tight text-foreground">Plan Features</h3>
          <ul className="mt-4 space-y-4">
            {detail.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]!;
              return (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{f.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h3 className="text-base font-extrabold tracking-tight text-foreground">
            Manage Subscription
          </h3>
          <ul className="mt-4 space-y-3">
            <li>
              <button
                type="button"
                onClick={() => void openPortal()}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CreditCard className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">
                    Update payment method
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Change your card or billing details.
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  toast.message('Change plan', {
                    description: useDemo
                      ? 'Sample preview — plan changes open in Stripe for live subscriptions.'
                      : 'Use the billing portal to upgrade or downgrade.',
                  })
                }
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">Change plan</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Upgrade or downgrade your subscription.
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3.5 text-left transition-colors hover:bg-rose-500/15"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Ban className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">Cancel subscription</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    You will lose access to all premium content at the end of your current billing
                    period.
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-rose-600/70 dark:text-rose-400/70"
                  aria-hidden
                />
              </button>
            </li>
          </ul>
        </section>
      </div>

      {/* Billing history */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h3 className="text-base font-extrabold tracking-tight text-foreground">Billing History</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-semibold">Date</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {detail.billingHistory.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-3.5 pr-4 font-medium text-foreground">{row.dateLabel}</td>
                  <td className="py-3.5 pr-4 font-semibold tabular-nums text-foreground">
                    {money(row.amountCents)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          row.status === 'Paid' ? 'bg-emerald-500' : 'bg-muted-foreground',
                        )}
                        aria-hidden
                      />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground"
                      aria-label={`Download receipt for ${row.dateLabel}`}
                      onClick={() =>
                        toast.message('Receipt', {
                          description: useDemo
                            ? 'Sample preview — receipts download for live charges.'
                            : 'Receipt download opens from Stripe.',
                        })
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to {detail.displayName}&apos;s premium content at the end of your
              current billing period. You can resubscribe anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                void confirmCancel();
              }}
            >
              {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CustomerManageSubscription;
