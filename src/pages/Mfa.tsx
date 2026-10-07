import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeReturnPath } from '@/lib/safeReturnPath';
import { destinationAfterMfaVerify } from '@/lib/mfaGate';

const Mfa = () => {
  const { user, role, roles, loading, roleLoading, signingOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));
  const status = useQuery(api.mfa.status, user && !signingOut ? {} : 'skip');
  const verifyLogin = useMutation(api.mfa.verifyLogin);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  const dest = destinationAfterMfaVerify({ roles, preferred: role, returnTo });

  if (signingOut) return <Navigate to="/" replace />;

  if (loading || roleLoading || (user && status === undefined)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (status && !status.required) {
    return <Navigate to={dest} replace />;
  }

  const submit = async () => {
    if (busy) return;
    const trimmed = code.trim();
    if (!useBackup && trimmed.length !== 6) {
      toast.error('Enter the 6-digit authenticator code.');
      return;
    }
    if (useBackup && trimmed.replace(/[\s-]/g, '').length < 8) {
      toast.error('Enter a backup code (XXXX-XXXX).');
      return;
    }
    setBusy(true);
    try {
      const result = await verifyLogin({ code: trimmed });
      if (result.usedBackupCode) {
        toast.message('Backup code used. Regenerate codes in Settings when you can.');
      }
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not verify code';
      toast.error(
        msg.includes('INVALID_CODE')
          ? useBackup
            ? 'That backup code is not valid or was already used.'
            : 'That code is not valid. Try the current authenticator code.'
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={useBackup ? 'Backup code' : 'Authenticator code'}
      subtitle={
        useBackup
          ? 'Enter one unused backup code from when you enabled two-factor authentication.'
          : 'This account has two-factor authentication. Enter the current 6-digit code.'
      }
      seoTitle="Two-factor authentication — Sweeph"
      seoDescription="Confirm your authenticator or backup code to finish signing in."
      footer={
        <p className="text-center text-[14px] text-muted-foreground">
          Wrong account?{' '}
          <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Sign in again
          </Link>
        </p>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {useBackup ? (
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            autoComplete="one-time-code"
            className="h-12 font-mono tracking-widest"
            disabled={busy}
          />
        ) : (
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={
            busy ||
            (!useBackup && code.length !== 6) ||
            (useBackup && code.replace(/[\s-]/g, '').length < 8)
          }
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setCode('');
            setUseBackup((v) => !v);
          }}
        >
          {useBackup ? 'Use authenticator code instead' : 'Use a backup code'}
        </button>
      </form>
    </AuthShell>
  );
};

export default Mfa;
