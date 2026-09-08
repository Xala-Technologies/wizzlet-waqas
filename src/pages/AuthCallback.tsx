import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/roles';
import { useConvexAuthReady, waitForAuthenticated, withAuthRetry } from '@/lib/authSession';
import { Seo } from '@/components/Seo';
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
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        await waitForAuthenticated(() => authReady.current);
        await withAuthRetry(() => ensureUser({})).catch(() => undefined);
        clearDevBypass();
        const active = await refreshRole();
        navigate(homePathForRole(active), { replace: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Sign-in failed');
        navigate('/login', { replace: true });
      }
    })();
  }, [authReady, clearDevBypass, ensureUser, navigate, refreshRole]);

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-background px-4">
      <Seo title="Signing in — Wizzlet" description="Completing social sign-in." noindex />
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Finishing sign-in…</p>
      </div>
    </main>
  );
};

export default AuthCallback;
