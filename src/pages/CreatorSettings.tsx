import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadToConvexStorage } from '@/lib/upload';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SettingsSubnav, useSettingsTab } from '@/components/creator/SettingsSubnav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Banknote,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Download,
  ExternalLink,
  ImageIcon,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Lock,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CREATOR_SETTINGS_DEMO,
  CREATOR_SETTINGS_STATUS_COPY,
  shouldUseCreatorSettingsDemo,
} from '@/lib/creatorSettingsDemo';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BIO_MAX = 500;

const cardClass =
  'rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]';

const CreatorSettings = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const tab = useSettingsTab();

  const creator = useQuery(api.creators.queries.myCreator);
  const me = useQuery(api.users.queries.me);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const convex = useConvex();
  const bannerRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const hydratedCreatorId = useRef<string | null>(null);
  const demoHydrated = useRef(false);

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
  const [email, setEmail] = useState('');

  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('Europe/Tallinn');
  const [dateFormat, setDateFormat] = useState('MMM d, yyyy');
  const [draftByDefault, setDraftByDefault] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const [notifNewSubs, setNotifNewSubs] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifPicks, setNotifPicks] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

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

  useEffect(() => {
    if (me?.email) setEmail(me.email);
  }, [me?.email]);

  const profileSparse =
    !creator?.displayName?.trim() && !creator?.bio?.trim() && !creator?.avatarUrl?.trim();

  const useDemo = shouldUseCreatorSettingsDemo({
    profileSparse: Boolean(profileSparse),
    forceDemo,
    disableDemo,
  });

  useEffect(() => {
    if (!useDemo || !creator || demoHydrated.current) return;
    demoHydrated.current = true;
    if (!displayName.trim()) setDisplayName(CREATOR_SETTINGS_DEMO.displayName);
    if (!bio.trim()) setBio(CREATOR_SETTINGS_DEMO.bio);
    if (!email.trim()) setEmail(CREATOR_SETTINGS_DEMO.email);
    setLanguage(CREATOR_SETTINGS_DEMO.language);
    setTimezone(CREATOR_SETTINGS_DEMO.timezone);
    setDateFormat(CREATOR_SETTINGS_DEMO.dateFormat);
    setDraftByDefault(CREATOR_SETTINGS_DEMO.draftByDefault);
    setCommentsEnabled(CREATOR_SETTINGS_DEMO.commentsEnabled);
  }, [useDemo, creator, displayName, bio, email]);

  const handleSave = async () => {
    if (!creator || saving) return;
    if (useDemo && profileSparse) {
      toast.message('Sample preview — settings not saved', {
        description: 'Fill in your real profile or add ?demo=0 to save live settings.',
      });
      return;
    }
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
    if (useDemo && profileSparse) {
      toast.message('Sample preview — upload disabled', {
        description: 'Add real profile content or ?demo=0 to upload photos.',
      });
      return;
    }
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
    if (useDemo && profileSparse) {
      toast.message('Sample preview — upload disabled', {
        description: 'Add real profile content or ?demo=0 to upload photos.',
      });
      return;
    }
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

  const removeAvatar = () => {
    if (useDemo && profileSparse) {
      toast.message('Sample preview — photo not removed');
      return;
    }
    setAvatarUrl('');
    toast.message('Photo removed — save to publish');
  };

  if (creator === undefined || me === undefined) {
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
          <p className="mt-1.5 text-support text-muted-foreground">
            Manage your account settings, brand, team, and preferences.
          </p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <Settings className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
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
  const showSave = tab === 'general' || tab === 'branding' || tab === 'integrations';
  const stripeConnected = Boolean(creator.stripeAccountId?.trim());
  const liveEmail = me?.email || email;

  const quickAction = (label: string, description: string) => {
    toast.message(label, { description });
  };

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
          Settings
        </h1>
        <p className="mt-1.5 text-support text-muted-foreground">
          Manage your account settings, brand, team, and preferences.
        </p>
      </header>

      <SettingsSubnav active={tab} />

      {useDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample preview data — profile fields are mock content for design review. Add{' '}
            <span className="font-mono text-xs">?demo=0</span> to see empty real states.
          </p>
        </div>
      ) : null}

      {tab === 'general' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-5')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Account Information
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="min-h-11 rounded-xl"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      value={liveEmail}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-h-11 rounded-xl"
                      disabled={!useDemo}
                      title={
                        useDemo
                          ? undefined
                          : 'Email is managed by your sign-in provider'
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {bio.length}/{BIO_MAX}
                      </span>
                    </div>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                      className="min-h-[6.5rem] resize-none rounded-xl"
                      rows={3}
                      placeholder="Tell subscribers about yourself..."
                      maxLength={BIO_MAX}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="min-h-11 rounded-xl"
                      placeholder="username"
                      disabled={usernameLocked}
                    />
                    <p className="text-xs text-muted-foreground">
                      {usernameLocked
                        ? "Username can't be changed here — it keeps your public URL stable."
                        : 'Choose a username for your public profile URL.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 lg:w-44">
                  <div className="h-28 w-28 overflow-hidden rounded-full border border-border bg-muted">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                        {displayName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                  <input
                    ref={avatarRef}
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => void handleAvatarUpload(e)}
                    disabled={uploadingAvatar || saving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full rounded-xl gap-2"
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploadingAvatar || saving}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload new photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-10 w-full rounded-xl text-muted-foreground"
                    onClick={removeAvatar}
                    disabled={!avatarUrl || saving}
                  >
                    Remove photo
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </section>

            <section className={cn(cardClass, 'space-y-4')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Preferences
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="min-h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="et-EE">Estonian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="min-h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Tallinn">(GMT+02:00) Tallinn, Estonia</SelectItem>
                      <SelectItem value="America/New_York">(GMT-05:00) New York</SelectItem>
                      <SelectItem value="America/Los_Angeles">(GMT-08:00) Los Angeles</SelectItem>
                      <SelectItem value="UTC">(GMT+00:00) UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="min-h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MMM d, yyyy">Jan 31, 2025</SelectItem>
                      <SelectItem value="dd/MM/yyyy">31/01/2025</SelectItem>
                      <SelectItem value="yyyy-MM-dd">2025-01-31</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className={cn(cardClass, 'space-y-3')}>
              <h2 className="mb-1 text-base font-extrabold tracking-tight text-foreground">
                Content Preferences
              </h2>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Post new content as draft by default
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your posts will be saved as drafts until you publish them.
                  </p>
                </div>
                <Switch
                  checked={draftByDefault}
                  onCheckedChange={setDraftByDefault}
                  aria-label="Post new content as draft by default"
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Enable comments on posts</p>
                  <p className="text-xs text-muted-foreground">
                    Allow subscribers to comment on your published content.
                  </p>
                </div>
                <Switch
                  checked={commentsEnabled}
                  onCheckedChange={setCommentsEnabled}
                  aria-label="Enable comments on posts"
                />
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(cardClass, 'space-y-3')}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Account Status
                </h2>
                <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{CREATOR_SETTINGS_STATUS_COPY}</p>
              <ul className="space-y-2.5">
                {CREATOR_SETTINGS_DEMO.statusChecks.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className={cn(cardClass, 'p-0')}>
              <h2 className="border-b border-border px-5 py-4 text-base font-extrabold tracking-tight text-foreground">
                Quick Actions
              </h2>
              <ul className="divide-y divide-border">
                {(
                  [
                    {
                      label: 'Change password',
                      icon: Lock,
                      danger: false,
                      onClick: () =>
                        quickAction(
                          'Change password',
                          'Use your sign-in provider or account recovery email.',
                        ),
                    },
                    {
                      label: 'Enable two-factor authentication',
                      icon: Shield,
                      danger: false,
                      onClick: () =>
                        quickAction('Enable 2FA', 'Two-factor authentication setup is coming soon.'),
                    },
                    {
                      label: 'Manage connected accounts',
                      icon: RefreshCw,
                      danger: false,
                      onClick: () =>
                        quickAction(
                          'Connected accounts',
                          'Manage social connections from Integrations.',
                        ),
                    },
                    {
                      label: 'Download my data',
                      icon: Download,
                      danger: false,
                      onClick: () =>
                        quickAction('Download data', 'Data export is not available in this preview.'),
                    },
                    {
                      label: 'Close account',
                      icon: Trash2,
                      danger: true,
                      onClick: () =>
                        quickAction(
                          'Close account',
                          'Account closure is not enabled in this preview.',
                        ),
                    },
                  ] as const
                ).map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={item.onClick}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold transition-colors hover:bg-muted/40',
                        item.danger
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-foreground',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className={cn(cardClass, 'space-y-3')}>
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Need Help?
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Visit our Help Center for support or contact our team.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl gap-2"
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Help articles will open here soon.',
                  })
                }
              >
                View Help Center
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </section>
          </aside>
        </div>
      ) : null}

      {tab === 'branding' ? (
        <section className={cn(cardClass, 'space-y-5')}>
          <h2 className="text-base font-extrabold tracking-tight text-foreground">Branding</h2>
          <p className="text-sm text-muted-foreground">
            Banner and profile imagery shown on your public page.
          </p>
          <div className="space-y-2">
            <Label>Banner image</Label>
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner || saving}
              className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 disabled:opacity-60"
            >
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="px-4 text-center">
                  {uploadingBanner ? (
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <ImageIcon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uploadingBanner ? 'Uploading…' : 'Upload banner (1200×400 recommended)'}
                  </p>
                </div>
              )}
              {bannerUrl && !uploadingBanner ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity hover:opacity-100">
                  <Camera className="h-5 w-5 text-foreground" />
                </div>
              ) : null}
            </button>
            <input
              ref={bannerRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleBannerUpload(e)}
            />
          </div>
        </section>
      ) : null}

      {tab === 'team' ? (
        <section className={cn(cardClass, 'space-y-4')}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Team</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Invite managers and editors to help run your channel. Team seats are coming soon.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-xl"
            onClick={() =>
              toast.message('Invite teammate', {
                description: 'Team invites are not available in this preview.',
              })
            }
          >
            Invite teammate
          </Button>
        </section>
      ) : null}

      {tab === 'billing' ? (
        <section className={cn(cardClass, 'space-y-5')}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Billing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your Prizelet creator plan and invoices.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-foreground">Pro Plan</p>
                <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Full creator tools, payouts, and subscriber messaging.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 rounded-xl"
              onClick={() =>
                toast.message('Manage plan', {
                  description: 'Plan management is not wired up in this preview.',
                })
              }
            >
              Manage plan
            </Button>
          </div>
          <Button asChild variant="outline" className="min-h-11 rounded-xl gap-2">
            <Link to="/creator/payouts">
              <Wallet className="h-4 w-4" /> Open Payouts
            </Link>
          </Button>
        </section>
      ) : null}

      {tab === 'integrations' ? (
        <section className={cn(cardClass, 'space-y-5')}>
          <h2 className="text-base font-extrabold tracking-tight text-foreground">Integrations</h2>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <p className="text-sm font-bold text-foreground">Discord subscriber roles</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  When a member signs in with Discord and subscribes, the bot assigns this role.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discord-guild">Server (guild) ID</Label>
                  <Input
                    id="discord-guild"
                    className="min-h-11 rounded-xl font-mono"
                    value={discordServerId}
                    onChange={(e) => setDiscordServerId(e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord-role">Role ID</Label>
                  <Input
                    id="discord-role"
                    className="min-h-11 rounded-xl font-mono"
                    value={discordRoleId}
                    onChange={(e) => setDiscordRoleId(e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'notifications' ? (
        <section className={cn(cardClass, 'space-y-4')}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Preferences stay on this device until creator notification flags ship.
              </p>
            </div>
          </div>
          {(
            [
              {
                label: 'New subscribers',
                description: 'When someone subscribes to your channel',
                checked: notifNewSubs,
                onChange: setNotifNewSubs,
              },
              {
                label: 'Payments & payouts',
                description: 'Successful charges and payout status updates',
                checked: notifPayments,
                onChange: setNotifPayments,
              },
              {
                label: 'Pick reminders',
                description: 'Nudge when scheduled picks go live',
                checked: notifPicks,
                onChange: setNotifPicks,
              },
              {
                label: 'Product updates',
                description: 'Occasional tips and Prizelet product news',
                checked: notifMarketing,
                onChange: setNotifMarketing,
              },
            ] as const
          ).map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                checked={row.checked}
                onCheckedChange={row.onChange}
                aria-label={row.label}
              />
            </div>
          ))}
        </section>
      ) : null}

      {tab === 'security' ? (
        <section className={cn(cardClass, 'space-y-4')}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Security</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Extra protection for your creator account.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">
                  Change your password via your auth provider.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 rounded-xl"
              onClick={() =>
                quickAction(
                  'Change password',
                  'Use your sign-in provider or account recovery email.',
                )
              }
            >
              Change password
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Add a second step when signing in.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 rounded-xl"
              onClick={() =>
                quickAction('Enable 2FA', 'Two-factor authentication setup is coming soon.')
              }
            >
              Enable
            </Button>
          </div>
        </section>
      ) : null}

      {tab === 'advanced' ? (
        <div className="space-y-4">
          <section className={cn(cardClass, 'space-y-4')}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Payout connection
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stripeConnected
                    ? `Stripe Connect · ${creator.stripeAccountId}`
                    : 'Not connected yet — finish setup on Payouts.'}
                </p>
              </div>
              <span
                className={
                  stripeConnected
                    ? 'inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400'
                    : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground'
                }
              >
                {stripeConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <Button asChild className="min-h-11 rounded-xl">
              <Link to="/creator/payouts">Open Payouts</Link>
            </Button>
          </section>

          <section className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Danger zone
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  These actions are not available yet — they only show a confirmation toast.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl text-destructive hover:text-destructive"
                onClick={() =>
                  quickAction(
                    'Deactivate account',
                    'Account deactivation is not enabled in this preview.',
                  )
                }
              >
                Deactivate account
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl text-destructive hover:text-destructive"
                onClick={() =>
                  quickAction('Delete account', 'Account deletion is not enabled in this preview.')
                }
              >
                Delete account
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {showSave ? (
        <div className="sticky bottom-0 -mx-1 mt-5 border-t border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:border-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <div className="flex justify-end">
            <Button
              type="button"
              className="min-h-11 w-full rounded-xl sm:w-auto"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default CreatorSettings;
