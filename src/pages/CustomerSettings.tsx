import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import {
  BarChart3,
  Bell,
  CreditCard,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import { openCustomerPortal } from '@/lib/stripe';
import { cn } from '@/lib/utils';

type NotifPrefs = {
  new_posts: boolean;
  price_changes: boolean;
  promotions: boolean;
  messages?: boolean;
  billing?: boolean;
};

function readPrefs(raw: unknown): {
  newPicks: boolean;
  messages: boolean;
  billing: boolean;
} {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<NotifPrefs>;
  return {
    newPicks: p.new_posts !== false,
    messages: p.messages !== false,
    billing: p.billing !== false && p.price_changes !== false,
  };
}

const CustomerSettings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get('demo') === '1';
  const disableDemo = searchParams.get('demo') === '0';

  const me = useQuery(api.users.queries.me, user ? {} : 'skip');
  const hasPasswordAccount = useQuery(api.users.queries.hasPasswordAccount, user ? {} : 'skip');
  const updateProfile = useMutation(api.users.queries.updateProfile);
  const changePasswordAction = useAction(api.users.queries.changePassword);
  const requestEmailChange = useMutation(api.accountRequests.requestEmailChange);
  const requestAccountDeletion = useMutation(api.accountRequests.requestAccountDeletion);
  const myAccountRequests = useQuery(api.accountRequests.listMine, user ? {} : 'skip');
  const hydratedUserId = useRef<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedEmail, setRequestedEmail] = useState('');
  const [emailRequestReason, setEmailRequestReason] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [savingEmailRequest, setSavingEmailRequest] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newPicks, setNewPicks] = useState(true);
  const [messagesOn, setMessagesOn] = useState(true);
  const [billingOn, setBillingOn] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  const loading =
    user
      ? me === undefined || myAccountRequests === undefined || hasPasswordAccount === undefined
      : false;

  const useDemo = forceDemo && !disableDemo;

  useEffect(() => {
    hydratedUserId.current = null;
  }, [useDemo]);

  useEffect(() => {
    if (!user) {
      hydratedUserId.current = null;
      return;
    }
    if (me === undefined) return;

    const id = me?._id ?? `auth:${user.id}`;
    if (hydratedUserId.current === id) return;
    hydratedUserId.current = id;

    if (useDemo) {
      setFullName('James Carter');
      setEmail('james.carter@email.com');
      setPhone('+47 412 34 567');
      setNewPicks(true);
      setMessagesOn(true);
      setBillingOn(true);
      return;
    }

    if (me) {
      setFullName(me.fullName ?? me.name ?? '');
      setEmail(me.email ?? user.email ?? '');
      setPhone(me.phone ?? '');
      const prefs = readPrefs(me.notificationPrefs);
      setNewPicks(prefs.newPicks);
      setMessagesOn(prefs.messages);
      setBillingOn(prefs.billing);
      return;
    }
    setEmail(user.email ?? '');
  }, [me, user, useDemo]);

  const openEmailRequest = useMemo(
    () => myAccountRequests?.find((r) => r.category === 'email_change' && r.status === 'open'),
    [myAccountRequests],
  );
  const openDeletionRequest = useMemo(
    () => myAccountRequests?.find((r) => r.category === 'account_deletion' && r.status === 'open'),
    [myAccountRequests],
  );

  const saveProfile = async () => {
    if (!me || savingProfile) return;
    if (useDemo && forceDemo) {
      toast.message('Sample preview — save after signing in with a real profile.');
      setEditing(false);
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Could not save your profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotif = async (next: { newPicks: boolean; messages: boolean; billing: boolean }) => {
    setNewPicks(next.newPicks);
    setMessagesOn(next.messages);
    setBillingOn(next.billing);
    if (!me || useDemo) {
      if (useDemo) toast.message('Sample preview — preferences sync on a live account.');
      return;
    }
    setSavingNotif(true);
    try {
      await updateProfile({
        notificationPrefs: {
          new_posts: next.newPicks,
          messages: next.messages,
          billing: next.billing,
          price_changes: next.billing,
          promotions: false,
        },
      });
    } catch {
      toast.error('Could not update notifications');
    } finally {
      setSavingNotif(false);
    }
  };

  const submitEmailRequest = async () => {
    if (savingEmailRequest || !requestedEmail.trim()) return;
    if (useDemo) {
      toast.message('Sample preview — email change needs a live account.');
      return;
    }
    setSavingEmailRequest(true);
    try {
      await requestEmailChange({
        requestedEmail: requestedEmail.trim(),
        reason: emailRequestReason.trim() || undefined,
      });
      toast.success('Email change request submitted. Support will follow up.');
      setRequestedEmail('');
      setEmailRequestReason('');
      setEmailDialogOpen(false);
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
      setPasswordDialogOpen(false);
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

  const managePayment = async () => {
    if (portalLoading) return;
    if (useDemo) {
      toast.message('Sample preview — open billing after a real subscription.');
      return;
    }
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deleting) return;
    if (useDemo) {
      toast.message('Sample preview — deletion requests need a live account.');
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    try {
      await requestAccountDeletion({ reason: 'Member requested account deletion from Settings' });
      toast.success('Deletion request submitted. Support will follow up.');
      setDeleteOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('REQUEST_ALREADY_OPEN')) {
        toast.error('You already have an open deletion request');
      } else {
        toast.error('Could not submit deletion request');
      }
    } finally {
      setDeleting(false);
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

  const displayEmail = email || user?.email || '';
  const displayPhone = phone;

  return (
    <DashboardLayout type="member">
      <Seo
        title="Settings — Prizelet"
        description="Manage your account and preferences on Prizelet."
      />

      <header className="mb-6">
        <h1 className="text-heading font-bold tracking-tight text-slate-900 md:text-heading-lg">
          Settings
        </h1>
        <p className="mt-1.5 text-support text-slate-500">
          Manage your account and preferences.
        </p>
      </header>

      {useDemo ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-amber-950 dark:text-amber-100 sm:items-center sm:px-5">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:mt-0"
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Sample Settings layout for design review. Add{' '}
            <code className="rounded bg-amber-500/20 px-1">?demo=0</code> for live account fields
            only.
          </p>
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl space-y-5">
        {/* Account */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Account</h2>
                <p className="text-sm text-slate-500">Update your personal information.</p>
              </div>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl"
                  disabled={savingProfile}
                  onClick={() => void saveProfile()}
                >
                  {savingProfile ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="fullName" className="text-xs font-semibold text-slate-500">
                Full Name
              </label>
              <Input
                id="fullName"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editing}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-500">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
                value={displayEmail}
                disabled
              />
              {editing ? (
                <div className="pt-1">
                  {openEmailRequest ? (
                    <p className="text-xs text-slate-500">
                      Open email-change request
                      {openEmailRequest.requestedEmail
                        ? `: ${openEmailRequest.requestedEmail}`
                        : ''}
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setEmailDialogOpen(true)}
                    >
                      Request email change
                    </button>
                  )}
                </div>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="phone" className="text-xs font-semibold text-slate-500">
                Phone Number
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  🇳🇴
                </span>
                <Input
                  id="phone"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm"
                  value={displayPhone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+47 412 34 567"
                  disabled={!editing}
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="passwordMask" className="text-xs font-semibold text-slate-500">
                Password
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="passwordMask"
                  type="password"
                  className="h-11 flex-1 rounded-xl border-slate-200 bg-slate-50 text-sm"
                  value="••••••••••••"
                  disabled
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 rounded-xl border-slate-200"
                  onClick={() => {
                    if (!hasPasswordAccount && !useDemo) {
                      toast.message('This account signs in with a provider — no password to change.');
                      return;
                    }
                    setPasswordDialogOpen(true);
                  }}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>

          {me?.discordId ? (
            <p className="mt-4 text-xs text-slate-500">
              Discord connected as{' '}
              <span className="font-semibold text-slate-700">
                {me.discordUsername ?? me.discordId}
              </span>
            </p>
          ) : null}
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10">
              <Bell className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              <p className="text-sm text-slate-500">Choose what you want to be notified about.</p>
            </div>
          </div>

          <ul className={cn('divide-y divide-slate-100', savingNotif && 'opacity-70')}>
            {(
              [
                {
                  key: 'newPicks' as const,
                  icon: BarChart3,
                  title: 'New picks from my creators',
                  desc: 'Get notified when your creators post new picks.',
                  checked: newPicks,
                },
                {
                  key: 'messages' as const,
                  icon: MessageSquare,
                  title: 'Messages',
                  desc: 'Get notified about new messages.',
                  checked: messagesOn,
                },
                {
                  key: 'billing' as const,
                  icon: CreditCard,
                  title: 'Subscription & billing updates',
                  desc: 'Get notified about renewals, payments and important account updates.',
                  checked: billingOn,
                },
              ] as const
            ).map((row) => (
              <li key={row.key} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <row.icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">{row.desc}</p>
                </div>
                <Switch
                  checked={row.checked}
                  onCheckedChange={(v) => {
                    void saveNotif({
                      newPicks: row.key === 'newPicks' ? v : newPicks,
                      messages: row.key === 'messages' ? v : messagesOn,
                      billing: row.key === 'billing' ? v : billingOn,
                    });
                  }}
                  aria-label={row.title}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                <CreditCard className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
                <p className="text-sm text-slate-500">
                  Manage your payment method for subscriptions.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-xl border-slate-200"
              disabled={portalLoading}
              onClick={() => void managePayment()}
            >
              {portalLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Manage Payment Method
            </Button>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex h-12 w-[72px] items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-blue-800 text-xs font-bold tracking-wide text-white shadow-sm">
              VISA
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {useDemo ? 'Visa •••• 4242' : 'Card on file via Stripe'}
              </p>
              <p className="text-xs font-medium text-slate-500">
                {useDemo ? 'Expires 04/28' : 'Open the portal to view or update your method'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Card details are stored securely with Stripe. Use Manage Payment Method to update them.
          </p>
        </section>

        {/* Privacy */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Privacy & Account</h2>
                <p className="text-sm text-slate-500">
                  Manage your privacy or delete your account.
                </p>
                {openDeletionRequest ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Deletion request is open — support will follow up.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                asChild
              >
                <Link to="/support">Privacy Policy</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                disabled={!!openDeletionRequest}
                onClick={() => setDeleteOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request email change</DialogTitle>
            <DialogDescription>
              Sign-in email cannot be changed in-app. Support will fulfill this manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="email"
              className="h-11 rounded-xl"
              placeholder="New email address"
              value={requestedEmail}
              onChange={(e) => setRequestedEmail(e.target.value)}
            />
            <Input
              className="h-11 rounded-xl"
              placeholder="Reason (optional)"
              value={emailRequestReason}
              onChange={(e) => setEmailRequestReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingEmailRequest || !requestedEmail.trim()}
              onClick={() => void submitEmailRequest()}
            >
              {savingEmailRequest ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              After a successful update you may need to sign in again.
            </DialogDescription>
          </DialogHeader>
          {!hasPasswordAccount && !useDemo ? (
            <p className="text-sm text-slate-500">
              This account signs in with Discord or another provider, so there is no Prizelet
              password to change.
            </p>
          ) : (
            <form
              className="space-y-3 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                void changePassword();
              }}
            >
              <Input
                type="password"
                className="h-11 rounded-xl"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <Input
                type="password"
                className="h-11 rounded-xl"
                placeholder="New password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <Input
                type="password"
                className="h-11 rounded-xl"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Update password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This submits a deletion request to support. Active subscriptions should be cancelled
              first. This cannot be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep account</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Request deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CustomerSettings;
