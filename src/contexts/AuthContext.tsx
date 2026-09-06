import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '@convex/_generated/api';
import { resetAnalyticsUser } from '@/lib/analytics';
import {
  AppRole,
  ACTIVE_ROLE_STORAGE_KEY,
  isAppRole,
  resolveActiveRole,
} from '@/lib/roles';

const DEV_BYPASS_ALLOWED = import.meta.env.DEV;

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  loading: boolean;
  role: AppRole | null;
  roles: AppRole[];
  roleLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  switchRole: (role: AppRole) => void;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  devMode: boolean;
  setDevRole: (role: AppRole) => void;
  enableDevMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  roles: [],
  roleLoading: true,
  hasRole: () => false,
  switchRole: () => {},
  signOut: async () => {},
  refreshRole: async () => {},
  devMode: false,
  setDevRole: () => {},
  enableDevMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

function readStoredRole(): AppRole | null {
  try {
    const stored = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    return isAppRole(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistRole(role: AppRole | null) {
  try {
    if (role) localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
    else localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { isLoading: convexAuthLoading, isAuthenticated } = useConvexAuth();
  const { signOut: convexSignOut } = useAuthActions();
  const me = useQuery(api.users.queries.me, isAuthenticated ? {} : 'skip');
  const ensureUser = useMutation(api.users.queries.ensureUser);

  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [roleLoading, setRoleLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [ensured, setEnsured] = useState(false);

  const user: AuthUser | null =
    isAuthenticated && me
      ? { id: me._id, email: me.email ?? undefined }
      : isAuthenticated && me === undefined
        ? null
        : null;

  // Sync profile + roles from Convex
  useEffect(() => {
    if (convexAuthLoading) return;
    if (!isAuthenticated) {
      setRoles([]);
      setRole(null);
      setRoleLoading(false);
      setEnsured(false);
      return;
    }
    if (me === undefined) {
      setRoleLoading(true);
      return;
    }
    if (me === null) {
      setRoles([]);
      setRole(null);
      setRoleLoading(false);
      return;
    }
    const held = (me.roles ?? []).filter(isAppRole) as AppRole[];
    const active = resolveActiveRole(held, readStoredRole());
    setRoles(held);
    setRole(active);
    persistRole(active);
    setRoleLoading(false);

    if (!ensured) {
      setEnsured(true);
      void ensureUser({
        fullName: me.fullName,
        username: me.username,
      }).catch(() => undefined);
    }
  }, [convexAuthLoading, isAuthenticated, me, ensureUser, ensured]);

  const refreshRole = useCallback(async () => {
    // Reactive query will refresh; noop for API compatibility
  }, []);

  const switchRole = useCallback(
    (next: AppRole) => {
      if (!(DEV_BYPASS_ALLOWED && devMode) && !roles.includes(next)) return;
      setRole(next);
      persistRole(next);
    },
    [roles, devMode],
  );

  const setDevRole = useCallback((newRole: AppRole) => {
    if (!DEV_BYPASS_ALLOWED) return;
    setDevMode((enabled) => {
      if (enabled) {
        setRole(newRole);
        persistRole(newRole);
      }
      return enabled;
    });
  }, []);

  const enableDevMode = useCallback(() => {
    if (!DEV_BYPASS_ALLOWED) return;
    setDevMode(true);
  }, []);

  const hasRole = useCallback(
    (target: AppRole) => (DEV_BYPASS_ALLOWED && devMode) || roles.includes(target),
    [roles, devMode],
  );

  const signOut = async () => {
    setDevMode(false);
    persistRole(null);
    resetAnalyticsUser();
    setRole(null);
    setRoles([]);
    await convexSignOut();
  };

  const loading = convexAuthLoading || (isAuthenticated && me === undefined);

  return (
    <AuthContext.Provider
      value={{
        user: me ? { id: me._id, email: me.email ?? undefined } : null,
        session: me ? { user: { id: me._id, email: me.email ?? undefined } } : null,
        loading,
        role,
        roles,
        roleLoading: loading || roleLoading,
        hasRole,
        switchRole,
        signOut,
        refreshRole,
        devMode: DEV_BYPASS_ALLOWED && devMode,
        setDevRole,
        enableDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}
