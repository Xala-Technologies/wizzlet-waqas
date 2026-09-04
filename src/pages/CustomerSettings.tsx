import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Bell, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Prefs {
  new_posts: boolean;
  price_changes: boolean;
  promotions: boolean;
}

const defaultPrefs: Prefs = { new_posts: true, price_changes: true, promotions: true };

const prefLabels: { key: keyof Prefs; label: string }[] = [
  { key: 'new_posts', label: 'New posts from creators' },
  { key: 'price_changes', label: 'Price changes' },
  { key: 'promotions', label: 'Promotions & deals' },
];

const CustomerSettings = () => {
  const { user } = useAuth();
  const [rowId, setRowId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, username, email, notification_prefs')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setRowId(data.id);
        setFullName(data.full_name ?? '');
        setUsername(data.username ?? '');
        setEmail(data.email ?? user.email ?? '');
        setPrefs({ ...defaultPrefs, ...((data.notification_prefs as Partial<Prefs> | null) ?? {}) });
      } else {
        setEmail(user.email ?? '');
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  const saveProfile = async () => {
    if (!rowId) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() || null, username: username.trim() || null })
      .eq('id', rowId);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'That username is already taken' : 'Could not save your profile');
      return;
    }
    toast.success('Profile updated');
  };

  const updatePrefs = async (key: keyof Prefs, value: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (!rowId) return;
    const { error } = await supabase.from('users').update({ notification_prefs: next }).eq('id', rowId);
    if (error) {
      setPrefs(previous);
      toast.error('Could not save preference');
    }
  };

  const changePassword = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword('');
    toast.success('Password updated');
  };

  return (
    <DashboardLayout type="member">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Profile</h2>
            </div>
            <div className="grid gap-3 max-w-sm">
              <div>
                <label htmlFor="displayName" className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                <Input id="displayName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="username" className="text-xs text-muted-foreground mb-1 block">Username</label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
              </div>
              <div>
                <label htmlFor="email" className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input id="email" value={email} type="email" disabled />
                <p className="text-[10px] text-muted-foreground mt-1">Contact support to change your sign-in email.</p>
              </div>
              <Button size="sm" className="w-fit mt-1" onClick={saveProfile} disabled={savingProfile || !rowId}>
                {savingProfile && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Notifications</h2>
            </div>
            <div className="space-y-3">
              {prefLabels.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(value) => updatePrefs(key, value)}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Security</h2>
            </div>
            <div className="grid gap-3 max-w-sm">
              <div>
                <label htmlFor="newPassword" className="text-xs text-muted-foreground mb-1 block">New Password</label>
                <Input
                  id="newPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <Button variant="outline" size="sm" className="w-fit" onClick={changePassword} disabled={savingPassword || !password}>
                {savingPassword && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Change Password
              </Button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerSettings;
