import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Percent, Palette, Shield, MessageSquare, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettings {
  standard_fee_percent: number;
  intro_fee_percent: number;
  intro_period_days: number;
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
  platform_name: 'Wizzlet',
  support_email: 'support@wizzlet.com',
  tagline: 'The premium creator platform',
  min_payout_amount: 50,
  payout_schedule: 'monthly',
  creator_messaging_enabled: true,
  growth_manager_enabled: true,
  auto_approve_creators: false,
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', true)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) setSettings({ ...DEFAULTS, ...(data as unknown as PlatformSettings) });
      setLoading(false);
    };
    void load();
  }, []);

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (settings.standard_fee_percent < 0 || settings.standard_fee_percent > 50) {
      toast.error('Standard fee must be between 0 and 50%');
      return;
    }
    if (!settings.platform_name.trim() || !settings.support_email.trim()) {
      toast.error('Platform name and support email are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('platform_settings')
      .update({
        standard_fee_percent: settings.standard_fee_percent,
        intro_fee_percent: settings.intro_fee_percent,
        intro_period_days: settings.intro_period_days,
        platform_name: settings.platform_name.trim(),
        support_email: settings.support_email.trim(),
        tagline: settings.tagline,
        min_payout_amount: settings.min_payout_amount,
        payout_schedule: settings.payout_schedule,
        creator_messaging_enabled: settings.creator_messaging_enabled,
        growth_manager_enabled: settings.growth_manager_enabled,
        auto_approve_creators: settings.auto_approve_creators,
      })
      .eq('id', true);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Platform settings saved');
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword('');
    toast.success('Password updated');
  };

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure platform-wide settings</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Platform Fee Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Standard Fee (%)</Label>
            <Input type="number" value={settings.standard_fee_percent}
              onChange={e => set('standard_fee_percent', Number(e.target.value))}
              className="mt-1" min="0" max="50" step="0.5" />
            <p className="text-xs text-muted-foreground mt-1">Applied after intro period</p>
          </div>
          <div>
            <Label className="text-xs">Intro Fee (%)</Label>
            <Input type="number" value={settings.intro_fee_percent}
              onChange={e => set('intro_fee_percent', Number(e.target.value))}
              className="mt-1" min="0" max="50" step="0.5" />
            <p className="text-xs text-muted-foreground mt-1">Discounted rate for new creators</p>
          </div>
          <div>
            <Label className="text-xs">Intro Period (days)</Label>
            <Input type="number" value={settings.intro_period_days}
              onChange={e => set('intro_period_days', Number(e.target.value))}
              className="mt-1" min="1" max="365" />
            <p className="text-xs text-muted-foreground mt-1">How long intro fee lasts</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Current rule:</strong> New creators pay {settings.intro_fee_percent}% for the first{' '}
            {settings.intro_period_days} days, then {settings.standard_fee_percent}% after.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Payout Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Minimum payout threshold ($)</Label>
            <Input type="number" value={settings.min_payout_amount}
              onChange={e => set('min_payout_amount', Number(e.target.value))}
              className="mt-1" min="0" step="5" />
            <p className="text-xs text-muted-foreground mt-1">Creators must earn this before withdrawing</p>
          </div>
          <div>
            <Label className="text-xs">Payout schedule</Label>
            <Select value={settings.payout_schedule} onValueChange={v => set('payout_schedule', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every two weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">How often payouts are processed</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Branding</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Platform Name</Label>
            <Input value={settings.platform_name} onChange={e => set('platform_name', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Support Email</Label>
            <Input value={settings.support_email} onChange={e => set('support_email', e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Tagline</Label>
            <Textarea value={settings.tagline} onChange={e => set('tagline', e.target.value)}
              className="mt-1 resize-none" rows={2} maxLength={100} />
            <p className="text-xs text-muted-foreground mt-1">{settings.tagline.length}/100</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Messaging Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div><p className="text-sm font-medium">Creator messaging</p><p className="text-xs text-muted-foreground">Allow creators to message subscribers</p></div>
            <Switch aria-label="Creator messaging" checked={settings.creator_messaging_enabled} onCheckedChange={v => set('creator_messaging_enabled', v)} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div><p className="text-sm font-medium">Growth Manager chat</p><p className="text-xs text-muted-foreground">Creator-to-admin conversations</p></div>
            <Switch aria-label="Growth Manager chat" checked={settings.growth_manager_enabled} onCheckedChange={v => set('growth_manager_enabled', v)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> General</h2>
        <div className="flex items-center justify-between py-3">
          <div><p className="text-sm font-medium">Auto-approve creators</p><p className="text-xs text-muted-foreground">New creators are published automatically</p></div>
          <Switch aria-label="Auto-approve creators" checked={settings.auto_approve_creators} onCheckedChange={v => set('auto_approve_creators', v)} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Admin Account</h2>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs">New password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters" className="mt-1" />
          </div>
          <Button variant="outline" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
            {changingPassword && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Update password
          </Button>
        </div>
      </div>

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
