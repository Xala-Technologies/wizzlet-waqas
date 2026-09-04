import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const CreatorSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userData) { setLoading(false); return; }
      const { data: creator } = await supabase.from('creators').select('*').eq('user_id', userData.id).maybeSingle();
      if (!creator) { setLoading(false); return; }
      setCreatorId(creator.id);
      setDisplayName(creator.display_name ?? '');
      setUsername(creator.username ?? '');
      setBio(creator.bio ?? '');
      setAvatarUrl(creator.avatar_url ?? '');
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!creatorId) return;
    setSaving(true);
    const { error } = await supabase.from('creators').update({
      display_name: displayName.trim() || null,
      username: username.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    }).eq('id', creatorId);

    if (error) toast.error(error.message);
    else toast.success('Settings saved');
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !creatorId) return;
    const ext = file.name.split('.').pop();
    const path = `${creatorId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(publicUrl);
    toast.success('Avatar uploaded');
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
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your profile and account</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-medium mb-4">Profile Information</h2>
        <div className="space-y-4">
          {/* Avatar */}
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
              <Input value={username} onChange={e => setUsername(e.target.value)} className="mt-1" placeholder="username" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} className="mt-1 resize-none" rows={3} placeholder="Tell subscribers about yourself..." />
          </div>
        </div>
      </div>

      {/* Integrations */}
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
