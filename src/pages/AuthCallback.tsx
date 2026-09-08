import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/roles';
import { useConvexAuthReady, waitForAuthenticated, withAuthRetry } from '@/lib/authSession';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Landing after X / Discord OAuth. Ensures profile fields, then routes by role
 * (or /select-role for first-time social users).
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshRole, clearDevBypass } = useAuth();
  const authReady = useConvexAuthReady();
  const ensureUser = useMutation(api.users.queries.ensureUser);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const runId = useRef(0);
  const autoStarted = useRef(false);

  const finishSignIn = useCallback(async () => {
    const id = ++runId.current;
    setBusy(true);
    setError(null);
    try {
      await waitForAuthenticated(() => authReady.current);
      if (id !== runId.current) return;
      await withAuthRetry(() => ensureUser({})).catch(() => undefined);
      if (id !== runId.current) return;
      clearDevBypass();
      const active = await refreshRole();
      if (id !== runId.current) return;
      navigate(homePathForRole(active), { replace: true });
    } catch (err) {
      if (id !== runId.current) return;
      const message =
        err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
      setBusy(false);
      toast.error(message);
    }
  }, [authReady, clearDevBypass, ensureUser, navigate, refreshRole]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    void finishSignIn();
  }, [finishSignIn]);

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-background px-4">
      <Seo title="Signing in — Wizzlet" description="Completing social sign-in." noindex />
      {error ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-base font-medium text-foreground">Sign-in did not complete</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="hero"
              className="min-h-11"
              disabled={busy}
              onClick={() => void finishSignIn()}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Try again
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Finishing sign-in…</p>
        </div>
      )}
    </main>
  );
};

export default AuthCallback;
