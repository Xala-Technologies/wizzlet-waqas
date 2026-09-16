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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Banknote,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  Eye,
  ImageIcon,
  Info,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Lock,
  Monitor,
  MoreVertical,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CREATOR_ADVANCED_TIPS,
  CREATOR_BILLING_DEMO,
  CREATOR_BILLING_HISTORY,
  CREATOR_BRANDING_DEMO,
  CREATOR_BRANDING_INFO,
  CREATOR_BRANDING_TIPS,
  CREATOR_INTEGRATIONS_TIPS,
  CREATOR_NOTIFICATIONS_TIPS,
  CREATOR_SECURITY_TIPS,
  CREATOR_SETTINGS_DEMO,
  CREATOR_SETTINGS_STATUS_COPY,
  CREATOR_TEAM_DEMO_MEMBERS,
  CREATOR_TEAM_ROLE_PERMISSIONS,
  shouldUseCreatorSettingsDemo,
  type DemoTeamMember,
  type TeamRole,
} from '@/lib/creatorSettingsDemo';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BIO_MAX = 500;
const BRAND_NAME_MAX = 50;

const cardClass =
  'rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]';

function brandingStorageKey(creatorId: string): string {
  return `prizelet.creator.branding.${creatorId}`;
}

type StoredBranding = {
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  font?: string;
};

function readStoredBranding(creatorId: string): StoredBranding | null {
  try {
    const raw = localStorage.getItem(brandingStorageKey(creatorId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredBranding;
  } catch {
    return null;
  }
}

function writeStoredBranding(creatorId: string, value: StoredBranding): void {
  try {
    localStorage.setItem(brandingStorageKey(creatorId), JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}


function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
}

function teamRoleLabel(role: TeamRole): string {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  if (role === 'member') return 'Member';
  return 'Viewer';
}

function teamRoleIcon(role: TeamRole) {
  if (role === 'owner') return Crown;
  if (role === 'admin') return Users;
  if (role === 'member') return User;
  return Eye;
}

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
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const hydratedCreatorId = useRef<string | null>(null);
  const demoHydrated = useRef(false);
  const brandingHydrated = useRef(false);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [discordServerId, setDiscordServerId] = useState('');
  const [discordRoleId, setDiscordRoleId] = useState('');
  const [email, setEmail] = useState('');

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState<string>(CREATOR_BRANDING_DEMO.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState<string>(
    CREATOR_BRANDING_DEMO.secondaryColor,
  );
  const [accentColor, setAccentColor] = useState<string>(CREATOR_BRANDING_DEMO.accentColor);
  const [brandFont, setBrandFont] = useState<string>(CREATOR_BRANDING_DEMO.font);

  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('Europe/Tallinn');
  const [dateFormat, setDateFormat] = useState('MMM d, yyyy');
  const [draftByDefault, setDraftByDefault] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const [notifNewSubs, setNotifNewSubs] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifPicks, setNotifPicks] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [notifEmailDigest, setNotifEmailDigest] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  const [teamMembers, setTeamMembers] = useState<DemoTeamMember[]>(CREATOR_TEAM_DEMO_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');
  const [sendingInvite, setSendingInvite] = useState(false);

  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('Estonia');
  const [billingZip, setBillingZip] = useState('');
  const [billingHydrated, setBillingHydrated] = useState(false);

  useEffect(() => {
    if (!creator) {
      hydratedCreatorId.current = null;
      brandingHydrated.current = false;
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
    setBrandName(creator.displayName ?? '');
    setLogoUrl(creator.avatarUrl ?? '');
  }, [creator]);

  useEffect(() => {
    if (!creator || brandingHydrated.current) return;
    brandingHydrated.current = true;
    const stored = readStoredBranding(creator._id);
    if (!stored) return;
    if (stored.brandName) setBrandName(stored.brandName);
    if (stored.logoUrl) setLogoUrl(stored.logoUrl);
    if (stored.faviconUrl) setFaviconUrl(stored.faviconUrl);
    if (stored.primaryColor) setPrimaryColor(stored.primaryColor);
    if (stored.secondaryColor) setSecondaryColor(stored.secondaryColor);
    if (stored.accentColor) setAccentColor(stored.accentColor);
    if (stored.font) setBrandFont(stored.font);
  }, [creator]);

  const profileSparse =
    !creator?.displayName?.trim() && !creator?.bio?.trim() && !creator?.avatarUrl?.trim();

  const useDemo = shouldUseCreatorSettingsDemo({
    profileSparse: Boolean(profileSparse),
    forceDemo,
    disableDemo,
  });

  useEffect(() => {
    if (me?.email) setEmail(me.email);
  }, [me?.email]);

  useEffect(() => {
    if (!creator || billingHydrated) return;
    setBillingHydrated(true);
    if (useDemo) {
      setBillingName(CREATOR_BILLING_DEMO.billingName);
      setBillingEmail(CREATOR_BILLING_DEMO.billingEmail);
      setBillingAddress(CREATOR_BILLING_DEMO.billingAddress);
      setBillingCity(CREATOR_BILLING_DEMO.billingCity);
      setBillingCountry(CREATOR_BILLING_DEMO.billingCountry);
      setBillingZip(CREATOR_BILLING_DEMO.billingZip);
      return;
    }
    setBillingName(displayName || me?.fullName || me?.name || '');
    setBillingEmail(me?.email || '');
  }, [creator, billingHydrated, useDemo, displayName, me?.fullName, me?.name, me?.email]);

  useEffect(() => {
    if (!useDemo || !creator || demoHydrated.current) return;
    demoHydrated.current = true;
    if (!displayName.trim()) setDisplayName(CREATOR_SETTINGS_DEMO.displayName);
    if (!bio.trim()) setBio(CREATOR_SETTINGS_DEMO.bio);
    if (!email.trim()) setEmail(CREATOR_SETTINGS_DEMO.email);
    if (!brandName.trim()) setBrandName(CREATOR_BRANDING_DEMO.brandName);
    setLanguage(CREATOR_SETTINGS_DEMO.language);
    setTimezone(CREATOR_SETTINGS_DEMO.timezone);
    setDateFormat(CREATOR_SETTINGS_DEMO.dateFormat);
    setDraftByDefault(CREATOR_SETTINGS_DEMO.draftByDefault);
    setCommentsEnabled(CREATOR_SETTINGS_DEMO.commentsEnabled);
    setPrimaryColor(CREATOR_BRANDING_DEMO.primaryColor);
    setSecondaryColor(CREATOR_BRANDING_DEMO.secondaryColor);
    setAccentColor(CREATOR_BRANDING_DEMO.accentColor);
    setBrandFont(CREATOR_BRANDING_DEMO.font);
  }, [useDemo, creator, displayName, bio, email, brandName]);

  const handleSave = async () => {
    if (!creator || saving) return;
    if (tab === 'notifications') {
      toast.success('Notification preferences saved', {
        description: 'Stored on this device until server flags ship.',
      });
      return;
    }
    if (useDemo && profileSparse) {
      toast.message('Sample preview — settings not saved', {
        description: 'Fill in your real profile or add ?demo=0 to save live settings.',
      });
      return;
    }
    setSaving(true);
    try {
      const nextDisplayName =
        tab === 'branding' ? brandName.trim() || displayName.trim() : displayName.trim();
      const nextAvatar =
        tab === 'branding' ? logoUrl.trim() || avatarUrl.trim() : avatarUrl.trim();
      await updateSettings({
        displayName: nextDisplayName || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: nextAvatar || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        discordServerId: discordServerId.trim() || null,
        discordRoleId: discordRoleId.trim() || null,
      });
      writeStoredBranding(creator._id, {
        brandName: brandName.trim() || nextDisplayName,
        logoUrl: logoUrl.trim() || nextAvatar,
        faviconUrl: faviconUrl.trim() || undefined,
        primaryColor,
        secondaryColor,
        accentColor,
        font: brandFont,
      });
      if (tab === 'branding' && nextDisplayName) setDisplayName(nextDisplayName);
      if (tab === 'branding' && nextAvatar) setAvatarUrl(nextAvatar);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadingLogo(true);
    try {
      const publicUrl = await uploadToConvexStorage(convex, file, 'creator-avatar');
      setLogoUrl(publicUrl);
      toast.success('Logo uploaded — save to publish');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadingFavicon(true);
    try {
      const publicUrl = await uploadToConvexStorage(convex, file, 'creator-favicon');
      setFaviconUrl(publicUrl);
      toast.success('Favicon uploaded — save to publish');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingFavicon(false);
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

  const removeLogo = () => {
    if (useDemo && profileSparse) {
      toast.message('Sample preview — logo not removed');
      return;
    }
    setLogoUrl('');
    toast.message('Logo removed — save to publish');
  };

  const removeFavicon = () => {
    if (useDemo && profileSparse) {
      toast.message('Sample preview — favicon not removed');
      return;
    }
    setFaviconUrl('');
    toast.message('Favicon removed — save to publish');
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

  const busy =
    saving || uploadingAvatar || uploadingBanner || uploadingLogo || uploadingFavicon;
  const usernameLocked = Boolean(creator.username?.trim());
  const showSave =
    tab === 'general' || tab === 'branding' || tab === 'integrations' || tab === 'notifications';
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <section className={cn(cardClass, 'space-y-5 xl:col-span-8')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Branding
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize your brand appearance across your page, emails, and share links.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <Label className="mb-3 block">Logo</Label>
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-extrabold text-white">
                          {(brandName || displayName || 'AP').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        ref={logoRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => void handleLogoUpload(e)}
                        disabled={uploadingLogo || saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-10 w-full rounded-xl gap-2"
                        onClick={() => logoRef.current?.click()}
                        disabled={uploadingLogo || saving}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload logo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 w-full rounded-xl text-muted-foreground"
                        onClick={removeLogo}
                        disabled={!logoUrl || saving}
                      >
                        Remove
                      </Button>
                      <p className="text-[11px] text-muted-foreground">
                        Square PNG or JPG. Recommended 512×512px.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <Label className="mb-3 block">Favicon</Label>
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {faviconUrl || logoUrl ? (
                        <img
                          src={faviconUrl || logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-extrabold text-white">
                          {(brandName || displayName || 'AP').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        ref={faviconRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/x-icon"
                        className="hidden"
                        onChange={(e) => void handleFaviconUpload(e)}
                        disabled={uploadingFavicon || saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-10 w-full rounded-xl gap-2"
                        onClick={() => faviconRef.current?.click()}
                        disabled={uploadingFavicon || saving}
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload favicon
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 w-full rounded-xl text-muted-foreground"
                        onClick={removeFavicon}
                        disabled={!faviconUrl || saving}
                      >
                        Remove
                      </Button>
                      <p className="text-[11px] text-muted-foreground">
                        Square icon. Recommended 32×32px.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="brand-name">Brand name</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {brandName.length}/{BRAND_NAME_MAX}
                  </span>
                </div>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value.slice(0, BRAND_NAME_MAX))}
                  className="min-h-11 rounded-xl"
                  placeholder="Your brand"
                  maxLength={BRAND_NAME_MAX}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(
                  [
                    {
                      id: 'primary',
                      label: 'Primary color',
                      value: primaryColor,
                      onChange: setPrimaryColor,
                    },
                    {
                      id: 'secondary',
                      label: 'Secondary color',
                      value: secondaryColor,
                      onChange: setSecondaryColor,
                    },
                    {
                      id: 'accent',
                      label: 'Accent color',
                      value: accentColor,
                      onChange: setAccentColor,
                    },
                  ] as const
                ).map((swatch) => (
                  <div key={swatch.id} className="space-y-2">
                    <Label htmlFor={`color-${swatch.id}`}>{swatch.label}</Label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5">
                      <input
                        id={`color-${swatch.id}`}
                        type="color"
                        value={swatch.value}
                        onChange={(e) => swatch.onChange(e.target.value.toUpperCase())}
                        className="h-9 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
                        aria-label={swatch.label}
                      />
                      <Input
                        value={swatch.value}
                        onChange={(e) => {
                          const next = e.target.value.toUpperCase();
                          if (/^#[0-9A-F]{0,6}$/i.test(next)) swatch.onChange(next);
                        }}
                        className="h-9 min-h-9 border-0 bg-transparent px-1 font-mono text-sm shadow-none focus-visible:ring-0"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Font (optional)</Label>
                <Select value={brandFont} onValueChange={setBrandFont}>
                  <SelectTrigger className="min-h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter (Default)</SelectItem>
                    <SelectItem value="system">System UI</SelectItem>
                    <SelectItem value="serif">Georgia (Serif)</SelectItem>
                    <SelectItem value="mono">JetBrains Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 border-t border-border pt-5">
                <Label>Page banner</Label>
                <button
                  type="button"
                  onClick={() => bannerRef.current?.click()}
                  disabled={uploadingBanner || saving}
                  className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 disabled:opacity-60"
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

            <aside className="flex flex-col gap-4 xl:col-span-4">
              <section className={cn(cardClass, 'space-y-3 overflow-hidden p-0')}>
                <div className="border-b border-border px-5 py-4">
                  <h2 className="text-base font-extrabold tracking-tight text-foreground">
                    Preview
                  </h2>
                </div>
                <div className="px-5 pb-5">
                  <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                    <div
                      className="flex items-center gap-3 px-4 py-4"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-extrabold text-white">
                            {(brandName || displayName || 'AP').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {brandName || displayName || 'Your brand'}
                        </p>
                        <p className="truncate text-[11px] text-white/70">
                          @{username || 'creator'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 bg-card p-4">
                      <p className="text-sm text-muted-foreground">
                        {bio.trim() || CREATOR_BRANDING_DEMO.previewBio}
                      </p>
                      <Button
                        type="button"
                        className="min-h-10 w-full rounded-xl font-bold text-white hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() =>
                          toast.message('Preview only', {
                            description: 'Subscribe is disabled in branding preview.',
                          })
                        }
                      >
                        Subscribe
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accentColor }}
                          aria-hidden
                        />
                        Accent · {accentColor}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                  <h2 className="text-base font-extrabold tracking-tight text-foreground">
                    Branding Tips
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {CREATOR_BRANDING_TIPS.map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>
      ) : null}

      {tab === 'team' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className={cn(cardClass, 'overflow-hidden p-0 xl:col-span-8')}>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Team Members
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Member</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="w-12 px-5 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {(useDemo
                    ? teamMembers
                    : [
                        {
                          id: 'you',
                          name: displayName || me?.fullName || me?.name || 'You',
                          email: me?.email || '—',
                          role: 'owner' as TeamRole,
                          status: 'active' as const,
                          joinedLabel: '—',
                          isYou: true,
                          avatarTone:
                            'bg-violet-500/15 text-violet-700 dark:text-violet-400',
                        },
                      ]
                  ).map((member) => {
                    return (
                      <tr key={member.id} className="border-b border-border/70 last:border-0">
                        <td className="px-5 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                member.avatarTone,
                              )}
                            >
                              {teamInitials(member.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-foreground">
                                {member.name}
                                {member.isYou ? (
                                  <span className="ml-1.5 text-xs font-semibold text-muted-foreground">
                                    (You)
                                  </span>
                                ) : null}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          {member.role === 'owner' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-400">
                              <Crown className="h-3 w-3" aria-hidden />
                              Owner
                            </span>
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(v) => {
                                const next = v as TeamRole;
                                if (useDemo) {
                                  setTeamMembers((rows) =>
                                    rows.map((r) =>
                                      r.id === member.id ? { ...r, role: next } : r,
                                    ),
                                  );
                                  toast.message('Sample preview — role updated locally');
                                  return;
                                }
                                toast.message('Role change', {
                                  description: 'Team roles are not wired to the backend yet.',
                                });
                              }}
                            >
                              <SelectTrigger className="h-9 w-[7.5rem] rounded-lg text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                          {member.joinedLabel}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {member.role === 'owner' ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  aria-label={`Actions for ${member.name}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.message(useDemo ? 'Sample preview' : 'Resend invite', {
                                      description: member.email,
                                    })
                                  }
                                >
                                  Resend invite
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (useDemo) {
                                      setTeamMembers((rows) =>
                                        rows.filter((r) => r.id !== member.id),
                                      );
                                      toast.message('Sample preview — member removed locally');
                                      return;
                                    }
                                    toast.message('Remove member', {
                                      description: 'Team management is not enabled yet.',
                                    });
                                  }}
                                >
                                  Remove member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(cardClass, 'space-y-4')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Invite Team Member
              </h2>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="min-h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as TeamRole)}
                >
                  <SelectTrigger className="min-h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="min-h-11 w-full rounded-xl"
                disabled={sendingInvite}
                onClick={() => {
                  const email = inviteEmail.trim();
                  if (!email || !email.includes('@')) {
                    toast.error('Enter a valid email address');
                    return;
                  }
                  if (inviteRole === 'owner') {
                    toast.error('Owner role cannot be invited');
                    return;
                  }
                  setSendingInvite(true);
                  window.setTimeout(() => {
                    if (useDemo) {
                      const name = email.split('@')[0] || 'Invitee';
                      setTeamMembers((rows) => [
                        ...rows,
                        {
                          id: `demo-invite-${Date.now()}`,
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          email,
                          role: inviteRole,
                          status: 'active',
                          joinedLabel: 'Pending',
                          avatarTone:
                            'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                        },
                      ]);
                      setInviteEmail('');
                      toast.message('Sample preview — invite added locally', {
                        description: `${email} as ${teamRoleLabel(inviteRole)}`,
                      });
                    } else {
                      toast.message('Invite sent (preview)', {
                        description: 'Team invites are not wired to the backend yet.',
                      });
                    }
                    setSendingInvite(false);
                  }, 350);
                }}
              >
                {sendingInvite ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Send Invite
              </Button>
            </section>

            <section className={cn(cardClass, 'space-y-3')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Role Permissions
              </h2>
              <ul className="space-y-3">
                {CREATOR_TEAM_ROLE_PERMISSIONS.map((item) => {
                  const Icon = teamRoleIcon(item.role);
                  return (
                    <li key={item.role} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-400">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-foreground">
                          {item.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
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
                Learn how team roles work and what each permission covers.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl gap-2"
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Team role docs will open here soon.',
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

      {tab === 'billing' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-5')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Billing Plan
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your current plan and billing details.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold tracking-tight text-foreground">
                        {CREATOR_BILLING_DEMO.planName}
                      </p>
                      <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {CREATOR_BILLING_DEMO.planPriceLabel}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 shrink-0 rounded-xl"
                    onClick={() =>
                      toast.message('Change plan', {
                        description: 'Plan changes are not wired up in this preview.',
                      })
                    }
                  >
                    Change Plan
                  </Button>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {CREATOR_BILLING_DEMO.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg border border-border bg-background/70 px-3 py-2.5 text-xs text-muted-foreground">
                  Next billing date{' '}
                  <span className="font-semibold text-foreground">
                    {CREATOR_BILLING_DEMO.nextBillingDate}
                  </span>
                  . Your card will be charged{' '}
                  <span className="font-semibold text-foreground">
                    {CREATOR_BILLING_DEMO.planAmount}
                  </span>
                  .
                </p>
              </div>
            </section>

            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Billing Information
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your billing details and address.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billing-name">Name</Label>
                  <Input
                    id="billing-name"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-email">Email</Label>
                  <Input
                    id="billing-email"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="billing-address">Billing address</Label>
                  <Input
                    id="billing-address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="min-h-11 rounded-xl"
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-city">City</Label>
                  <Input
                    id="billing-city"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    className="min-h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={billingCountry} onValueChange={setBillingCountry}>
                    <SelectTrigger className="min-h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Estonia">Estonia</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2 sm:max-w-xs">
                  <Label htmlFor="billing-zip">Zip / Postal code</Label>
                  <Input
                    id="billing-zip"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value)}
                    className="min-h-11 rounded-xl"
                  />
                </div>
              </div>
              <Button
                type="button"
                className="min-h-11 rounded-xl"
                onClick={() =>
                  toast.message(
                    useDemo ? 'Sample preview — billing not saved' : 'Billing details saved locally',
                    {
                      description: useDemo
                        ? 'Add ?demo=0 once live billing is connected.'
                        : 'Server-side billing address sync is coming soon.',
                    },
                  )
                }
              >
                Save Changes
              </Button>
            </section>

            <section className="space-y-3 rounded-2xl border border-destructive/30 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Cancel Subscription
              </h2>
              <p className="text-sm text-muted-foreground">
                Your plan stays active until the end of the current billing period if you cancel.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() =>
                  toast.message('Cancel subscription', {
                    description: 'Subscription cancellation is not enabled in this preview.',
                  })
                }
              >
                Cancel Subscription
              </Button>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(cardClass, 'space-y-4')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Payment Method
              </h2>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3.5">
                <span className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-background text-[10px] font-extrabold tracking-wide text-sky-700 dark:text-sky-400">
                  VISA
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {CREATOR_BILLING_DEMO.paymentBrand} •••• {CREATOR_BILLING_DEMO.paymentLast4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {CREATOR_BILLING_DEMO.paymentExpiry}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl"
                onClick={() =>
                  toast.message('Update payment method', {
                    description: 'Card updates are not wired up in this preview.',
                  })
                }
              >
                Update Payment Method
              </Button>
            </section>

            <section className={cn(cardClass, 'space-y-3')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Billing History
              </h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {CREATOR_BILLING_HISTORY.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{invoice.dateLabel}</p>
                      <p className="text-xs text-muted-foreground">{invoice.amount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Paid
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        aria-label={`Download invoice ${invoice.dateLabel}`}
                        onClick={() =>
                          toast.message(
                            useDemo ? 'Sample preview — invoice' : 'Download invoice',
                            { description: invoice.dateLabel },
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl"
                onClick={() =>
                  toast.message('View all invoices', {
                    description: 'Full invoice history is coming soon.',
                  })
                }
              >
                View All Invoices
              </Button>
            </section>

            <section className={cn(cardClass, 'space-y-3')}>
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Need Help?
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Questions about billing, invoices, or your plan? Visit the Help Center.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl gap-2"
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Billing help articles will open here soon.',
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

      {tab === 'integrations' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-5')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Connected apps
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Link tools that power subscriber access, login, and payouts.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <LinkIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Discord</p>
                        <p className="text-xs text-muted-foreground">
                          Auto-assign a role when someone subscribes.
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                        discordServerId.trim() && discordRoleId.trim()
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {discordServerId.trim() && discordRoleId.trim()
                        ? 'Configured'
                        : 'Not connected'}
                    </span>
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
                  <p className="mt-3 text-xs text-muted-foreground">
                    Requires platform env{' '}
                    <span className="font-mono">DISCORD_BOT_TOKEN</span> and Manage Roles. Clear
                    both fields and save to disconnect.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">X / Twitter</p>
                      <p className="text-xs text-muted-foreground">
                        Sign-in with X is available at login. No separate connect control here.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    Via login
                  </span>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Stripe Connect</p>
                      <p className="text-xs text-muted-foreground">
                        {stripeConnected
                          ? `Connected · ${creator.stripeAccountId}`
                          : 'Connect on Payouts to receive withdrawals.'}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-xl">
                    <Link to="/creator/payouts">
                      {stripeConnected ? 'Manage' : 'Connect'}
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Integration tips
                </h2>
              </div>
              <ul className="space-y-2.5">
                {CREATOR_INTEGRATIONS_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>{tip}</span>
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
                Setup guides for Discord roles and Stripe Connect.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl gap-2"
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Integration docs will open here soon.',
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

      {tab === 'notifications' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Activity alerts
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose which creator events send you a notification.
                </p>
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
                    label: 'Direct messages',
                    description: 'New subscriber messages in your inbox',
                    checked: notifMessages,
                    onChange: setNotifMessages,
                  },
                  {
                    label: 'Pick reminders',
                    description: 'Nudge when scheduled picks go live',
                    checked: notifPicks,
                    onChange: setNotifPicks,
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

            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Email & marketing
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optional digests and product news from Prizelet.
                </p>
              </div>
              {(
                [
                  {
                    label: 'Weekly email digest',
                    description: 'A summary of earnings, subscribers, and top posts',
                    checked: notifEmailDigest,
                    onChange: setNotifEmailDigest,
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
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(cardClass, 'space-y-3')}>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Delivery
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Preferences stay on this device until creator notification flags ship to the
                server.
              </p>
              <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-xs text-muted-foreground">
                In-app · Email (when digest is on)
              </div>
            </section>
            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Notification tips
                </h2>
              </div>
              <ul className="space-y-2.5">
                {CREATOR_NOTIFICATIONS_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      ) : null}

      {tab === 'security' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Sign-in & authentication
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Protect your creator account and recovery options.
                </p>
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
                    <p className="text-xs text-muted-foreground">
                      Add a second step when signing in.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    Off
                  </span>
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
              </div>
            </section>

            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Active sessions
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Devices currently signed into your account.
                </p>
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border">
                <li className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <Monitor className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">This browser</p>
                      <p className="text-xs text-muted-foreground">Current session · just now</p>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Mobile Safari</p>
                      <p className="text-xs text-muted-foreground">
                        {useDemo ? 'Tallinn, EE · 2 days ago' : 'Session details unavailable'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-9 rounded-lg text-xs font-bold text-destructive hover:text-destructive"
                    onClick={() =>
                      toast.message('Sign out device', {
                        description: 'Remote session revoke is coming soon.',
                      })
                    }
                  >
                    Sign out
                  </Button>
                </li>
              </ul>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Security tips
                </h2>
              </div>
              <ul className="space-y-2.5">
                {CREATOR_SECURITY_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>{tip}</span>
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
                Account recovery and security best practices.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl gap-2"
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Security help will open here soon.',
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

      {tab === 'advanced' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-4')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-foreground">
                    Payout connection
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stripe Connect powers withdrawals to your bank.
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
              <p className="text-sm text-muted-foreground">
                {stripeConnected
                  ? `Account · ${creator.stripeAccountId}`
                  : 'Finish setup on Payouts when you are ready to withdraw.'}
              </p>
              <Button asChild className="min-h-11 w-full rounded-xl sm:w-auto">
                <Link to="/creator/payouts">Open Payouts</Link>
              </Button>
            </section>

            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Data & exports
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download a copy of your creator data for your records.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Export my data</p>
                    <p className="text-xs text-muted-foreground">
                      Profile, products, and earnings summary (CSV/JSON).
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 shrink-0 rounded-xl"
                  onClick={() =>
                    toast.message(useDemo ? 'Sample preview — export' : 'Export requested', {
                      description: 'Data export is not wired up in this preview.',
                    })
                  }
                >
                  Request export
                </Button>
              </div>
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
                    quickAction(
                      'Delete account',
                      'Account deletion is not enabled in this preview.',
                    )
                  }
                >
                  Delete account
                </Button>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Advanced tips
                </h2>
              </div>
              <ul className="space-y-2.5">
                {CREATOR_ADVANCED_TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>{tip}</span>
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
                Contact support before deleting or transferring your account.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-xl gap-2"
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Advanced account help will open here soon.',
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

      {showSave ? (
        <div className="sticky bottom-0 -mx-1 mt-5 border-t border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:border-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <div
            className={cn(
              'flex flex-col gap-3 sm:flex-row sm:items-center',
              tab === 'branding' ? 'sm:justify-between' : 'sm:justify-end',
            )}
          >
            {tab === 'branding' ? (
              <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3.5 py-2.5 text-sky-950 dark:text-sky-100 sm:max-w-xl">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                <p className="text-xs font-semibold leading-snug">{CREATOR_BRANDING_INFO}</p>
              </div>
            ) : null}
            <Button
              type="button"
              className="min-h-11 w-full shrink-0 rounded-xl sm:w-auto"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default CreatorSettings;
