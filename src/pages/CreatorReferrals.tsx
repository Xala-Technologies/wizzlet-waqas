import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Button } from '@/components/ui/button';
import { buildReferralCode, useCreatorProfile } from '@/hooks/useCreatorProfile';
import {
  CREATOR_REFERRALS_DEMO_ROWS,
  shouldUseCreatorReferralsDemo,
} from '@/lib/creatorReferralsDemo';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  UserPlus,
  Users,
  DollarSign,
  Copy,
  Gift,
  Loader2,
  Link2,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';

const CreatorReferrals = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const { creator, loading: creatorLoading } = useCreatorProfile();
  const rows = useQuery(api.creators.growth.listMyReferrals);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const [code, setCode] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => {
    if (creatorLoading || !creator) return;
    const ensureCode = async () => {
      let referralCode = creator.referral_code;
      if (!referralCode) {
        referralCode = buildReferralCode(creator);
        setSavingCode(true);
        try {
          await updateSettings({ referralCode });
        } catch {
          // keep generated code for display even if save fails
        } finally {
          setSavingCode(false);
        }
      }
      setCode(referralCode);
    };
    void ensureCode();
  }, [creator, creatorLoading, updateSettings]);

  const loading = creatorLoading || rows === undefined || (!!creator && (savingCode || !code));

  const liveRows = (rows ?? []).map((r) => ({
    id: r._id,
    referred_email: r.referredEmail ?? null,
    converted: r.converted,
    created_at: new Date(r.createdAt).toISOString(),
  }));

  const useDemo = shouldUseCreatorReferralsDemo({
    count: liveRows.length,
    forceDemo,
    disableDemo,
  });

  const referralRows = useDemo ? CREATOR_REFERRALS_DEMO_ROWS : liveRows;

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : '';
  const converted = referralRows.filter((r) => r.converted).length;

  const copyReferral = async () => {
    if (!referralLink) return;
    const ok = await copyToClipboard(referralLink);
    if (ok) toast.success('Referral link copied');
    else toast.error('Could not copy — try selecting the text manually');
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
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground">Referrals</h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Share your link to attribute signups. Conversions mark when they subscribe.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Gift className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to get a referral link.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Marketing
          </p>
          <h1 className="mt-1 text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Referrals
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Share your link to attribute signups. Conversions mark when they subscribe.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-xl">
            <Link to="/creator/promo">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Marketing
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-xl">
            <Link to="/creator/links">
              <Link2 className="mr-1.5 h-4 w-4" /> Tracking Links
            </Link>
          </Button>
        </div>
      </header>

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — referral activity is mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states. Your
            referral link below stays live.
          </p>
        </div>
      ) : null}

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="flex items-center gap-2 text-ui font-semibold text-foreground">
          <Gift className="h-4 w-4 text-primary" /> Your referral link
        </h2>
        <p className="text-support text-muted-foreground">
          Share this link to attribute signups. Conversion marks when they subscribe; cash
          commission payouts are not enabled yet.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-h-11 min-w-0 flex-1 items-center truncate rounded-lg border border-border bg-muted/30 px-4 py-2.5 font-mono text-ui text-muted-foreground">
            {referralLink || 'Generating…'}
          </div>
          <Button
            type="button"
            variant="hero"
            className="min-h-11 w-full shrink-0 sm:w-auto"
            disabled={!referralLink}
            onClick={() => void copyReferral()}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <DashboardKpiStrip
          items={[
            {
              label: 'Referred users',
              value: String(referralRows.length),
              icon: Users,
              iconClassName: kpiIconTone.violet,
            },
            {
              label: 'Attributed conversions',
              value: String(converted),
              icon: UserPlus,
              iconClassName: kpiIconTone.sky,
            },
            {
              label: 'Cash commission (not enabled)',
              value: '—',
              icon: DollarSign,
              iconClassName: kpiIconTone.amber,
            },
          ]}
        />
      </div>

      <h2 className="mb-3 text-support font-medium text-muted-foreground">Referral activity</h2>
      {referralRows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Gift className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No referrals yet</h3>
          <p className="mx-auto max-w-sm text-support text-muted-foreground">
            Share your referral link above to attribute signups.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <MobileRecordCards>
            {referralRows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-ui font-semibold text-foreground">
                      {r.referred_email ?? 'Anonymous signup'}
                    </p>
                    <p className="mt-0.5 text-support text-muted-foreground">
                      {format(new Date(r.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold',
                      r.converted ? resultPillTone.win : resultPillTone.pending,
                    )}
                  >
                    {r.converted ? 'Converted' : 'Pending'}
                  </span>
                </div>
                <p className="mt-3 text-support text-muted-foreground">Commission —</p>
              </li>
            ))}
          </MobileRecordCards>

          <DesktopTableRegion label="Referral activity table">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-left text-support font-medium text-muted-foreground">
                    Referred
                  </th>
                  <th className="p-4 text-left text-support font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="p-4 text-left text-support font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="p-4 text-right text-support font-medium text-muted-foreground">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {referralRows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-ui text-foreground">
                      {r.referred_email ?? 'Anonymous signup'}
                    </td>
                    <td className="p-4 text-ui text-muted-foreground">
                      {format(new Date(r.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-support font-medium">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                          r.converted ? resultPillTone.win : resultPillTone.pending,
                        )}
                      >
                        {r.converted ? 'Converted' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-ui text-muted-foreground">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DesktopTableRegion>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorReferrals;
