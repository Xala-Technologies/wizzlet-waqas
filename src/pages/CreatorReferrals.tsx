import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
import { Button } from '@/components/ui/button';
import { buildReferralCode, useCreatorProfile } from '@/hooks/useCreatorProfile';
import { UserPlus, Users, DollarSign, Copy, Gift, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';

const CreatorReferrals = () => {
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
  const referralRows = (rows ?? []).map((r) => ({
    id: r._id,
    referred_email: r.referredEmail ?? null,
    converted: r.converted,
    created_at: new Date(r.createdAt).toISOString(),
  }));

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
          <h1 className="text-heading font-bold text-foreground">Referrals</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Share your link to attribute signups. Conversions mark when they subscribe.
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
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
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Referrals</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Share your link to attribute signups. Conversions mark when they subscribe.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6 space-y-4">
        <h2 className="text-ui font-semibold text-foreground flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> Your referral link
        </h2>
        <p className="text-support text-muted-foreground">
          Share this link to attribute signups. Conversion marks when they subscribe; cash
          commission payouts are not enabled yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-4 py-2.5 min-h-11 flex items-center text-ui text-muted-foreground font-mono truncate">
            {referralLink || 'Generating…'}
          </div>
          <Button
            type="button"
            variant="hero"
            className="min-h-11 w-full sm:w-auto shrink-0"
            disabled={!referralLink}
            onClick={() => void copyReferral()}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-support text-muted-foreground">Referred users</p>
          </div>
          <p className="text-ui font-bold text-foreground">{referralRows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-support text-muted-foreground">Attributed conversions</p>
          </div>
          <p className="text-ui font-bold text-foreground">{converted}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-support text-muted-foreground">Cash commission (not enabled)</p>
          </div>
          <p className="text-ui font-bold text-foreground">—</p>
        </div>
      </div>

      <h2 className="text-support font-medium text-muted-foreground mb-3">Referral activity</h2>
      {referralRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No referrals yet</h3>
          <p className="text-support text-muted-foreground max-w-sm mx-auto">
            Share your referral link above to attribute signups.
          </p>
        </div>
      ) : (
        <>
          <MobileRecordCards>
            {referralRows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ui font-semibold text-foreground truncate">
                      {r.referred_email ?? 'Anonymous signup'}
                    </p>
                    <p className="text-support text-muted-foreground mt-0.5">
                      {format(new Date(r.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span
                    className={`text-support font-medium shrink-0 ${
                      r.converted ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  >
                    {r.converted ? 'Converted' : 'Pending'}
                  </span>
                </div>
                <p className="text-support text-muted-foreground mt-3">Commission —</p>
              </li>
            ))}
          </MobileRecordCards>

          <DesktopTableRegion label="Referral activity table">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-support font-medium text-muted-foreground p-4">
                    Referred
                  </th>
                  <th className="text-left text-support font-medium text-muted-foreground p-4">
                    Date
                  </th>
                  <th className="text-left text-support font-medium text-muted-foreground p-4">
                    Status
                  </th>
                  <th className="text-right text-support font-medium text-muted-foreground p-4">
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
                      <span className={r.converted ? 'text-emerald-500' : 'text-muted-foreground'}>
                        {r.converted ? 'Converted' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-ui text-muted-foreground text-right">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DesktopTableRegion>
        </>
      )}
    </DashboardLayout>
  );
};

export default CreatorReferrals;
