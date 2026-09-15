import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadToConvexStorage } from '@/lib/upload';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Banknote,
  Bell,
  Camera,
  CreditCard,
  ImageIcon,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Lock,
  Settings,
  Shield,
  Sparkles,
  Upload,
  User,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BIO_MAX = 280;

const SETTINGS_TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'account', label: 'Account' },
  { value: 'payouts', label: 'Payouts' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Security' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'billing', label: 'Billing' },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]['value'];

const cardClass =
  'rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-5';

const CreatorSettings = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const me = useQuery(api.users.queries.me);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const convex = useConvex();
  const bannerRef = useRef<HTMLInputElement>(null);
  const hydratedCreatorId = useRef<string | null>(null);

  const [tab, setTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [discordServerId, setDiscordServerId] = useState('');
  const [discordRoleId, setDiscordRoleId] = useState('');

  const [notifNewSubs, setNotifNewSubs] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifPicks, setNotifPicks] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Hydrate once per creator id — do not wipe dirty edits on reactive profile refreshes.
  useEffect(() => {
    if (!creator) {
      hydratedCreatorId.current = null;
      return;
    }
    if (hydratedCreatorId.current === creator._id) return;
    hydratedCreatorId.current = creator._id;
    setDisplayName(creator.displayName ?? '');
    setUsername(creator.username ?? '');
    setBio(creator.bio ?? '');
    setAvatarUrl(creator.avatarUrl ?? '');
    setBannerUrl(creator.bannerUrl ?? '');
    setDiscordServerId(creator.discordServerId ?? '');
    setDiscordRoleId(creator.discordRoleId ?? '');
  }, [creator]);

  const handleSave = async () => {
    if (!creator || saving) return;
    setSaving(true);
    try {
      await updateSettings({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        discordServerId: discordServerId.trim() || null,
        discordRoleId: discordRoleId.trim() || null,
      });
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const validateImageFile = (file: File): boolean => {
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('File must be under 5MB');
      return false;
    }
    return true;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !creator) return;
    if (!validateImageFile(file)) return;
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadToConvexStorage(convex, file, 'creator-avatar');
      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded — save to publish');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !creator) return;
    if (!validateImageFile(file)) return;
    setUploadingBanner(true);
    try {
      const publicUrl = await uploadToConvexStorage(convex, file, 'creator-banner');
      setBannerUrl(publicUrl);
      toast.success('Banner uploaded — save to publish');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (creator === undefined) {
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
          <h1 className="text-heading font-bold text-foreground">Settings</h1>
          <p className="text-support text-muted-foreground mt-0.5">
            Manage your profile, account, and billing
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-ui font-semibold text-foreground mb-2">No creator profile yet</h3>
          <p className="text-support text-muted-foreground max-w-xs mx-auto mb-5">
            Finish onboarding to manage your public profile and integrations.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const busy = saving || uploadingAvatar || uploadingBanner;
  const usernameLocked = Boolean(creator.username?.trim());
  const profileSparse =
    !creator.displayName?.trim() && !creator.bio?.trim() && !creator.avatarUrl?.trim();
  const showSave = tab === 'profile' || tab === 'integrations';
  const accountName = me?.fullName || me?.name || '—';
  const accountEmail = me?.email || '—';
  const stripeConnected = Boolean(creator.stripeAccountId?.trim());

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Settings</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Manage your public profile, account, payouts, and billing
        </p>
      </header>

      {profileSparse ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="text-support">
            Your public profile looks empty — add a display name, bio, or photo on the Profile tab
            when you&apos;re ready. Nothing is saved until you click Save.
          </p>
        </div>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as SettingsTab)}
        className="space-y-5"
      >
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-auto min-h-11 w-max flex-nowrap">
            {SETTINGS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="shrink-0">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* —— Profile —— */}
        <TabsContent value="profile" className="mt-0 space-y-5">
          <div className={cardClass}>
            <h2 className="text-ui font-semibold text-foreground">Profile information</h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                    {displayName?.[0] ?? '?'}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <span className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md border border-border bg-background text-ui text-foreground hover:bg-muted/50 transition-colors">
                    {uploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploadingAvatar ? 'Uploading…' : 'Upload photo'}
                  </span>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void handleAvatarUpload(e)}
                  disabled={uploadingAvatar || saving}
                />
                <p className="text-support text-muted-foreground mt-1.5">
                  JPG, PNG, or WebP. Max 5MB.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-support text-muted-foreground">Banner image</Label>
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                disabled={uploadingBanner || saving}
                className="relative w-full h-36 rounded-xl border border-dashed border-border bg-muted/30 hover:border-primary/40 transition-colors overflow-hidden flex items-center justify-center disabled:opacity-60"
              >
                {bannerUrl ? (
                  <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center px-4">
                    {uploadingBanner ? (
                      <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-support text-muted-foreground">
                      {uploadingBanner ? 'Uploading…' : 'Upload banner (1200×400 recommended)'}
                    </p>
                  </div>
                )}
                {bannerUrl && !uploadingBanner && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-foreground" />
                  </div>
                )}
              </button>
              <input
                ref={bannerRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handleBannerUpload(e)}
              />
              <p className="text-support text-muted-foreground">JPG, PNG, or WebP. Max 5MB.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display-name" className="text-support text-muted-foreground">
                  Display name
                </Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 min-h-11 text-ui"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-support text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 min-h-11 text-ui"
                  placeholder="username"
                  disabled={usernameLocked}
                />
                <p className="text-support text-muted-foreground">
                  {usernameLocked
                    ? "Username can't be changed here — it keeps your public URL stable."
                    : 'Choose a username for your public profile URL.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="bio" className="text-support text-muted-foreground">
                  Bio
                </Label>
                <span className="text-support text-muted-foreground tabular-nums">
                  {bio.length}/{BIO_MAX}
                </span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                className="min-h-[6rem] resize-none text-ui"
                rows={3}
                placeholder="Tell subscribers about yourself..."
                maxLength={BIO_MAX}
              />
            </div>
          </div>
        </TabsContent>

        {/* —— Account —— */}
        <TabsContent value="account" className="mt-0 space-y-5">
          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-ui font-semibold text-foreground">Account</h2>
                <p className="text-support text-muted-foreground mt-0.5">
                  Sign-in details for this Prizelet account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-support text-muted-foreground">Name</Label>
                <Input value={accountName} className="h-11 min-h-11 text-ui" disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-support text-muted-foreground">Email</Label>
                <Input value={accountEmail} className="h-11 min-h-11 text-ui" disabled />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-ui font-medium text-foreground">Password</p>
                  <p className="text-support text-muted-foreground">
                    Change your password via your auth provider.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() =>
                  toast.message('Change password', {
                    description: 'Use your sign-in provider or account recovery email to update your password.',
                  })
                }
              >
                Change password
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h2 className="text-ui font-semibold text-foreground">Danger zone</h2>
                <p className="text-support text-muted-foreground mt-0.5">
                  These actions are not available yet — they only show a confirmation toast.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-destructive hover:text-destructive"
                onClick={() =>
                  toast.message('Deactivate account', {
                    description: 'Account deactivation is not enabled in this preview.',
                  })
                }
              >
                Deactivate account
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-destructive hover:text-destructive"
                onClick={() =>
                  toast.message('Delete account', {
                    description: 'Account deletion is not enabled in this preview.',
                  })
                }
              >
                Delete account
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* —— Payouts —— */}
        <TabsContent value="payouts" className="mt-0 space-y-5">
          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-ui font-semibold text-foreground">Payouts</h2>
                <p className="text-support text-muted-foreground mt-0.5">
                  Manage bank payouts and Stripe Connect from the Payouts page.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <Banknote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-ui font-medium text-foreground">Stripe Connect</p>
                  <p className="text-support text-muted-foreground">
                    {stripeConnected
                      ? `Connected · ${creator.stripeAccountId}`
                      : 'Not connected yet — finish setup on Payouts.'}
                  </p>
                </div>
              </div>
              <span
                className={
                  stripeConnected
                    ? 'inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-caption font-medium text-emerald-600 dark:text-emerald-400'
                    : 'inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-caption font-medium text-muted-foreground'
                }
              >
                {stripeConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            <Button asChild variant="hero" className="min-h-11 w-full sm:w-auto">
              <Link to="/creator/payouts">Open Payouts</Link>
            </Button>
          </div>
        </TabsContent>

        {/* —— Notifications —— */}
        <TabsContent value="notifications" className="mt-0 space-y-5">
          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-ui font-semibold text-foreground">Notifications</h2>
                <p className="text-support text-muted-foreground mt-0.5">
                  Preferences stay on this device until creator notification flags ship.
                </p>
              </div>
            </div>

            {(
              [
                {
                  id: 'new-subs',
                  label: 'New subscribers',
                  description: 'When someone subscribes to your channel',
                  checked: notifNewSubs,
                  onChange: setNotifNewSubs,
                },
                {
                  id: 'payments',
                  label: 'Payments & payouts',
                  description: 'Successful charges and payout status updates',
                  checked: notifPayments,
                  onChange: setNotifPayments,
                },
                {
                  id: 'picks',
                  label: 'Pick reminders',
                  description: 'Nudge when scheduled picks go live',
                  checked: notifPicks,
                  onChange: setNotifPicks,
                },
                {
                  id: 'marketing',
                  label: 'Product updates',
                  description: 'Occasional tips and Prizelet product news',
                  checked: notifMarketing,
                  onChange: setNotifMarketing,
                },
              ] as const
            ).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-ui font-medium text-foreground">{row.label}</p>
                  <p className="text-support text-muted-foreground">{row.description}</p>
                </div>
                <Switch
                  checked={row.checked}
                  onCheckedChange={row.onChange}
                  aria-label={row.label}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* —— Security —— */}
        <TabsContent value="security" className="mt-0 space-y-5">
          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-ui font-semibold text-foreground">Security</h2>
                <p className="text-support text-muted-foreground mt-0.5">
                  Extra protection for your creator account.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-ui font-medium text-foreground">Two-factor authentication</p>
                  <p className="text-support text-muted-foreground">
                    Add a second step when signing in.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() =>
                  toast.message('Enable 2FA', {
                    description: 'Two-factor authentication setup is coming soon.',
                  })
                }
              >
                Enable
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="min-w-0">
                <p className="text-ui font-medium text-foreground">Active sessions</p>
                <p className="text-support text-muted-foreground">
                  Review devices signed into your account.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() =>
                  toast.message('View sessions', {
                    description: 'Session management is not available in this preview.',
                  })
                }
              >
                View
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* —— Integrations —— */}
        <TabsContent value="integrations" className="mt-0 space-y-5">
          <div className={cardClass}>
            <h2 className="text-ui font-semibold text-foreground">Integrations</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-ui font-semibold text-foreground">Discord subscriber roles</p>
                  <p className="text-support text-muted-foreground mt-0.5">
                    When a member signs in with Discord and subscribes, the bot assigns this role.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discord-guild" className="text-support text-muted-foreground">
                    Server (guild) ID
                  </Label>
                  <Input
                    id="discord-guild"
                    className="h-11 min-h-11 font-mono text-ui"
                    value={discordServerId}
                    onChange={(e) => setDiscordServerId(e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord-role" className="text-support text-muted-foreground">
                    Role ID
                  </Label>
                  <Input
                    id="discord-role"
                    className="h-11 min-h-11 font-mono text-ui"
                    value={discordRoleId}
                    onChange={(e) => setDiscordRoleId(e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>
              </div>
              <p className="text-support text-muted-foreground">
                Requires platform env <span className="font-mono">DISCORD_BOT_TOKEN</span> and the bot
                invited with Manage Roles. Clearing both fields and saving removes Discord
                assignment.
              </p>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-border">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-ui font-semibold text-foreground">X / Twitter</p>
                <p className="text-support text-muted-foreground mt-0.5">
                  Sign-in with X is available at login. There is no separate connect control on this
                  page.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* —— Billing —— */}
        <TabsContent value="billing" className="mt-0 space-y-5">
          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-ui font-semibold text-foreground">Billing</h2>
                <p className="text-support text-muted-foreground mt-0.5">
                  Your Prizelet creator plan and invoices.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-ui font-semibold text-foreground">Pro Plan</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-caption font-medium text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <p className="text-support text-muted-foreground mt-1">
                  Full creator tools, payouts, and subscriber messaging.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() =>
                  toast.message('Manage plan', {
                    description: 'Plan management is not wired up in this preview.',
                  })
                }
              >
                Manage plan
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showSave ? (
        <div className="flex justify-end sticky bottom-0 py-3 -mx-1 px-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border sm:border-0 sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0 mt-5">
          <Button
            type="button"
            variant="hero"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => void handleSave()}
            disabled={busy}
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default CreatorSettings;
