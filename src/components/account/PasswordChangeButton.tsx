import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import { useDialogFocusReturn } from '@/hooks/useDialogFocusReturn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Shared by member and creator settings; credentials stay only in dialog memory. */
export function PasswordChangeButton({ demo = false, className, variant = 'outline' }: {
  demo?: boolean; className?: string; variant?: 'default' | 'outline';
}) {
  const hasPasswordAccount = useQuery(api.users.queries.hasPasswordAccount, demo ? 'skip' : {});
  const changePasswordAction = useAction(api.users.queries.changePassword);
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const focus = useDialogFocusReturn();
  const clear = () => { setCurrentPassword(''); setPassword(''); setConfirmation(''); };
  const changeOpen = (value: boolean) => {
    if (saving) return;
    setOpen(value);
    if (!value) clear();
  };
  const submit = async () => {
    if (saving) return;
    if (demo) {
      toast.message('Sample preview — password changes need a live account.');
      clear(); setOpen(false); return;
    }
    if (!hasPasswordAccount) return;
    if (!currentPassword) { toast.error('Enter your current password'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmation) { toast.error('New password and confirmation do not match'); return; }
    if (password === currentPassword) { toast.error('Choose a new password different from your current one'); return; }
    setSaving(true);
    try {
      await changePasswordAction({ currentPassword, newPassword: password });
      clear(); setOpen(false);
      toast.success('Password updated — please sign in again');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('INVALID_CURRENT_PASSWORD')) toast.error('Current password is incorrect');
      else if (message.includes('PASSWORD_ACCOUNT_MISSING')) toast.error('This account signs in with Discord or another provider — no password to change');
      else if (message.includes('at least 8')) toast.error('Password must be at least 8 characters');
      else toast.error('Could not update password');
    } finally { setSaving(false); }
  };
  return <>
    <Button type="button" size="sm" variant={variant} className={className}
      disabled={!demo && hasPasswordAccount === undefined}
      onClick={event => { focus.rememberOpener(event.currentTarget); changeOpen(true); }}>
      Change Password
    </Button>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent onCloseAutoFocus={focus.restoreFocus}>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>After a successful update you may need to sign in again.</DialogDescription>
        </DialogHeader>
        {!hasPasswordAccount && !demo ? <p className="text-sm text-muted-foreground">
          This account signs in with Discord or another provider, so there is no Sweeph password to change.
        </p> : <form className="space-y-3 py-2" onSubmit={event => { event.preventDefault(); void submit(); }}>
          <Label htmlFor="current-password">Current password</Label>
          <Input id="current-password" type="password" className="h-11 rounded-xl" placeholder="Current password"
            value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" disabled={saving} required />
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" className="h-11 rounded-xl" placeholder="New password (min 8 characters)"
            value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" disabled={saving} minLength={8} required />
          <Label htmlFor="confirm-new-password">Confirm new password</Label>
          <Input id="confirm-new-password" type="password" className="h-11 rounded-xl" placeholder="Confirm new password"
            value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" disabled={saving} minLength={8} required />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => changeOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden /> : null}Update password
            </Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}
