import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { api } from '@convex/_generated/api';
import {
  clearStoredReturnTo,
  postAuthDestination,
  postRoleSelectDestination,
  readStoredReturnTo,
  sanitizeReturnPath,
} from '@/lib/safeReturnPath';
import { Crown, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SelectRole = () => {
  const {
    user,
    loading,
    role: activeRole,
    roles: heldRoles,
    roleLoading,
    signingOut,
    acceptAssignedRole,
    clearDevBypass,
    refreshRole,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo =
    sanitizeReturnPath(searchParams.get('returnTo')) ?? readStoredReturnTo();
  const [selected, setSelected] = useState<'creator' | 'subscriber' | null>(null);
  const [saving, setSaving] = useState(false);
  const assignSelfRole = useMutation(api.roles.mutations.assignSelfRole);

  const alreadyHasRoles = heldRoles.length > 0;

  useEffect(() => {
    if (alreadyHasRoles) clearStoredReturnTo();
  }, [alreadyHasRoles]);

  if (signingOut) {
    return <Navigate to="/" replace />;
  }

  if (loading || roleLoading) {
    return (
      <main id="main-content" className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    const loginQs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    return <Navigate to={`/login${loginQs}`} replace />;
  }

  // Cross-device / re-login: already have DB roles — do not force re-pick.
  if (alreadyHasRoles) {
    return (
      <Navigate
        to={postAuthDestination({
          roles: heldRoles,
          preferred: activeRole,
          returnTo,
        })}
        replace
      />
    );
  }

  const handleContinue = async () => {
    if (!selected || !user || saving) return;
    setSaving(true);
    clearDevBypass();

    try {
      await assignSelfRole({ role: selected });
      acceptAssignedRole(selected);
      const active = await refreshRole(selected);
      if (!active) {
        toast.message('Role saved — continuing…');
      }
      const held: Array<'creator' | 'subscriber'> = [selected];
      const dest = postRoleSelectDestination({
        selected,
        returnTo,
        heldRoles: held,
      });
      clearStoredReturnTo();
      navigate(dest, { replace: true });
    } catch {
      toast.error('Failed to set role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [
    {
      id: 'creator' as const,
      icon: Crown,
      title: 'Become a Creator',
      description: 'Publish premium content, build an audience, and earn from subscriptions.',
    },
    {
      id: 'subscriber' as const,
      icon: Users,
      title: 'Continue as Subscriber',
      description: 'Follow top creators and access their premium content.',
    },
  ];

  return (
    <AuthShell
      title="How do you want to use Prizelet?"
      subtitle="You can always add another role later from your account"
      seoTitle="Choose your role — Prizelet"
      seoDescription="Choose whether to join Prizelet as a creator or subscriber."
      width="lg"
      logoSize="lg"
      logoLinkTo=""
    >
      <div className="grid gap-4" role="radiogroup" aria-label="Account role">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(option.id)}
              className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ui text-foreground">{option.title}</p>
                <p className="text-support text-muted-foreground mt-1">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="default"
        className="mt-6 w-full h-11"
        onClick={() => void handleContinue()}
        disabled={!selected || saving || loading}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue
      </Button>
    </AuthShell>
  );
};

export default SelectRole;
