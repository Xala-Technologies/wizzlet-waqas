import { useEffect, useRef, useState } from 'react';
import { useConvex, useMutation } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { Loader2, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { useDialogFocusReturn } from '@/hooks/useDialogFocusReturn';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type SessionList = NonNullable<FunctionReturnType<typeof api.accountSessions.listMine>>;
type Session = SessionList['sessions'][number];
type LoadState = { state: 'loading' } | { state: 'error' } | { state: 'expired' } | { state: 'ready'; data: SessionList };

const dateLabel = (value: number) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });

export function SessionManagementCard({ demo = false, className }: { demo?: boolean; className?: string }) {
  const convex = useConvex();
  const revoke = useMutation(api.accountSessions.revoke);
  const revokeAll = useMutation(api.accountSessions.revokeAll);
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const focus = useDialogFocusReturn();
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<LoadState>({ state: 'loading' });
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState<Session | 'all' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const returnToList = useRef(false);

  useEffect(() => {
    if (confirm) { cancelButton.current?.focus(); returnToList.current = true; }
    else if (returnToList.current && load.state === 'ready') {
      refreshButton.current?.focus(); returnToList.current = false;
    }
  }, [confirm, load.state]);

  useEffect(() => {
    if (!open || demo) return;
    let active = true;
    setLoad({ state: 'loading' });
    if (!userId) { setLoad({ state: 'expired' }); return; }
    // Fetch on opening/refresh, with an explicit retry path. A missing endpoint
    // during rollout must not throw through the entire settings page.
    void convex.query(api.accountSessions.listMine, {}).then(data => {
      if (active) setLoad(data ? { state: 'ready', data } : { state: 'expired' });
    }).catch(() => { if (active) setLoad({ state: 'error' }); });
    return () => { active = false; };
  }, [open, demo, userId, convex, revision]);

  const changeOpen = (next: boolean) => {
    if (busy) return;
    setOpen(next); setConfirm(null); setError(null);
    if (next) setLoad({ state: 'loading' });
  };
  const finishSignOut = async () => {
    // Server revocation is already committed, even if SDK cleanup is offline.
    await signOut().catch(() => undefined);
    navigate('/login', { replace: true });
  };
  const submit = async () => {
    if (busy || !confirm || demo) return;
    setBusy(true); setError(null);
    try {
      if (confirm === 'all') {
        await revokeAll({});
        toast.success('Signed out everywhere. Please sign in again.');
        await finishSignOut();
      } else {
        const result = await revoke({ sessionId: confirm.id });
        toast.success('Session signed out');
        if (result.currentSessionRevoked) await finishSignOut();
        else { setConfirm(null); setRevision(n => n + 1); }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('SESSION_NOT_FOUND')) {
        setConfirm(null); setRevision(n => n + 1);
        toast.message('That session has already ended. The list has been refreshed.');
      } else setError('Could not sign out the session. Please try again.');
    } finally { setBusy(false); }
  };

  return <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
        <Monitor className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">Active Sessions</p>
        <p className="text-xs text-muted-foreground">Review your sign-ins and sign out any you do not recognize.</p>
      </div>
    </div>
    <Button type="button" variant="outline" size="sm" className="shrink-0"
      onClick={event => { focus.rememberOpener(event.currentTarget); changeOpen(true); }}>View Sessions</Button>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={focus.restoreFocus}
        onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>{confirm ? confirm === 'all' ? 'Sign out everywhere?' : 'Sign out this session?' : 'Active sessions'}</DialogTitle>
          <DialogDescription>{confirm === 'all'
            ? 'This ends all existing sign-ins, including this one. You will need to sign in again.'
            : confirm ? `The sign-in started ${dateLabel(confirm.createdAt)} will lose access. Your current session will stay signed in.`
            : 'These are your active sign-ins. Times are shown in your local time zone.'}</DialogDescription>
        </DialogHeader>
        {demo ? <p className="text-sm text-muted-foreground">Sample preview — sign-in management needs a live account.</p>
          : confirm ? <div className="space-y-4">
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button ref={cancelButton} type="button" variant="outline" disabled={busy} onClick={() => { setConfirm(null); setError(null); }}>Cancel</Button>
              <Button type="button" variant="destructive" disabled={busy} onClick={() => void submit()}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                {confirm === 'all' ? 'Sign out everywhere' : 'Sign out session'}
              </Button>
            </div>
            {busy && <p role="status" className="text-sm text-muted-foreground">Signing out…</p>}
          </div> : load.state === 'loading' ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading sessions…</p>
            : load.state === 'error' ? <div className="space-y-3"><p role="alert">Could not load sessions.</p><Button variant="outline" onClick={() => setRevision(n => n + 1)}>Try again</Button></div>
              : load.state === 'expired' ? <p role="status">Your session is no longer available. Please sign in again.</p>
                : <div className="space-y-4">
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {load.data.sessions.map((session, index) => <li key={session.id} className="space-y-2 p-4" aria-label={session.isCurrent ? 'Current session' : `Other session ${index}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{session.isCurrent ? 'Current session' : 'Other session'}</p>
                        {session.isCurrent && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">This sign-in</span>}
                      </div>
                      <p className="text-sm">Signed in <time dateTime={new Date(session.createdAt).toISOString()}>{dateLabel(session.createdAt)}</time></p>
                      <p className="text-xs text-muted-foreground">Expires <time dateTime={new Date(session.expiresAt).toISOString()}>{dateLabel(session.expiresAt)}</time></p>
                      {!session.isCurrent && <Button type="button" variant="outline" size="sm" onClick={() => { setError(null); setConfirm(session); }}>Sign out</Button>}
                    </li>)}
                  </ul>
                  {load.data.hasMore && <p className="text-sm text-muted-foreground">Showing the most recent 100 sign-ins and your current session. Sign out everywhere ends all existing sign-ins, including those not shown.</p>}
                  {load.data.sessions.length === 0 && <p>No active sessions to display.</p>}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button ref={refreshButton} type="button" variant="outline" onClick={() => setRevision(n => n + 1)}>Refresh sessions</Button>
                    <Button type="button" variant="destructive" onClick={() => { setError(null); setConfirm('all'); }}>Sign out everywhere</Button>
                  </div>
                </div>}
      </DialogContent>
    </Dialog>
  </div>;
}
