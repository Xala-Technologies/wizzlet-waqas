import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Copy, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

function totpErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('INVALID_CODE')) return 'That code is not valid. Try the current authenticator code.';
  if (msg.includes('ALREADY_ENABLED')) return 'Authenticator app is already enabled.';
  if (msg.includes('NOT_STARTED')) return 'Start setup first, then enter a code.';
  if (msg.includes('NOT_ENABLED')) return 'Authenticator app is not enabled.';
  return msg || 'Could not update two-factor authentication.';
}

function BackupCodesPanel({
  codes,
  onDismiss,
}: {
  codes: string[];
  onDismiss: () => void;
}) {
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      toast.success('Backup codes copied');
    } catch {
      toast.error('Could not copy — save these codes manually.');
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-xs font-semibold text-foreground">
        Save these backup codes now — they are shown once.
      </p>
      <p className="text-xs text-muted-foreground">
        Each code works once if you lose your authenticator. Store them offline.
      </p>
      <ul className="grid gap-1 font-mono text-sm tracking-wider text-foreground sm:grid-cols-2">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void copyAll()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy all
        </Button>
        <Button type="button" size="sm" onClick={onDismiss}>
          I saved them
        </Button>
      </div>
    </div>
  );
}

export function TotpManageCard({
  demo,
  className,
}: {
  demo?: boolean;
  className?: string;
}) {
  const { user } = useAuth();
  const status = useQuery(api.mfa.status, user && !demo ? {} : 'skip');
  const startEnroll = useMutation(api.mfa.startEnroll);
  const confirmEnroll = useMutation(api.mfa.confirmEnroll);
  const cancelEnroll = useMutation(api.mfa.cancelEnroll);
  const disable = useMutation(api.mfa.disable);
  const regenerateBackupCodes = useMutation(api.mfa.regenerateBackupCodes);

  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'idle' | 'enroll' | 'disable' | 'regen'>('idle');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const enabled = demo ? false : Boolean(status?.totpEnabled);
  const remaining = demo ? 0 : (status?.backupCodesRemaining ?? 0);
  const loading = !demo && user && status === undefined;

  const beginEnroll = async () => {
    if (demo) {
      toast.message('Sample preview — authenticator setup needs a live account.');
      return;
    }
    setBusy(true);
    try {
      const started = await startEnroll({});
      setSecret(started.secret);
      setOtpauth(started.otpauthUrl);
      setCode('');
      setBackupCodes(null);
      setMode('enroll');
    } catch (err) {
      toast.error(totpErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const finishEnroll = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    try {
      const result = await confirmEnroll({ code });
      toast.success('Authenticator app enabled. Save your backup codes.');
      setSecret(null);
      setOtpauth(null);
      setCode('');
      setBackupCodes(result.backupCodes);
      setMode('idle');
    } catch (err) {
      toast.error(totpErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const abortEnroll = async () => {
    setBusy(true);
    try {
      if (!demo) await cancelEnroll({});
      setSecret(null);
      setOtpauth(null);
      setCode('');
      setMode('idle');
    } catch (err) {
      toast.error(totpErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const finishDisable = async () => {
    if (code.length !== 6) {
      toast.error('Enter the current 6-digit authenticator code to turn this off.');
      return;
    }
    setBusy(true);
    try {
      await disable({ code });
      toast.success('Authenticator app turned off.');
      setCode('');
      setBackupCodes(null);
      setMode('idle');
    } catch (err) {
      toast.error(totpErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const finishRegen = async () => {
    if (code.length !== 6) {
      toast.error('Enter your authenticator code to create new backup codes.');
      return;
    }
    setBusy(true);
    try {
      const result = await regenerateBackupCodes({ code });
      toast.success('New backup codes created. Old codes no longer work.');
      setCode('');
      setBackupCodes(result.backupCodes);
      setMode('idle');
    } catch (err) {
      toast.error(totpErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="totp-mfa" className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
            <Shield className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-foreground">Two-factor authentication</p>
              <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                Authenticator
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? `New sign-ins need an authenticator or backup code · ${remaining} backup code${remaining === 1 ? '' : 's'} left`
                : 'Add an authenticator app (Google Authenticator, 1Password, Authy).'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          <Switch
            checked={enabled}
            disabled={busy || loading || mode !== 'idle' || Boolean(backupCodes)}
            onCheckedChange={(on) => {
              if (on) void beginEnroll();
              else {
                setCode('');
                setMode('disable');
              }
            }}
            aria-label="Two-factor authentication"
          />
        </div>
      </div>

      {backupCodes ? (
        <BackupCodesPanel codes={backupCodes} onDismiss={() => setBackupCodes(null)} />
      ) : null}

      {mode === 'enroll' && secret ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            Add this account in your authenticator app, then enter the current 6-digit code.
          </p>
          <p className="break-all font-mono text-sm font-semibold tracking-widest text-foreground">
            {formatSecret(secret)}
          </p>
          {otpauth ? (
            <a
              href={otpauth}
              className="inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Open in authenticator
            </a>
          ) : null}
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void finishEnroll()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void abortEnroll()}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {mode === 'disable' ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            Enter the current authenticator code to turn two-factor authentication off.
          </p>
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void finishDisable()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Turn off
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setCode('');
                setMode('idle');
              }}
            >
              Keep on
            </Button>
          </div>
        </div>
      ) : null}

      {mode === 'regen' ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            Enter your authenticator code. This replaces all unused backup codes.
          </p>
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void finishRegen()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create new codes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setCode('');
                setMode('idle');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {enabled && mode === 'idle' && !backupCodes ? (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setCode('');
              setMode('regen');
            }}
          >
            Regenerate backup codes
          </Button>
        </div>
      ) : null}
    </div>
  );
}
