import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bell, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

const CustomerSettings = () => {
  const { user } = useAuth();
  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const hasPasswordAccount = useQuery(api.users.queries.hasPasswordAccount, user ? {} : 'skip');
  const updateProfile = useMutation(api.users.queries.updateProfile);
  const changePasswordAction = useAction(api.users.queries.changePassword);
  const requestEmailChange = useMutation(api.accountRequests.requestEmailChange);
  const myAccountRequests = useQuery(api.accountRequests.listMine, user ? {} : 'skip');
  const hydratedUserId = useRef<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [requestedEmail, setRequestedEmail] = useState('');
  const [emailRequestReason, setEmailRequestReason] = useState('');
  const [savingEmailRequest, setSavingEmailRequest] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loading =
    user
      ? me === undefined || myAccountRequests === undefined || hasPasswordAccount === undefined
      : false;

  // Hydrate once per user id — do not wipe dirty edits on reactive profile refreshes.
  useEffect(() => {
    if (!user) {
      hydratedUserId.current = null;
      return;
    }
    if (me === undefined) return;

    const id = me?._id ?? `auth:${user.id}`;
    if (hydratedUserId.current === id) return;
    hydratedUserId.current = id;

    if (me) {
      setFullName(me.fullName ?? '');
      setUsername(me.username ?? '');
      setEmail(me.email ?? user.email ?? '');
      return;
    }
    setEmail(user.email ?? '');
  }, [me, user]);

  const openEmailRequest = useMemo(
    () => myAccountRequests?.find((r) => r.category === 'email_change' && r.status === 'open'),
    [myAccountRequests],
  );

  const saveProfile = async () => {
    if (!me || savingProfile) return;
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

  const submitEmailRequest = async () => {
    if (savingEmailRequest || !requestedEmail.trim()) return;
    setSavingEmailRequest(true);
    try {
      await requestEmailChange({
        requestedEmail: requestedEmail.trim(),
        reason: emailRequestReason.trim() || undefined,
      });
      toast.success('Email change request submitted. Support will follow up.');
      setRequestedEmail('');
      setEmailRequestReason('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed';
      if (msg.includes('REQUEST_ALREADY_OPEN')) toast.error('You already have an open request');
      else if (msg.includes('EMAIL_UNCHANGED')) toast.error('That is already your email');
      else if (msg.includes('INVALID_EMAIL')) toast.error('Enter a valid email');
      else toast.error(msg);
    } finally {
      setSavingEmailRequest(false);
    }
  };

  const changePassword = async () => {
    if (savingPassword || !hasPasswordAccount) return;
    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (password === currentPassword) {
      toast.error('Choose a new password different from your current one');
      return;
    }
    setSavingPassword(true);
    try {
      await changePasswordAction({ currentPassword, newPassword: password });
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      toast.success('Password updated — please sign in again');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('INVALID_CURRENT_PASSWORD')) toast.error('Current password is incorrect');
      else if (msg.includes('PASSWORD_ACCOUNT_MISSING')) {
        toast.error('This account signs in with Discord or another provider — no password to change');
      } else if (msg.includes('at least 8')) toast.error('Password must be at least 8 characters');
      else toast.error('Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="member">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="member">
      <header className="mb-6">
        <h1 className="text-heading font-bold text-foreground">Settings</h1>
        <p className="text-support text-muted-foreground mt-0.5">
          Manage your account preferences
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-ui font-semibold text-foreground">Profile</h2>
          </div>
          <div className="grid gap-3 max-w-sm">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-support text-muted-foreground block">
                Display Name
              </label>
              <Input
                id="displayName"
                className="h-11 min-h-11 text-ui"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-support text-muted-foreground block">
                Username
              </label>
              <Input
                id="username"
                className="h-11 min-h-11 text-ui"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-support text-muted-foreground block">
                Sign-in email
              </label>
              <Input
                id="email"
                className="h-11 min-h-11 text-ui"
                value={email}
                type="email"
                disabled
              />
              <p className="text-support text-muted-foreground">
                Sign-in email cannot be changed in-app. Submit a request for support to fulfill
                manually.
              </p>
              {openEmailRequest ? (
                <p className="text-support text-muted-foreground mt-2">
                  You already have an open email-change request.
                  {openEmailRequest.requestedEmail
                    ? ` Requested: ${openEmailRequest.requestedEmail}`
                    : ''}
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  <Input
                    type="email"
                    className="h-11 min-h-11 text-ui"
                    placeholder="New email address"
                    value={requestedEmail}
                    onChange={(e) => setRequestedEmail(e.target.value)}
                  />
                  <Input
                    className="h-11 min-h-11 text-ui"
                    placeholder="Reason (optional)"
                    value={emailRequestReason}
                    onChange={(e) => setEmailRequestReason(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={savingEmailRequest || !requestedEmail.trim()}
                    onClick={() => void submitEmailRequest()}
                  >
                    {savingEmailRequest ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Request email change
                  </Button>
                </div>
              )}
            </div>
            <Button
              type="button"
              className="min-h-11 w-fit mt-1"
              onClick={() => void saveProfile()}
              disabled={savingProfile || !me}
            >
              {savingProfile ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-ui font-semibold text-foreground">Discord</h2>
          </div>
          {me?.discordId ? (
            <p className="text-support text-muted-foreground">
              Connected as{' '}
              <span className="font-medium text-foreground">
                {me.discordUsername ?? me.discordId}
              </span>
              . Active subscriptions can grant Discord roles when the creator has roles configured.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-support text-muted-foreground">
                To receive Discord roles, create/sign in with Discord (or continue with Discord on
                the login page) so your Discord user id is stored on this account.
              </p>
              <Button type="button" variant="outline" className="min-h-11" asChild>
                <a href="/login">Continue with Discord</a>
              </Button>
            </div>
          )}
          {me?.image || me?.username ? (
            <p className="text-support text-muted-foreground mt-3">
              Profile from social sign-in
              {me.username ? <> · @{me.username}</> : null}
              {me.image ? ' · photo synced' : null}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-ui font-semibold text-foreground">Notifications</h2>
          </div>
          <p className="text-support text-muted-foreground mb-4">
            In-app alerts for billing and platform announcements appear under Notifications. Channel
            preference controls will return when those channels are productized.
          </p>
          <Button type="button" variant="outline" className="min-h-11" asChild>
            <Link to="/dashboard/notifications">Open notifications</Link>
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-ui font-semibold text-foreground">Security</h2>
          </div>
          <p className="text-support text-muted-foreground mb-4 max-w-lg">
            Change the password for your email sign-in. After a successful update you will be signed
            out of other sessions and need to sign in again.
          </p>
          {!hasPasswordAccount ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 max-w-lg">
              <p className="text-ui font-medium text-foreground mb-1">No password on this account</p>
              <p className="text-support text-muted-foreground mb-4">
                You signed in with Discord or another provider, so there is no Prizelet password to
                change here. Keep using that provider to sign in.
              </p>
              <Button type="button" variant="outline" className="min-h-11" asChild>
                <a href="/login">Review sign-in options</a>
              </Button>
            </div>
          ) : (
            <form
              className="grid gap-4 max-w-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void changePassword();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-support text-muted-foreground block">
                  Current password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  className="h-11 min-h-11 text-ui"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-support text-muted-foreground block">
                  New password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  className="h-11 min-h-11 text-ui"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-support text-muted-foreground block">
                  Confirm new password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="h-11 min-h-11 text-ui"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <Button
                type="submit"
                className="min-h-11 w-full sm:w-auto"
                disabled={
                  savingPassword ||
                  !currentPassword ||
                  password.length < 8 ||
                  confirmPassword.length < 8
                }
              >
                {savingPassword ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default CustomerSettings;
