import { useEffect, useState } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadToConvexStorage } from '@/lib/upload';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const CreatorSettings = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const updateSettings = useMutation(api.creators.queries.updateSettings);
  const convex = useConvex();

  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!creator) return;
    setDisplayName(creator.displayName ?? '');
    setUsername(creator.username ?? '');
    setBio(creator.bio ?? '');
    setAvatarUrl(creator.avatarUrl ?? '');
  }, [creator]);

  const handleSave = async () => {
    if (!creator) return;
    setSaving(true);
    try {
      await updateSettings({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !creator) return;
    try {
      const publicUrl = await uploadToConvexStorage(convex, file);
      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded');
    } catch {
      toast.error('Upload failed');
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
                  <Upload className="h-3.5 w-3.5" /> Upload Photo
                </div>
              </Label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, max 2MB</p>
            </div>
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
        <Button variant="hero" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Changes
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default CreatorSettings;
