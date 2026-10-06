import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { api } from '@convex/_generated/api';
import { destinationAfterMfa } from '@/lib/mfaGate';
import {
  clearStoredReturnTo,
  postAuthDestination,
  postRoleSelectDestination,
  readStoredReturnTo,
  sanitizeReturnPath,
} from '@/lib/safeReturnPath';
import { User, Users, Loader2 } from 'lucide-react';
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
  const mfa = useQuery(api.mfa.status, user && !signingOut ? {} : 'skip');

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

  if (mfa === undefined) {
    return (
      <main id="main-content" className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }
  if (mfa.required) {
    return (
      <Navigate
        to={destinationAfterMfa({
          mfaRequired: true,
          dest: alreadyHasRoles
            ? postAuthDestination({
                roles: heldRoles,
                preferred: activeRole,
                returnTo,
              })
            : `/select-role${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
        })}
        replace
      />
    );
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
      icon: User,
      title: "I'm a Creator",
      description: 'Create your page, share content and earn from your audience.',
    },
    {
      id: 'subscriber' as const,
      icon: Users,
      title: "I'm a Subscriber",
      description: 'Discover creators and get access to exclusive content.',
    },
  ];

  return (
    <AuthShell
      title="How will you use Sweeph?"
      subtitle="You can switch later. This only sets up the right home screen."
      seoTitle="Choose your role — Sweeph"
      seoDescription="Choose whether to join Sweeph as a creator or subscriber."
      width="lg"
      logoSize="lg"
      logoLinkTo=""
      progressStep={2}
    >
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account role">
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
              className={`relative flex flex-col items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-background hover:border-foreground/25'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[15px] text-foreground">{option.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="default"
        className="mt-8 h-12 w-full rounded-xl text-[15px] font-semibold"
        onClick={() => void handleContinue()}
        disabled={!selected || saving || loading}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saving ? 'Saving…' : 'Continue'}
      </Button>
      <p className="mt-5 text-center">
        <Link
          to="/"
          className="text-[14px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Go back
        </Link>
      </p>
    </AuthShell>
  );
};

export default SelectRole;
