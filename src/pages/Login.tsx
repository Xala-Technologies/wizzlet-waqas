import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvex, useMutation } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { SocialAuthSection } from '@/components/auth/SocialAuthButtons';
import { ADMIN_BOOTSTRAP } from '@/lib/adminBootstrap';
import { useConvexAuthReady, waitForAuthenticated, withAuthRetry } from '@/lib/authSession';
import { isAppRole, type AppRole } from '@/lib/roles';
import {
  clearStoredReturnTo,
  postAuthDestination,
  sanitizeReturnPath,
  storeReturnTo,
} from '@/lib/safeReturnPath';
import { api } from '@convex/_generated/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const isDevBuild = import.meta.env.DEV;

async function loadHeldRoles(convex: ReturnType<typeof useConvex>): Promise<AppRole[]> {
  const latest = await convex.query(api.users.queries.me, {});
  return ((latest?.roles ?? []) as unknown[]).filter(isAppRole) as AppRole[];
}

const Login = () => {
  const navigate = useNavigate();
  const convex = useConvex();
  const [searchParams] = useSearchParams();
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));
  const { signIn } = useAuthActions();
  const { refreshRole, clearDevBypass, acceptAssignedRole } = useAuth();
  const authReady = useConvexAuthReady();
  const grantTestAdmin = useMutation(api.roles.mutations.grantTestAdmin);
  const ensureUser = useMutation(api.users.queries.ensureUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const finishAdminSession = async () => {
    await waitForAuthenticated(() => authReady.current);
    await withAuthRetry(() =>
      ensureUser({
        username: ADMIN_BOOTSTRAP.username,
        fullName: ADMIN_BOOTSTRAP.fullName,
      }),
    );
    await withAuthRetry(() => grantTestAdmin({}));
    acceptAssignedRole('admin');
    await refreshRole('admin');
    clearStoredReturnTo();
    toast.success('Signed in as platform owner');
    navigate('/admin');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const form = new FormData();
      form.set('email', normalizedEmail);
      form.set('password', password);
      form.set('flow', 'signIn');
      await signIn('password', form);
      await waitForAuthenticated(() => authReady.current);

      if (normalizedEmail === ADMIN_BOOTSTRAP.email) {
        await finishAdminSession();
        return;
      }

      clearDevBypass();
      await withAuthRetry(() => ensureUser({})).catch(() => undefined);
      const active = await refreshRole();
      const held = await withAuthRetry(() => loadHeldRoles(convex));
      const dest = postAuthDestination({
        roles: held,
        preferred: active,
        returnTo,
      });
      clearStoredReturnTo();
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!isDevBuild) {
      toast.error('Admin bootstrap login is only available in development builds.');
      return;
    }
    if (loading) return;
    setLoading(true);
    setEmail(ADMIN_BOOTSTRAP.email);
    setPassword(ADMIN_BOOTSTRAP.password);
    try {
      const signInForm = new FormData();
      signInForm.set('email', ADMIN_BOOTSTRAP.email);
      signInForm.set('password', ADMIN_BOOTSTRAP.password);
      signInForm.set('flow', 'signIn');
      try {
        await signIn('password', signInForm);
      } catch {
        const signUpForm = new FormData();
        signUpForm.set('email', ADMIN_BOOTSTRAP.email);
        signUpForm.set('password', ADMIN_BOOTSTRAP.password);
        signUpForm.set('username', ADMIN_BOOTSTRAP.username);
        signUpForm.set('name', ADMIN_BOOTSTRAP.fullName);
        signUpForm.set('flow', 'signUp');
        await signIn('password', signUpForm);
      }
      await finishAdminSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const signupHref = returnTo
    ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
    : '/signup';

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account"
      seoTitle="Sign in — Prizelet"
      seoDescription="Sign in to your Prizelet account to manage picks, subscriptions and payouts."
      footer={
        <p className="text-center text-support text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link to={signupHref} className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-support">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="bg-card border-border h-11 text-ui"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-support">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-card border-border h-11 text-ui pr-11"
            />
            <button
              type="button"
              className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="default" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <SocialAuthSection redirectTo="/auth/callback" mode="signin" returnTo={returnTo} />

      {isDevBuild && (
        <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-support font-medium text-foreground">Platform owner (local)</p>
          <p className="text-caption text-muted-foreground font-mono leading-relaxed">
            {ADMIN_BOOTSTRAP.email}
            <br />
            {ADMIN_BOOTSTRAP.password}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => {
              storeReturnTo(null);
              void handleAdminLogin();
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in as platform owner
          </Button>
        </div>
      )}
    </AuthShell>
  );
};

export default Login;
