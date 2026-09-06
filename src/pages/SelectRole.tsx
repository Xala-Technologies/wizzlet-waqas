import { useState } from 'react';
import { WizzletLogo } from '@/components/WizzletLogo';
import { Seo } from '@/components/Seo';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';
import { Crown, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SelectRole = () => {
  const { user, loading, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'creator' | 'subscriber' | null>(null);
  const [saving, setSaving] = useState(false);
  const assignSelfRole = useMutation(api.roles.mutations.assignSelfRole);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSaving(true);

    try {
      await assignSelfRole({ role: selected });
    } catch {
      toast.error('Failed to set role. Please try again.');
      setSaving(false);
      return;
    }

    await refreshRole();
    setSaving(false);
    navigate(selected === 'creator' ? '/creator/onboarding' : '/dashboard');
  };

  const roles = [
    {
      id: 'creator' as const,
      icon: Crown,
      title: 'Become a Creator',
      description: 'Share your sports picks, build an audience, and earn from subscriptions.',
    },
    {
      id: 'subscriber' as const,
      icon: Users,
      title: 'Continue as Subscriber',
      description: 'Follow top creators and access premium sports picks and content.',
    },
  ];

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4">
      <Seo title="Choose your role — Wizzlet" description="Choose whether to join Wizzlet as a creator or subscriber." noindex />
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <WizzletLogo size="lg" linkTo="" className="justify-center mb-6" />
          <h1 className="text-2xl font-bold mt-4">How do you want to use Wizzlet?</h1>
          <p className="text-sm text-muted-foreground mt-2">You can always change this later</p>
        </div>

        <div className="grid gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelected(role.id)}
              className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                selected === role.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  selected === role.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <role.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{role.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || saving}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
          Continue
        </button>
      </div>
    </main>
  );
};

export default SelectRole;
