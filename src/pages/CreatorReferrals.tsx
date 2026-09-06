import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { buildReferralCode, useCreatorProfile } from '@/hooks/useCreatorProfile';
import { UserPlus, Users, DollarSign, Copy, Gift, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

  const loading = creatorLoading || rows === undefined || savingCode;
  const referralRows = (rows ?? []).map((r) => ({
    id: r._id,
    referred_email: r.referredEmail ?? null,
    converted: r.converted,
    commission_earned: r.commissionEarnedCents / 100,
    created_at: new Date(r.createdAt).toISOString(),
  }));

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : '';
  const converted = referralRows.filter(r => r.converted).length;
  const earnings = referralRows.reduce((a, b) => a + b.commission_earned, 0);

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Grow your audience through referrals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <Users className="h-4 w-4 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{referralRows.length}</p>
          <p className="text-xs text-muted-foreground">Referred Users</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <UserPlus className="h-4 w-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">{converted}</p>
          <p className="text-xs text-muted-foreground">Converted</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-amber-400 mb-2" />
          <p className="text-2xl font-bold">${earnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Referral Earnings</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-2 flex items-center gap-2"><Gift className="h-4 w-4 text-primary" /> Your Referral Link</h2>
        <p className="text-xs text-muted-foreground mb-4">Share this link and earn 10% commission on every referred subscription.</p>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground font-mono truncate">
            {referralLink || 'Generating…'}
          </div>
          <Button
            variant="hero"
            size="sm"
            disabled={!referralLink}
            onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Referral link copied!'); }}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Referral Activity</h2>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : referralRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No referrals yet — share your link to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Referred</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-4">Commission</th>
              </tr>
            </thead>
            <tbody>
              {referralRows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm">{r.referred_email ?? 'Anonymous signup'}</td>
                  <td className="p-4 text-sm text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-4 text-xs font-medium">
                    <span className={r.converted ? 'text-emerald-500' : 'text-muted-foreground'}>
                      {r.converted ? 'Converted' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-right">${r.commission_earned.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorReferrals;
