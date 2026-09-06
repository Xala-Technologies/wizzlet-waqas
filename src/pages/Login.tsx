import { useState } from 'react';
import { WizzletLogo } from '@/components/WizzletLogo';
import { Seo } from '@/components/Seo';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { ACTIVE_ROLE_STORAGE_KEY, homePathForRole, isAppRole } from '@/lib/roles';
import { api } from '@convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const isDevBuild = import.meta.env.DEV;

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const { enableDevMode, setDevRole, refreshRole } = useAuth();
  const assignSelfRole = useMutation(api.roles.mutations.assignSelfRole);
  const ensureUser = useMutation(api.users.queries.ensureUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.set('email', email.trim().toLowerCase());
      form.set('password', password);
      form.set('flow', 'signIn');
      await signIn('password', form);
      await ensureUser({ email: email.trim().toLowerCase() });
      await refreshRole();
      // Roles load reactively; default to select-role if none yet
      const preferred = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
      navigate(isAppRole(preferred) ? homePathForRole(preferred) : '/select-role');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    if (!isDevBuild) {
      toast.error('Dev login is only available in development builds.');
      return;
    }
    setLoading(true);
    const testEmail = 'test@wizzlet.dev';
    const testPassword = 'test123456';
    try {
      const signInForm = new FormData();
      signInForm.set('email', testEmail);
      signInForm.set('password', testPassword);
      signInForm.set('flow', 'signIn');
      try {
        await signIn('password', signInForm);
      } catch {
        const signUpForm = new FormData();
        signUpForm.set('email', testEmail);
        signUpForm.set('password', testPassword);
        signUpForm.set('username', 'devtester');
        signUpForm.set('name', 'Dev Tester');
        signUpForm.set('flow', 'signUp');
        await signIn('password', signUpForm);
      }
      await ensureUser({ email: testEmail, username: 'devtester', fullName: 'Dev Tester' });
      await assignSelfRole({ role: 'creator' });
      await assignSelfRole({ role: 'subscriber' });
      await refreshRole();
      enableDevMode();
      setDevRole('admin');
      toast.success('Dev mode activated — UI role bypass enabled');
      navigate('/admin');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dev login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Seo title="Sign in — Wizzlet" description="Sign in to your Wizzlet account to manage picks, subscriptions and payouts." noindex />
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-10">
          <WizzletLogo size="md" className="justify-center mb-8" />
          <h1 className="text-xl font-bold tracking-tight mt-4 text-foreground">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Sign in to your account</p>
        </div>

        <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
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
            Sign in
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>

        {isDevBuild && (
          <Button type="button" variant="outline" className="w-full mt-6" onClick={() => void handleTestLogin()} disabled={loading}>
            Quick Test Login (dev)
          </Button>
        )}
      </div>
    </main>
  );
};

export default Login;
