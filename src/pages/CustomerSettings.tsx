import { useEffect, useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Bell, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

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

function normalizePrefs(raw: unknown): Prefs {
  if (!raw || typeof raw !== 'object') return defaultPrefs;
  const p = raw as Partial<Prefs>;
  return {
    new_posts: p.new_posts ?? defaultPrefs.new_posts,
    price_changes: p.price_changes ?? defaultPrefs.price_changes,
    promotions: p.promotions ?? defaultPrefs.promotions,
  };
}

const CustomerSettings = () => {
  const { user } = useAuth();
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const updateProfile = useMutation(api.users.queries.updateProfile);
  const changePasswordAction = useAction(api.users.queries.changePassword);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loading = user ? me === undefined : false;

  useEffect(() => {
    if (loading || initialized) return;
    if (me) {
      setFullName(me.fullName ?? '');
      setUsername(me.username ?? '');
      setEmail(me.email ?? user?.email ?? '');
      setPrefs(normalizePrefs(me.notificationPrefs));
      setInitialized(true);
      return;
    }
    if (!user) {
      setInitialized(true);
      return;
    }
    if (me === null) {
      setEmail(user.email ?? '');
      setInitialized(true);
    }
  }, [me, user, loading, initialized]);

  const saveProfile = async () => {
    if (!me) return;
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        username: username.trim() || undefined,
      });
      toast.success('Profile updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your profile';
      toast.error(message.includes('duplicate') ? 'That username is already taken' : 'Could not save your profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePrefs = async (key: keyof Prefs, value: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (!me) return;
    try {
      await updateProfile({ notificationPrefs: next });
    } catch {
      setPrefs(previous);
      toast.error('Could not save preference');
    }
  };

  const changePassword = async () => {
    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await changePasswordAction({ currentPassword, newPassword: password });
      setPassword('');
      setCurrentPassword('');
      toast.success('Password updated — please sign in again');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
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
              <Button size="sm" className="w-fit mt-1" onClick={saveProfile} disabled={savingProfile || !me}>
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
                <label htmlFor="currentPassword" className="text-xs text-muted-foreground mb-1 block">Current Password</label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
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
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={changePassword}
                disabled={savingPassword || !password || !currentPassword}
              >
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
