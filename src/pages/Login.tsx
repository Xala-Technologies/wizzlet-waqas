import { useState } from 'react';
import { WizzletLogo } from '@/components/WizzletLogo';
import { Seo } from '@/components/Seo';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ACTIVE_ROLE_STORAGE_KEY, fetchUserRoles, homePathForRole, resolveActiveRole } from '@/lib/roles';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';



const Login = () => {
  const navigate = useNavigate();
  const { enableDevMode, setDevRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    await redirectByRole();
  };

  const redirectByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const held = await fetchUserRoles(user.id);
    const active = resolveActiveRole(held, localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY));
    navigate(homePathForRole(active));
  };


  const handleTestLogin = async () => {
    setLoading(true);
    const testEmail = 'test@wizzlet.dev';
    const testPassword = 'test123456';

    let { error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: { data: { username: 'devtester' } },
      });
      if (signUpError) {
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      if (retryError) {
        toast.error(retryError.message);
        setLoading(false);
        return;
      }
    }

    // Assign all roles to the test user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const rolesToAssign: ('admin' | 'creator' | 'subscriber')[] = ['admin', 'creator', 'subscriber'];
      await supabase.from('user_roles').upsert(
        rolesToAssign.map((role) => ({ user_id: user.id, role })),
        { onConflict: 'user_id,role', ignoreDuplicates: true },
      );
    }

    // Enable dev mode in context
    enableDevMode();
    setDevRole('admin');
    toast.success('Dev mode activated — full access enabled');
    setLoading(false);
    navigate('/admin');
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

        <form onSubmit={handleLogin} className="space-y-4">
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

        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <Button
            variant="outline"
            className="w-full text-muted-foreground"
            onClick={handleTestLogin}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🧪 Dev: Quick Test (Full Access)
          </Button>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Grants admin + creator + subscriber roles
          </p>
          <Link to="/demo/admin">
            <Button variant="ghost" className="w-full text-muted-foreground text-xs">
              👀 Explore Demo Mode
            </Button>
          </Link>
        </div>

        <p className="text-center text-[13px] text-muted-foreground mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
