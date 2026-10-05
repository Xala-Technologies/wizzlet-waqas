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
import { authInputClass } from '@/components/auth/authFieldClass';
import { SocialAuthSection } from '@/components/auth/SocialAuthButtons';
import { ACTIVE_ROLE_STORAGE_KEY } from '@/lib/roles';
import { useConvexAuthReady, waitForAuthenticated, withAuthRetry } from '@/lib/authSession';
import { sanitizeReturnPath, storeReturnTo } from '@/lib/safeReturnPath';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

function usernameLooksValid(value: string): boolean {
  return /^[a-zA-Z0-9_]{3,32}$/.test(value.trim());
}

function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ username: false, email: false, password: false });

  const usernameOk = usernameLooksValid(username);
  const emailOk = emailLooksValid(email);
  const passwordOk = password.length >= 8;
  const canSubmit = usernameOk && emailOk && passwordOk && !loading;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setTouched({ username: true, email: true, password: true });
    if (!canSubmit) {
      if (!usernameOk) {
        setFormError('Username must be 3–32 characters: letters, numbers, underscore.');
        return;
      }
      if (!emailOk) {
        setFormError('Enter a valid email address.');
        return;
      }
      setFormError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setFormError(null);
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
      toast.success('Account created');
      const roleHref = returnTo
        ? `/select-role?returnTo=${encodeURIComponent(returnTo)}`
        : '/select-role';
      navigate(roleHref, { replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Sign up failed';
      const friendly = /already|exists|taken/i.test(raw)
        ? 'That email or username is already in use. Try logging in.'
        : raw;
      setFormError(friendly);
      toast.error(friendly);
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
      subtitle="A username, email, and password — or continue with X or Discord."
      seoTitle="Create your Sweeph account"
      seoDescription="Join Sweeph — create an account to follow creators or run your own page."
      progressStep={1}
      banner={
        referralCode ? (
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[13px] text-foreground">
            Referred with code <span className="font-semibold">{referralCode}</span>
          </p>
        ) : null
      }
      footer={
        <p className="text-center text-[14px] text-muted-foreground">
          Already have an account?{' '}
          <Link to={loginHref} className="font-semibold text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={(e) => void handleSignup(e)} className="space-y-4" noValidate>
        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive"
          >
            {formError}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-[13px]">Username</Label>
          <div className="relative">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              placeholder="sharkpicks"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (formError) setFormError(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, username: true }))}
              required
              disabled={loading}
              aria-invalid={touched.username && !usernameOk}
              className={`${authInputClass} pr-11`}
            />
            {usernameOk ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" aria-hidden />
                <span className="sr-only">Username looks valid</span>
              </span>
            ) : null}
          </div>
          {touched.username && username.length > 0 && !usernameOk ? (
            <p className="text-[12px] text-destructive">
              3–32 characters: letters, numbers, underscore.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px]">Email</Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              required
              disabled={loading}
              aria-invalid={touched.email && !emailOk}
              className={`${authInputClass} pr-11`}
            />
            {emailOk ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" aria-hidden />
                <span className="sr-only">Email looks valid</span>
              </span>
            ) : null}
          </div>
          {touched.email && email.length > 0 && !emailOk ? (
            <p className="text-[12px] text-destructive">Enter a valid email address.</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px]">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              required
              disabled={loading}
              minLength={8}
              aria-invalid={touched.password && !passwordOk}
              className={`${authInputClass} pr-11`}
            />
            <button
              type="button"
              className="absolute right-0 top-0 inline-flex h-12 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 ? (
            <div className="flex gap-1 pt-0.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    password.length < 8
                      ? i === 0
                        ? 'bg-amber-500/80'
                        : 'bg-border'
                      : 'bg-emerald-500/80'
                  }`}
                />
              ))}
            </div>
          ) : null}
          {password.length > 0 ? (
            <p className="text-[12px] text-muted-foreground">
              {passwordOk
                ? 'Ready to continue.'
                : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'}.`}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          variant="default"
          className="mt-2 h-12 w-full rounded-xl text-[15px] font-semibold"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <SocialAuthSection
        redirectTo="/auth/callback"
        mode="signup"
        returnTo={returnTo}
        referralCode={referralCode || null}
      />
    </AuthShell>
  );
};

export default Signup;
