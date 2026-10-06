import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@convex/_generated/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
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
    if (code.length !== 6) {
      toast.error('Enter the 6-digit authenticator code.');
      return;
    }
    setBusy(true);
    try {
      await verifyLogin({ code });
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not verify code';
      toast.error(
        msg.includes('INVALID_CODE')
          ? 'That code is not valid. Try the current authenticator code.'
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Authenticator code"
      subtitle="This account has two-factor authentication. Enter the current 6-digit code."
      seoTitle="Two-factor authentication — Sweeph"
      seoDescription="Confirm your authenticator code to finish signing in."
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
        <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </form>
    </AuthShell>
  );
};

export default Mfa;
