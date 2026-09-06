import { useState } from 'react';
import { WizzletLogo } from '@/components/WizzletLogo';
import { Seo } from '@/components/Seo';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { ACTIVE_ROLE_STORAGE_KEY } from '@/lib/roles';
import { useConvexAuthReady, waitForAuthenticated, withAuthRetry } from '@/lib/authSession';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = (searchParams.get('ref') ?? '').trim();
  const { signIn } = useAuthActions();
  const { clearDevBypass } = useAuth();
  const authReady = useConvexAuthReady();
  const ensureUser = useMutation(api.users.queries.ensureUser);
  const recordReferralByCode = useMutation(api.creators.growth.recordReferralByCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Account created!');
      navigate('/select-role', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Seo title="Create your Wizzlet account" description="Join the Wizzlet private network — create an account to follow creators or apply as a creator." noindex />
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <WizzletLogo size="md" className="justify-center mb-8" />
          <h1 className="text-xl font-bold tracking-tight mt-4 text-foreground">Create your account</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Start monetizing your expertise</p>
          {referralCode ? (
            <p className="text-[12px] text-primary mt-2">Referred via code {referralCode}</p>
          ) : null}
        </div>

        <form onSubmit={(e) => void handleSignup(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[13px]">Username</Label>
            <Input id="username" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-card border-border h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px]">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-card border-border h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px]">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-card border-border h-10" />
          </div>
          <Button type="submit" variant="default" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
