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
import { Camera, ImageIcon, Loader2, Upload, Link as LinkIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CreatorSettings = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const convex = useConvex();
  const bannerRef = useRef<HTMLInputElement>(null);
  const hydratedCreatorId = useRef<string | null>(null);

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
            Manage your profile and account
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
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

  return (
    <DashboardLayout type="creator">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Settings</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Manage your public profile and Discord role assignment
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6 space-y-5">
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
            <p className="text-support text-muted-foreground mt-1.5">JPG, PNG, or WebP. Max 5MB.</p>
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
              disabled
            />
            <p className="text-support text-muted-foreground">
              Username can&apos;t be changed here — it keeps your public URL stable.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-support text-muted-foreground">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[6rem] resize-none text-ui"
            rows={3}
            placeholder="Tell subscribers about yourself..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6 space-y-5">
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
            invited with Manage Roles. Clearing both fields and saving removes Discord assignment.
          </p>
        </div>

        <div className="flex items-start gap-3 pt-4 border-t border-border">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-ui font-semibold text-foreground">X / Twitter</p>
            <p className="text-support text-muted-foreground mt-0.5">
              Sign-in with X is available at login. There is no separate connect control on this page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-0 py-3 -mx-1 px-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border sm:border-0 sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0">
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
    </DashboardLayout>
  );
};

export default CreatorSettings;
