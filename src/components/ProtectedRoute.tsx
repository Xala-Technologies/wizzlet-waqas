import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, homePathForRole } from '@/lib/roles';
import { api } from '@convex/_generated/api';
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

  const grantedRole = allowedRoles?.find((r) => roles.includes(r)) ?? null;

  const needsCreatorProfile =
    !!user && allowedRoles?.includes('creator') === true && location.pathname !== '/creator/onboarding';

  const creatorProfile = useQuery(
    api.creators.queries.myCreator,
    needsCreatorProfile ? {} : 'skip',
  );

  useEffect(() => {
    if (grantedRole && role !== grantedRole) switchRole(grantedRole);
  }, [grantedRole, role, switchRole]);

  if (loading || roleLoading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!(import.meta.env.DEV && devMode)) {
    if (roles.length === 0) {
      return <Navigate to="/select-role" replace />;
    }

    if (allowedRoles && !grantedRole) {
      return <Navigate to={homePathForRole(role)} replace />;
    }
  }

  if (needsCreatorProfile) {
    if (creatorProfile === undefined) return <Spinner />;
    if (!creatorProfile) return <Navigate to="/creator/onboarding" replace />;
  }

  return <>{children}</>;
}
