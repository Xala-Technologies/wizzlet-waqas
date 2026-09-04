import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Wallet, Clock, Settings, ArrowDownToLine, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Payout {
  id: string;
  amount: number;
  status: string;
  method: string;
  created_at: string;
  processed_at: string | null;
}

interface PayoutSettings {
  method: string;
  account_label: string;
  schedule: string;
  minimum_payout: number;
}

const defaultSettings: PayoutSettings = {
  method: 'bank_transfer',
  account_label: '',
  schedule: 'monthly',
  minimum_payout: 50,
};

const CreatorPayouts = () => {
  const { creator, loading: creatorLoading } = useCreatorProfile();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [settings, setSettings] = useState<PayoutSettings>(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (creatorLoading) return;
    if (!creator) { setLoading(false); return; }
    const load = async () => {
      const [{ data: payoutRows }, { data: subs }, { data: settingsRow }] = await Promise.all([
        supabase
          .from('payouts')
          .select('id, amount, status, method, created_at, processed_at')
          .eq('creator_id', creator.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('subscriptions')
          .select('creator_earnings')
          .eq('creator_id', creator.id)
          .eq('status', 'active'),
        supabase
          .from('creator_payout_settings')
          .select('method, account_label, schedule, minimum_payout')
          .eq('creator_id', creator.id)
          .maybeSingle(),
      ]);

      setPayouts((payoutRows ?? []).map(p => ({ ...p, amount: Number(p.amount) })));
      setLifetimeEarnings((subs ?? []).reduce((a, b) => a + Number(b.creator_earnings), 0));
      if (settingsRow) {
        setSettings({
          method: settingsRow.method,
          account_label: settingsRow.account_label ?? '',
          schedule: settingsRow.schedule,
          minimum_payout: Number(settingsRow.minimum_payout),
        });
      }
      setLoading(false);
    };
    void load();
  }, [creator, creatorLoading]);

  const paidOut = payouts.filter(p => p.status === 'completed').reduce((a, b) => a + b.amount, 0);
  const pending = payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((a, b) => a + b.amount, 0);
  const available = Math.max(lifetimeEarnings - paidOut - pending, 0);

  const saveSettings = async () => {
    if (!creator) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('creator_payout_settings')
      .upsert({ creator_id: creator.id, ...settings, account_label: settings.account_label || null }, { onConflict: 'creator_id' });
    setSavingSettings(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Payout settings saved');
  };

  const requestPayout = async () => {
    if (!creator) return;
    if (available < settings.minimum_payout) {
      toast.error(`Minimum payout is $${settings.minimum_payout.toFixed(2)}`);
      return;
    }
    setRequesting(true);
    const { error } = await supabase.from('support_messages').insert({
      creator_id: creator.id,
      sender_role: 'creator',
      channel: 'payout',
      body: `Payout request for $${available.toFixed(2)} via ${settings.method.replace('_', ' ')}.`,
    });
    setRequesting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Payout request sent — our team will process it shortly');
  };

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage withdrawals and payout settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-6 relative overflow-hidden">
          <Wallet className="h-4 w-4 text-emerald-500 mb-3" />
          <p className="text-3xl font-bold tracking-tight">${available.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
          <Button variant="hero" size="sm" className="mt-4" onClick={requestPayout} disabled={requesting || available <= 0}>
            {requesting
              ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Sending…</>
              : <><ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" /> Request Payout</>}
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Clock className="h-4 w-4 text-amber-500 mb-3" />
          <p className="text-3xl font-bold tracking-tight">${pending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending Payouts</p>
          <p className="text-[10px] text-muted-foreground mt-4">Awaiting processing by the platform</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <TrendingUp className="h-4 w-4 text-primary mb-3" />
          <p className="text-3xl font-bold tracking-tight">${paidOut.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Paid Out</p>
          <p className="text-[10px] text-muted-foreground mt-4">Lifetime earnings ${lifetimeEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Payout Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Method</Label>
            <Select value={settings.method} onValueChange={v => setSettings(s => ({ ...s, method: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Account Reference</Label>
            <Input
              className="mt-1.5"
              placeholder="e.g. ••••4582"
              value={settings.account_label}
              onChange={e => setSettings(s => ({ ...s, account_label: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Schedule</Label>
            <Select value={settings.schedule} onValueChange={v => setSettings(s => ({ ...s, schedule: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Minimum Payout ($)</Label>
            <Input
              type="number"
              min="0"
              className="mt-1.5"
              value={settings.minimum_payout}
              onChange={e => setSettings(s => ({ ...s, minimum_payout: Number(e.target.value) }))}
            />
          </div>
        </div>
        <Button variant="hero" size="sm" className="mt-5" onClick={saveSettings} disabled={savingSettings}>
          {savingSettings && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Settings
        </Button>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Payout History</h2>
      {payouts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No payouts yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Method</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4 text-sm">{format(new Date(p.processed_at ?? p.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-4 text-sm font-bold">${p.amount.toFixed(2)}</td>
                  <td className="p-4 text-sm text-muted-foreground capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${
                      p.status === 'completed' ? 'text-emerald-500' : p.status === 'failed' ? 'text-destructive' : 'text-amber-500'
                    }`}>
                      {p.status === 'completed' && <CheckCircle2 className="h-3 w-3" />} {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorPayouts;
