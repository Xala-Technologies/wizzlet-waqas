import { useState } from 'react';
import { WizzletLogo } from '@/components/WizzletLogo';
import { Seo } from '@/components/Seo';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: window.location.origin },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // With auto-confirm enabled, user is immediately logged in
    if (data.session) {
      toast.success('Account created!');
      navigate('/select-role');
    } else {
      toast.success('Check your email to confirm your account');
      navigate('/login');
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
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
