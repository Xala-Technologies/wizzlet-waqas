import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { SocialAuthSection } from '@/components/auth/SocialAuthButtons';
import { ACTIVE_ROLE_STORAGE_KEY } from '@/lib/roles';
import { useConvexAuthReady, waitForAuthenticated, withAuthRetry } from '@/lib/authSession';
import { sanitizeReturnPath, storeReturnTo } from '@/lib/safeReturnPath';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = (searchParams.get('ref') ?? '').trim();
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));
  const { signIn } = useAuthActions();
  const { clearDevBypass } = useAuth();
  const authReady = useConvexAuthReady();
  const ensureUser = useMutation(api.users.queries.ensureUser);
  const recordReferralByCode = useMutation(api.creators.growth.recordReferralByCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set('email', email.trim().toLowerCase());
      form.set('password', password);
      form.set('username', username.trim());
      form.set('name', username.trim());
      form.set('flow', 'signUp');
      await signIn('password', form);
      await waitForAuthenticated(() => authReady.current);
      await withAuthRetry(() =>
        ensureUser({
          username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
          fullName: username.trim(),
        }),
      );
      if (referralCode) {
        try {
          await withAuthRetry(() =>
            recordReferralByCode({
              code: referralCode,
              referredEmail: email.trim().toLowerCase(),
            }),
          );
        } catch {
          /* attribution is best-effort — do not block signup */
        }
      }
      clearDevBypass();
      try {
        localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (returnTo) storeReturnTo(returnTo);
      toast.success('Account created!');
      const roleHref = returnTo
        ? `/select-role?returnTo=${encodeURIComponent(returnTo)}`
        : '/select-role';
      navigate(roleHref, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/login';

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start monetizing your expertise"
      seoTitle="Create your Prizelet account"
      seoDescription="Join the Prizelet private network — create an account to follow creators or apply as a creator."
      banner={
        referralCode ? (
          <p className="text-support text-primary mt-2">Referred via code {referralCode}</p>
        ) : null
      }
      footer={
        <p className="text-center text-support text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link to={loginHref} className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={(e) => void handleSignup(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-support">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            className="bg-card border-border h-11 text-ui"
          />
        </div>
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
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
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
          <p className="text-caption text-muted-foreground">At least 8 characters</p>
        </div>
        <Button type="submit" variant="default" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <SocialAuthSection redirectTo="/auth/callback" mode="signup" returnTo={returnTo} />
    </AuthShell>
  );
};

export default Signup;
