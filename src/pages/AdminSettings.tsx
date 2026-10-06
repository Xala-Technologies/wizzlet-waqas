import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { adminSectionTitle } from '@/components/dashboard/AdminPageHeader';
import { clayCard } from '@/lib/overviewClay';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Percent, Palette, Shield, MessageSquare, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettings {
  standard_fee_percent: number;
  intro_fee_percent: number;
  intro_period_days: number;
  referral_commission_percent: number;
  platform_name: string;
  support_email: string;
  tagline: string;
  min_payout_amount: number;
  payout_schedule: string;
  creator_messaging_enabled: boolean;
  growth_manager_enabled: boolean;
  auto_approve_creators: boolean;
}

const DEFAULTS: PlatformSettings = {
  standard_fee_percent: 10,
  intro_fee_percent: 5,
  intro_period_days: 30,
  referral_commission_percent: 10,
  platform_name: 'Sweeph',
  support_email: 'support@sweeph.com',
  tagline: 'The premium creator platform',
  min_payout_amount: 50,
  payout_schedule: 'monthly',
  creator_messaging_enabled: true,
  growth_manager_enabled: true,
  auto_approve_creators: false,
};

function fromConvex(raw: {
  standardFeePercent?: number;
  introFeePercent?: number;
  introFeeDays?: number;
  referralCommissionPercent?: number;
  branding?: unknown;
  payoutDefaults?: unknown;
  featureFlags?: unknown;
}): PlatformSettings {
  const branding = (raw.branding ?? {}) as Record<string, unknown>;
  const payoutDefaults = (raw.payoutDefaults ?? {}) as Record<string, unknown>;
  const featureFlags = (raw.featureFlags ?? {}) as Record<string, unknown>;
  return {
    standard_fee_percent: raw.standardFeePercent ?? DEFAULTS.standard_fee_percent,
    intro_fee_percent: raw.introFeePercent ?? DEFAULTS.intro_fee_percent,
    intro_period_days: raw.introFeeDays ?? DEFAULTS.intro_period_days,
    referral_commission_percent:
      raw.referralCommissionPercent ?? DEFAULTS.referral_commission_percent,
    platform_name: String(branding.platformName ?? branding.platform_name ?? DEFAULTS.platform_name),
    support_email: String(branding.supportEmail ?? branding.support_email ?? DEFAULTS.support_email),
    tagline: String(branding.tagline ?? DEFAULTS.tagline),
    min_payout_amount: Number(payoutDefaults.minPayoutAmount ?? payoutDefaults.min_payout_amount ?? DEFAULTS.min_payout_amount),
    payout_schedule: String(payoutDefaults.payoutSchedule ?? payoutDefaults.payout_schedule ?? DEFAULTS.payout_schedule),
    creator_messaging_enabled: Boolean(featureFlags.creatorMessagingEnabled ?? featureFlags.creator_messaging_enabled ?? DEFAULTS.creator_messaging_enabled),
    growth_manager_enabled: Boolean(featureFlags.growthManagerEnabled ?? featureFlags.growth_manager_enabled ?? DEFAULTS.growth_manager_enabled),
    auto_approve_creators: Boolean(featureFlags.autoApproveCreators ?? featureFlags.auto_approve_creators ?? DEFAULTS.auto_approve_creators),
  };
}

function SettingsSectionHeader({
  icon: Icon,
  tone,
  title,
}: {
  icon: React.ElementType;
  tone: string;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          tone,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h2 className={adminSectionTitle}>{title}</h2>
    </div>
  );
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const platformRaw = useQuery(api.platform.mutations.get);
  const upsertPlatform = useMutation(api.platform.mutations.upsert);
  const changePasswordAction = useAction(api.users.queries.changePassword);

  useEffect(() => {
    if (platformRaw) setSettings(fromConvex(platformRaw));
  }, [platformRaw]);

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (settings.standard_fee_percent < 0 || settings.standard_fee_percent > 50) {
      toast.error('Standard fee must be between 0 and 50%');
      return;
    }
    if (
      settings.referral_commission_percent < 0 ||
      settings.referral_commission_percent > 100
    ) {
      toast.error('Referral commission must be between 0 and 100%');
      return;
    }
    if (!settings.platform_name.trim() || !settings.support_email.trim()) {
      toast.error('Platform name and support email are required');
      return;
    }
    setSaving(true);
    try {
      await upsertPlatform({
        standardFeePercent: settings.standard_fee_percent,
        introFeePercent: settings.intro_fee_percent,
        introFeeDays: settings.intro_period_days,
        referralCommissionPercent: settings.referral_commission_percent,
        branding: {
          platformName: settings.platform_name.trim(),
          supportEmail: settings.support_email.trim(),
          tagline: settings.tagline,
        },
        payoutDefaults: {
          minPayoutAmount: settings.min_payout_amount,
          payoutSchedule: settings.payout_schedule,
        },
        featureFlags: {
          creatorMessagingEnabled: settings.creator_messaging_enabled,
          growthManagerEnabled: settings.growth_manager_enabled,
          autoApproveCreators: settings.auto_approve_creators,
        },
      });
      toast.success('Platform settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await changePasswordAction({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated — please sign in again');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (platformRaw === undefined) {
    return (
      <DashboardLayout type="admin" mainClassName="bg-clay-page">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <SettingsSectionHeader icon={Percent} tone={kpiIconTone.violet} title="Platform fee settings" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-caption">Standard Fee (%)</Label>
            <Input type="number" value={settings.standard_fee_percent}
              onChange={e => set('standard_fee_percent', Number(e.target.value))}
              className="mt-1" min="0" max="50" step="0.5" />
            <p className="text-caption text-muted-foreground mt-1">Applied after intro period</p>
          </div>
          <div>
            <Label className="text-caption">Intro Fee (%)</Label>
            <Input type="number" value={settings.intro_fee_percent}
              onChange={e => set('intro_fee_percent', Number(e.target.value))}
              className="mt-1" min="0" max="50" step="0.5" />
            <p className="text-caption text-muted-foreground mt-1">Discounted rate for new creators</p>
          </div>
          <div>
            <Label className="text-caption">Intro Period (days)</Label>
            <Input type="number" value={settings.intro_period_days}
              onChange={e => set('intro_period_days', Number(e.target.value))}
              className="mt-1" min="1" max="365" />
            <p className="text-caption text-muted-foreground mt-1">How long intro fee lasts</p>
          </div>
          <div>
            <Label className="text-caption">Referral commission (%)</Label>
            <Input type="number" value={settings.referral_commission_percent}
              onChange={e => set('referral_commission_percent', Number(e.target.value))}
              className="mt-1" min="0" max="100" step="1" />
            <p className="text-caption text-muted-foreground mt-1">Accrued on referred paid subscribe</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-muted/30 p-3">
          <p className="text-caption text-muted-foreground">
            <strong>Current rule:</strong> New creators pay {settings.intro_fee_percent}% for the first{' '}
            {settings.intro_period_days} days, then {settings.standard_fee_percent}% after.
            Referred paid subscribes accrue {settings.referral_commission_percent}% commission
            (admin sends via Stripe Connect on Payouts; ledger-only mark is a backup).
          </p>
        </div>
      </section>

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <SettingsSectionHeader icon={Wallet} tone={kpiIconTone.emerald} title="Payout settings" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-caption">Minimum payout threshold ($)</Label>
            <Input type="number" value={settings.min_payout_amount}
              onChange={e => set('min_payout_amount', Number(e.target.value))}
              className="mt-1" min="0" step="5" />
            <p className="text-caption text-muted-foreground mt-1">Creators must earn this before withdrawing</p>
          </div>
          <div>
            <Label className="text-caption">Payout schedule</Label>
            <Select value={settings.payout_schedule} onValueChange={v => set('payout_schedule', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every two weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground mt-1">How often payouts are processed</p>
          </div>
        </div>
      </section>

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <SettingsSectionHeader icon={Palette} tone={kpiIconTone.amber} title="Branding" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-caption">Platform Name</Label>
            <Input value={settings.platform_name} onChange={e => set('platform_name', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-caption">Support Email</Label>
            <Input value={settings.support_email} onChange={e => set('support_email', e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-caption">Tagline</Label>
            <Textarea value={settings.tagline} onChange={e => set('tagline', e.target.value)}
              className="mt-1 resize-none" rows={2} maxLength={100} />
            <p className="text-caption text-muted-foreground mt-1">{settings.tagline.length}/100</p>
          </div>
        </div>
      </section>

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <SettingsSectionHeader icon={MessageSquare} tone={kpiIconTone.sky} title="Messaging settings" />
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border py-3">
            <div><p className="text-sm font-medium">Creator messaging</p><p className="text-caption text-muted-foreground">Allow creators to message subscribers</p></div>
            <Switch aria-label="Creator messaging" checked={settings.creator_messaging_enabled} onCheckedChange={v => set('creator_messaging_enabled', v)} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div><p className="text-sm font-medium">Growth Manager chat</p><p className="text-caption text-muted-foreground">Creator-to-admin conversations</p></div>
            <Switch aria-label="Growth Manager chat" checked={settings.growth_manager_enabled} onCheckedChange={v => set('growth_manager_enabled', v)} />
          </div>
        </div>
      </section>

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <SettingsSectionHeader icon={Settings} tone={kpiIconTone.cyan} title="General" />
        <div className="flex items-center justify-between py-3">
          <div><p className="text-sm font-medium">Auto-approve creators</p><p className="text-caption text-muted-foreground">New creators are published automatically</p></div>
          <Switch aria-label="Auto-approve creators" checked={settings.auto_approve_creators} onCheckedChange={v => set('auto_approve_creators', v)} />
        </div>
      </section>

      <section className={cn(clayCard, 'mb-6 p-4 sm:p-6')}>
        <SettingsSectionHeader icon={Shield} tone={kpiIconTone.rose} title="Admin account" />
        <div className="flex max-w-md flex-col gap-3">
          <div>
            <Label className="text-caption">Current password</Label>
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="mt-1" autoComplete="current-password" />
          </div>
          <div>
            <Label className="text-caption">New password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters" className="mt-1" autoComplete="new-password" />
          </div>
          <Button
            variant="outline"
            className="w-fit"
            onClick={handlePasswordChange}
            disabled={changingPassword || !newPassword || !currentPassword}
          >
            {changingPassword && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Update password
          </Button>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Save Settings
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
