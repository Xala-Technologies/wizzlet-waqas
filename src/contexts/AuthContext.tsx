import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { resetAnalyticsUser } from '@/lib/analytics';
import {
  AppRole,
  ACTIVE_ROLE_STORAGE_KEY,
  fetchUserRoles,
  isAppRole,
  resolveActiveRole,
} from '@/lib/roles';

const DEV_BYPASS_ALLOWED = import.meta.env.DEV;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** The role the dashboard UI is currently operating as. */
  role: AppRole | null;
  /** Every role the account holds, ordered by precedence. */
  roles: AppRole[];
  roleLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  switchRole: (role: AppRole) => void;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  /** True only in development when Quick Test enabled a UI bypass. */
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
    /* storage unavailable — precedence fallback still applies */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [roleLoading, setRoleLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);

  const loadRoles = useCallback(async (userId: string) => {
    setRoleLoading(true);
    const held = await fetchUserRoles(userId);
    const active = resolveActiveRole(held, readStoredRole());
    setRoles(held);
    setRole(active);
    persistRole(active);
    setRoleLoading(false);
  }, []);

  const refreshRole = useCallback(async () => {
    if (user) await loadRoles(user.id);
  }, [user, loadRoles]);

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

  useEffect(() => {
    let roleLoadTimer: ReturnType<typeof setTimeout> | undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      if (nextSession?.user) {
        // Defer the Supabase call out of the auth callback to avoid deadlocks.
        roleLoadTimer = setTimeout(() => loadRoles(nextSession.user.id), 0);
      } else {
        setRole(null);
        setRoles([]);
        setRoleLoading(false);
        setDevMode(false);
        persistRole(null);
        resetAnalyticsUser();
      }
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
      if (current?.user) {
        loadRoles(current.user.id);
      } else {
        setRoleLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (roleLoadTimer) clearTimeout(roleLoadTimer);
    };
  }, [loadRoles]);

  const signOut = async () => {
    setDevMode(false);
    persistRole(null);
    resetAnalyticsUser();
    await supabase.auth.signOut();
    setRole(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        roles,
        roleLoading,
        hasRole,
        switchRole,
        signOut,
        refreshRole,
        // Never expose active bypass outside development builds.
        devMode: DEV_BYPASS_ALLOWED && devMode,
        setDevRole,
        enableDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
