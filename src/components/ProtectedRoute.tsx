import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppRole, homePathForRole } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, roles, loading, roleLoading, devMode, switchRole } = useAuth();
  const location = useLocation();

  // A multi-role account may legitimately open a section that isn't its active
  // role — align the active role with the section instead of bouncing them out.
  const grantedRole = allowedRoles?.find((r) => roles.includes(r)) ?? null;

  const needsCreatorProfile =
    !!user && allowedRoles?.includes('creator') === true && location.pathname !== '/creator/onboarding';

  // Creator sections are useless without a creator profile row — send those
  // accounts through onboarding instead of rendering empty/erroring pages.
  const { data: creatorProfile, isLoading: creatorProfileLoading } = useQuery({
    queryKey: ['creator-profile-exists', user?.id],
    enabled: needsCreatorProfile,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: appUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user!.id)
        .maybeSingle();
      if (!appUser) return null;
      const { data } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', appUser.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  useEffect(() => {
    if (grantedRole && role !== grantedRole) switchRole(grantedRole);
  }, [grantedRole, role, switchRole]);

  if (loading || roleLoading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!(import.meta.env.DEV && devMode)) {
    // Authenticated but no role assigned yet → role selection.
    if (roles.length === 0) {
      return <Navigate to="/select-role" replace />;
    }

    if (allowedRoles && !grantedRole) {
      return <Navigate to={homePathForRole(role)} replace />;
    }
  }

  if (needsCreatorProfile) {
    if (creatorProfileLoading) return <Spinner />;
    if (!creatorProfile) return <Navigate to="/creator/onboarding" replace />;
  }

  return <>{children}</>;
}
