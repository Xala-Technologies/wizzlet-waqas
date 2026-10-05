import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadToConvexStorage } from '@/lib/upload';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { clayCard } from '@/lib/overviewClay';
import { SettingsSubnav, useSettingsTab } from '@/components/creator/SettingsSubnav';
import {
  PaymentFeeDetailSheet,
  PaymentFeeStack,
} from '@/components/creator/PaymentFeeDetailSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Crown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Info,
  LifeBuoy,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  Monitor,
  MoreVertical,
  RefreshCw,
  Settings,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CREATOR_ADVANCED_TIPS,
  CREATOR_BILLING_DEMO,
  CREATOR_BILLING_PAYMENTS,
  CREATOR_BRANDING_DEMO,
  CREATOR_BRANDING_INFO,
  CREATOR_BRANDING_TIPS,
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
import {
  moneyExact,
  paymentTypeLabel,
  splitAtPercent,
  type PaymentFeeDetail,
} from '@/lib/paymentFeeDetail';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BIO_MAX = 500;
const BRAND_NAME_MAX = 50;

const cardClass = cn(clayCard, 'p-5 sm:p-6');

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
  if (role === 'admin') return UserCog;
  if (role === 'member') return User;
  return Eye;
}

const softPrimaryBtn =
  'min-h-11 rounded-xl border-0 bg-violet-500/10 text-violet-800 hover:bg-violet-500/15 dark:text-violet-200';

const CreatorSettings = () => {
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';
  const tab = useSettingsTab();

  const creator = useQuery(api.creators.queries.myCreator);
  const me = useQuery(api.users.queries.me);
  const earnings = useQuery(api.creators.earnings.myEarnings);
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

  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [notifNewSubs, setNotifNewSubs] = useState(true);
  const [notifNewSales, setNotifNewSales] = useState(true);
  const [notifPayouts, setNotifPayouts] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifProductActivity, setNotifProductActivity] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifFrequency, setNotifFrequency] = useState('realtime');

  const [teamMembers, setTeamMembers] = useState<DemoTeamMember[]>(CREATOR_TEAM_DEMO_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [discordExpanded, setDiscordExpanded] = useState(false);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(true);
  const [billingPayment, setBillingPayment] = useState<PaymentFeeDetail | null>(null);

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

  const feePolicy = earnings?.feePolicy ?? {
    introFeePercent: CREATOR_BILLING_DEMO.introFeePercent,
    standardFeePercent: CREATOR_BILLING_DEMO.standardFeePercent,
    introFeeDays: CREATOR_BILLING_DEMO.introFeeDays,
    currentFeePercent: CREATOR_BILLING_DEMO.standardFeePercent,
    introDaysLeft: 0,
  };
  const exampleSplit = splitAtPercent(
    CREATOR_BILLING_DEMO.exampleGrossCents,
    feePolicy.currentFeePercent,
  );
  const billingPayments: PaymentFeeDetail[] = useDemo
    ? CREATOR_BILLING_PAYMENTS.map((p) => ({
        id: p.id,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        status: p.status,
        dateMs: p.dateMs,
        paymentRef: p.paymentRef,
        productName: p.productName,
        typeLabel: p.typeLabel,
        amountCents: p.amountCents,
        platformFeeCents: p.platformFeeCents,
        creatorEarningsCents: p.creatorEarningsCents,
        feePercentage: p.feePercentage,
      }))
    : (earnings?.recentPayments ?? []).map((p) => ({
        id: p.id,
        customerName: p.label.replace(/^Subscription\s*—\s*/i, '') || 'Subscriber',
        customerEmail: p.customerEmail,
        status: p.status,
        dateMs: p.createdAt,
        paymentRef: p.paymentRef,
        productName: p.productName ?? 'Product',
        typeLabel: paymentTypeLabel(p.type),
        amountCents: p.amountCents,
        platformFeeCents: p.platformFeeCents,
        creatorEarningsCents: p.creatorEarningsCents,
        feePercentage: p.feePercentage,
      }));

  useEffect(() => {
    if (me?.email) setEmail(me.email);
  }, [me?.email]);

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

  if (tab === 'integrations') {
    return <Navigate to="/creator/integrations" replace />;
  }

  if (creator === undefined || me === undefined) {
    return (
      <DashboardLayout type="creator" mainClassName="bg-clay-page">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator" mainClassName="bg-clay-page">
        <header className="mb-4">
        </header>
        <div className={cn(clayCard, 'p-10 text-center')}>
          <Settings className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-ui font-semibold text-foreground">No creator profile yet</h3>
          <p className="mx-auto mb-5 max-w-xs text-support text-muted-foreground">
            Finish onboarding to manage your public profile and integrations.
          </p>
          <Button asChild size="sm">
            <Link to="/creator/onboarding">Set up your profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const busy =
    saving || uploadingAvatar || uploadingBanner || uploadingLogo || uploadingFavicon;
  const usernameLocked = Boolean(creator.username?.trim());
  const showSave = tab === 'general' || tab === 'branding';
  const liveEmail = me?.email || email;

  const quickAction = (label: string, description: string) => {
    toast.message(label, { description });
  };

  return (
    <DashboardLayout type="creator" mainClassName="bg-clay-page">
      <header className="mb-4">
      </header>

      <SettingsSubnav active={tab} />

      {useDemo ? (
        <div className="clay-card mb-6 flex items-start gap-3 bg-[#fbf8f3] px-4 py-3.5 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100 sm:items-center sm:px-5">
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
                    size="sm"
                    className="w-full gap-2"
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
                    size="sm"
                    className="w-full text-muted-foreground"
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
                size="sm"
                    className="w-full gap-2"
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
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => void handleLogoUpload(e)}
                        disabled={uploadingLogo || saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
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
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Recommended: 512 × 512 px PNG, JPG or SVG. Max size 2MB.
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
                        accept="image/jpeg,image/png,image/gif,image/webp,image/x-icon,.ico"
                        className="hidden"
                        onChange={(e) => void handleFaviconUpload(e)}
                        disabled={uploadingFavicon || saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
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
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Recommended: 32 × 32 px PNG or ICO. Max size 1MB.
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
                    <label
                      htmlFor={`color-${swatch.id}`}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-2"
                    >
                      <span
                        className="h-7 w-7 shrink-0 rounded-md border border-border"
                        style={{ backgroundColor: swatch.value }}
                        aria-hidden
                      />
                      <input
                        id={`color-${swatch.id}`}
                        type="color"
                        value={swatch.value}
                        onChange={(e) => swatch.onChange(e.target.value.toUpperCase())}
                        className="sr-only"
                        aria-label={swatch.label}
                      />
                      <Input
                        value={swatch.value}
                        onChange={(e) => {
                          const next = e.target.value.toUpperCase();
                          if (/^#[0-9A-F]{0,6}$/i.test(next)) swatch.onChange(next);
                        }}
                        className="h-8 min-h-8 flex-1 border-0 bg-transparent px-1 font-mono text-sm shadow-none focus-visible:ring-0"
                        maxLength={7}
                      />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Font</Label>
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
                <p className="text-[11px] text-muted-foreground">
                  This font will be used across your page and emails.
                </p>
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
                        size="sm"
                        className="w-full font-bold text-white hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() =>
                          toast.message('Preview only', {
                            description: 'Subscribe is disabled in branding preview.',
                          })
                        }
                      >
                        Subscribe
                      </Button>
                      <div className="flex items-center justify-center gap-3 pt-1 text-muted-foreground">
                        <Share2 className="h-4 w-4" aria-hidden />
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accentColor }}
                          aria-hidden
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">
                          Share
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={cn(clayCard, 'border-violet-500/20 bg-violet-500/5 p-5')}>
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
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
              <p className="mt-1 text-sm text-muted-foreground">
                Invite team members and manage their access to your Prizelet account.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Member</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="w-20 px-5 py-3 text-right">Actions</th>
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
                              <span className="flex flex-wrap items-center gap-1.5 font-bold text-foreground">
                                <span className="truncate">{member.name}</span>
                                {member.isYou ? (
                                  <span className="inline-flex rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400">
                                    You
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
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Invite Team Member
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a new team member to your account.
                </p>
              </div>
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
                size="sm"
                className="w-full"
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
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Role Permissions
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage what team members can access.
                </p>
              </div>
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
                Visit the Help Center for more information about team roles and permissions.
              </p>
              <Button
                type="button"
                variant="secondary"
                className={cn(softPrimaryBtn, 'w-full gap-2')}
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
                  How you pay us
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prizelet is free for creators. There is no monthly plan. We only take a percent of
                  what customers pay, then you keep the rest.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold tracking-tight text-foreground">
                          Free for creators
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          You never subscribe to Prizelet. Fees come out of each customer payment.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold tabular-nums text-foreground">
                            {feePolicy.currentFeePercent}% now
                          </span>
                          <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {feePolicy.introDaysLeft > 0 ? 'Intro rate' : 'Standard rate'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                        </span>
                        {feePolicy.introFeePercent}% for your first {feePolicy.introFeeDays} days
                        {feePolicy.introDaysLeft > 0
                          ? ` (${feePolicy.introDaysLeft} days left)`
                          : ''}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                        </span>
                        Then {feePolicy.standardFeePercent}% on every customer payment
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                        </span>
                        Connect Stripe on Payouts (Express). Automatic transfers are not live yet — ledger payouts stay manual.
                      </li>
                    </ul>
                  </div>
                  <div className="w-full shrink-0 rounded-xl border border-border bg-background/80 p-4 lg:w-64">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Example at {feePolicy.currentFeePercent}%
                    </p>
                    <div className="mt-3">
                      <PaymentFeeStack
                        compact
                        amountCents={CREATOR_BILLING_DEMO.exampleGrossCents}
                        platformFeeCents={exampleSplit.platformFeeCents}
                        creatorEarningsCents={exampleSplit.creatorEarningsCents}
                        feePercentage={feePolicy.currentFeePercent}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="secondary" className={cn(softPrimaryBtn)}>
                    <Link to="/creator/payouts">Open Payouts</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl">
                    <Link to="/creator/transactions">See payments</Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Recent customer payments
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  When a customer pays, the Prizelet percent is taken and the rest is yours.
                </p>
              </div>
              {billingPayments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No customer payments yet. Fees only appear after a fan pays.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {billingPayments.slice(0, 8).map((payment) => (
                    <li key={payment.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-muted/30"
                        onClick={() => setBillingPayment(payment)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {payment.customerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.productName} · {moneyExact(payment.amountCents)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold tabular-nums text-foreground">
                            {moneyExact(payment.creatorEarningsCents)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Fee {moneyExact(payment.platformFeeCents)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(cardClass, 'space-y-3')}>
              <h2 className="text-base font-extrabold tracking-tight text-foreground">Payouts</h2>
              <p className="text-sm text-muted-foreground">
                Net earnings after the Prizelet percent are paid out from Payouts. Prizelet does not
                charge your card.
              </p>
              <Button asChild variant="secondary" className={cn(softPrimaryBtn, 'w-full')}>
                <Link to="/creator/payouts">Manage payouts</Link>
              </Button>
            </section>
            <section className={cn(clayCard, 'space-y-3 border-violet-500/20 bg-violet-500/5 p-5')}>
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Need Help?
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Questions about fees or payouts? Visit the Help Center or contact support.
              </p>
              <Button
                type="button"
                variant="secondary"
                className={cn(softPrimaryBtn, 'w-full gap-2')}
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
          <PaymentFeeDetailSheet
            open={Boolean(billingPayment)}
            onOpenChange={(open) => {
              if (!open) setBillingPayment(null);
            }}
            payment={billingPayment}
          />
        </div>
      ) : null}


      {tab === 'notifications' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-6')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Notifications
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose what you want to be notified about and how you want to receive
                  notifications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive updates in your email inbox.
                    </p>
                  </div>
                  <Switch
                    checked={notifEmailEnabled}
                    onCheckedChange={setNotifEmailEnabled}
                    aria-label="Email Notifications"
                  />
                </div>
                <div
                  className={cn(
                    'space-y-3 rounded-xl border border-border bg-muted/20 p-4',
                    !notifEmailEnabled && 'pointer-events-none opacity-50',
                  )}
                >
                  {(
                    [
                      {
                        id: 'subs',
                        label: 'New subscribers',
                        description: 'Get notified when someone subscribes to your content.',
                        checked: notifNewSubs,
                        onChange: setNotifNewSubs,
                        locked: false,
                      },
                      {
                        id: 'sales',
                        label: 'New sales',
                        description: 'Get notified when you make a sale.',
                        checked: notifNewSales,
                        onChange: setNotifNewSales,
                        locked: false,
                      },
                      {
                        id: 'payouts',
                        label: 'Payout updates',
                        description: 'Get notified about payouts and payment status.',
                        checked: notifPayouts,
                        onChange: setNotifPayouts,
                        locked: false,
                      },
                      {
                        id: 'messages',
                        label: 'Messages',
                        description: 'Get notified when you receive a new message.',
                        checked: notifMessages,
                        onChange: setNotifMessages,
                        locked: false,
                      },
                      {
                        id: 'products',
                        label: 'Product activity',
                        description: 'Get notified about activity on your products.',
                        checked: notifProductActivity,
                        onChange: setNotifProductActivity,
                        locked: false,
                      },
                      {
                        id: 'marketing',
                        label: 'Marketing updates',
                        description:
                          'Get tips, feature updates, and marketing opportunities from Prizelet.',
                        checked: notifMarketing,
                        onChange: setNotifMarketing,
                        locked: false,
                      },
                      {
                        id: 'security',
                        label: 'Security alerts',
                        description: 'Get notified about important security events.',
                        checked: notifSecurity,
                        onChange: setNotifSecurity,
                        locked: true,
                      },
                    ] as const
                  ).map((row) => (
                    <label
                      key={row.id}
                      htmlFor={`notif-${row.id}`}
                      className="flex cursor-pointer items-start gap-3"
                    >
                      <Checkbox
                        id={`notif-${row.id}`}
                        checked={row.checked}
                        disabled={row.locked}
                        onCheckedChange={(v) => {
                          if (row.locked) return;
                          row.onChange(v === true);
                        }}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {row.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {row.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">In-app Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications inside your Prizelet dashboard.
                  </p>
                </div>
                <Switch
                  checked={notifInApp}
                  onCheckedChange={setNotifInApp}
                  aria-label="In-app Notifications"
                />
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Get push notifications on your device (browser or mobile).
                  </p>
                </div>
                <Switch
                  checked={notifPush}
                  onCheckedChange={setNotifPush}
                  aria-label="Push Notifications"
                />
              </div>

              <div className="space-y-2 border-t border-border pt-5">
                <Label>Notification Frequency</Label>
                <Select value={notifFrequency} onValueChange={setNotifFrequency}>
                  <SelectTrigger className="min-h-11 max-w-md rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time (recommended)</SelectItem>
                    <SelectItem value="hourly">Hourly digest</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how often you want to receive non-critical notifications.
                </p>
              </div>

              <Button
                type="button"
                className="h-12 gap-2 rounded-[var(--radius-md)] px-6"
                onClick={() => void handleSave()}
                disabled={busy}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                Save Changes
              </Button>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(clayCard, 'border-sky-500/20 bg-sky-500/5 p-5')}>
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Notification Tips
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
            <section className={cn(cardClass, 'space-y-3')}>
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Need Help?
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Visit the Help Center for more about notification channels and delivery.
              </p>
              <Button
                type="button"
                variant="secondary"
                className={cn(softPrimaryBtn, 'w-full gap-2')}
                onClick={() =>
                  toast.message('Help Center', {
                    description: 'Notification help articles will open here soon.',
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

      {tab === 'security' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <section className={cn(cardClass, 'space-y-4')}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Security
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep your account safe and secure.
                </p>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Password</p>
                      <p className="text-xs text-muted-foreground">
                        Update your password regularly to keep your account secure.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction(
                        'Change Password',
                        'Use your sign-in provider or account recovery email.',
                      )
                    }
                  >
                    Change Password
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Shield className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          Two-Factor Authentication (2FA)
                        </p>
                        <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add an extra layer of security to your account.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(v) => {
                        setTwoFactorEnabled(v);
                        toast.message(v ? '2FA enabled (preview)' : '2FA disabled (preview)', {
                          description: 'Two-factor setup is not fully wired yet.',
                        });
                      }}
                      aria-label="Two-factor authentication"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        quickAction('Manage 2FA', 'Two-factor authentication setup is coming soon.')
                      }
                    >
                      Manage
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Monitor className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Active Sessions</p>
                      <p className="text-xs text-muted-foreground">
                        Manage your active sessions across different devices.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setSessionsOpen((open) => !open)}
                  >
                    {sessionsOpen ? 'Hide Sessions' : 'View Sessions'}
                  </Button>
                </div>

                {sessionsOpen ? (
                  <div className="border-t border-border bg-muted/10 px-4 py-3 sm:px-5">
                    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                      <li className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <Monitor className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-foreground">This browser</p>
                            <p className="text-xs text-muted-foreground">
                              Current session · just now
                            </p>
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
                              {useDemo
                                ? 'Tallinn, EE · 2 days ago'
                                : 'Session details unavailable'}
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
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Bell className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Login Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        Get notified about new login attempts.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={loginAlertsEnabled}
                    onCheckedChange={setLoginAlertsEnabled}
                    aria-label="Login Alerts"
                  />
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Smartphone className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Trusted Devices</p>
                      <p className="text-xs text-muted-foreground">
                        Manage devices that you trust.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction('Manage Devices', 'Trusted device management is coming soon.')
                    }
                  >
                    Manage Devices
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <LifeBuoy className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Account Recovery</p>
                      <p className="text-xs text-muted-foreground">
                        Set up recovery options to regain access to your account.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction('Set Up Recovery', 'Account recovery setup is coming soon.')
                    }
                  >
                    Set Up Recovery
                  </Button>
                </div>
              </div>
            </section>

            <section className={cn(clayCard, 'space-y-3 border-destructive/30 bg-destructive/5 p-5 sm:p-6')}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-destructive">
                      Danger Zone
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot
                      be undone.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive-outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    toast.message('Delete Account', {
                      description: 'Account deletion is not enabled in this preview.',
                    })
                  }
                >
                  Delete Account
                </Button>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(clayCard, 'border-violet-500/20 bg-violet-500/5 p-5')}>
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Security Tips
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
                Visit the Help Center for security best practices and account recovery.
              </p>
              <Button
                type="button"
                variant="secondary"
                className={cn(softPrimaryBtn, 'w-full gap-2')}
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
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Advanced
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Domain, visibility, legal pages, and account data controls.
                </p>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Globe className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Custom Domain</p>
                      <p className="text-xs text-muted-foreground">
                        Connect your own domain (e.g. yourbrand.com) to your Prizelet page.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction('Connect Domain', 'Custom domains are coming soon.')
                    }
                  >
                    Connect Domain
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Eye className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Public Profile</p>
                      <p className="text-xs text-muted-foreground">
                        Make your profile public and discoverable in search engines.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={publicProfileEnabled}
                    onCheckedChange={setPublicProfileEnabled}
                    aria-label="Public Profile"
                  />
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Terms of Service</p>
                      <p className="text-xs text-muted-foreground">
                        Set your own terms of service for subscribers.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction('Edit Terms', 'Custom terms editor is coming soon.')
                    }
                  >
                    Edit Terms
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Shield className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Privacy Policy</p>
                      <p className="text-xs text-muted-foreground">Set your own privacy policy.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction('Edit Policy', 'Privacy policy editor is coming soon.')
                    }
                  >
                    Edit Policy
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Mail className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Email Templates</p>
                      <p className="text-xs text-muted-foreground">
                        Customize transactional emails (welcome, receipts, etc).
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction('Customize', 'Email template customization is coming soon.')
                    }
                  >
                    Customize
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <Download className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Data Export</p>
                      <p className="text-xs text-muted-foreground">
                        Download a copy of your data (subscribers, earnings, etc).
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      toast.message(useDemo ? 'Sample preview — export' : 'Export requested', {
                        description: 'Data export is not wired up in this preview.',
                      })
                    }
                  >
                    Export Data
                  </Button>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive-outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      quickAction(
                        'Delete Account',
                        'Account deletion is not enabled in this preview.',
                      )
                    }
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4 xl:col-span-4">
            <section className={cn(clayCard, 'border-violet-500/20 bg-violet-500/5 p-5')}>
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Advanced Settings
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
                Visit the Help Center for guides on domains, policies, and account data.
              </p>
              <Button
                type="button"
                variant="secondary"
                className={cn(softPrimaryBtn, 'w-full gap-2')}
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
              className="h-12 w-full shrink-0 gap-2 rounded-[var(--radius-md)] px-6 sm:w-auto"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default CreatorSettings;
