import { useEffect, useRef, useState } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadToConvexStorage } from '@/lib/upload';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, ImageIcon, Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CreatorSettings = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const convex = useConvex();
  const bannerRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  useEffect(() => {
    if (!creator) return;
    setDisplayName(creator.displayName ?? '');
    setUsername(creator.username ?? '');
    setBio(creator.bio ?? '');
    setAvatarUrl(creator.avatarUrl ?? '');
    setBannerUrl(creator.bannerUrl ?? '');
  }, [creator]);

  const handleSave = async () => {
    if (!creator) return;
    setSaving(true);
    try {
      await updateSettings({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
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
      const publicUrl = await uploadToConvexStorage(convex, file);
      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded');
    } catch {
      toast.error('Upload failed');
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
      const publicUrl = await uploadToConvexStorage(convex, file);
      setBannerUrl(publicUrl);
      toast.success('Banner uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (creator === undefined) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <p className="text-muted-foreground text-sm">Creator profile not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="creator">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your profile and account</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {displayName?.[0] ?? '?'}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
                </div>
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG. Max 5MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Banner Image</Label>
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="relative w-full h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center disabled:opacity-60"
            >
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center px-4">
                  {uploadingBanner ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-1 animate-spin" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  )}
                  <p className="text-xs text-muted-foreground">
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
              onChange={handleBannerUpload}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG. Max 5MB.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1" placeholder="Your name" />
            </div>
            <div>
              <Label className="text-xs">Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} className="mt-1" placeholder="username" disabled />
            </div>
          </div>

          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} className="mt-1 resize-none" rows={3} placeholder="Tell subscribers about yourself..." />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4">Integrations</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#5865F2]/10 flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-[#5865F2]" />
              </div>
              <div>
                <p className="text-sm font-medium">Discord</p>
                <p className="text-xs text-muted-foreground">Auto-assign roles to subscribers</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled title="Not available yet">Not available</Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-foreground/10 flex items-center justify-center">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">X / Twitter</p>
                <p className="text-xs text-muted-foreground">Link your X account for cross-promotion</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled title="Not available yet">Not available</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="hero" onClick={handleSave} disabled={saving || uploadingAvatar || uploadingBanner}>
          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Changes
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default CreatorSettings;
