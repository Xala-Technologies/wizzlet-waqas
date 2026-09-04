import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  AppRole,
  ACTIVE_ROLE_STORAGE_KEY,
  fetchUserRoles,
  isAppRole,
  resolveActiveRole,
} from '@/lib/roles';

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
      if (!devMode && !roles.includes(next)) return;
      setRole(next);
      persistRole(next);
    },
    [roles, devMode],
  );

  const setDevRole = useCallback((newRole: AppRole) => {
    setDevMode((enabled) => {
      if (enabled) {
        setRole(newRole);
        persistRole(newRole);
      }
      return enabled;
    });
  }, []);

  const enableDevMode = useCallback(() => setDevMode(true), []);

  const hasRole = useCallback(
    (target: AppRole) => devMode || roles.includes(target),
    [roles, devMode],
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      if (nextSession?.user) {
        // Defer the Supabase call out of the auth callback to avoid deadlocks.
        setTimeout(() => loadRoles(nextSession.user.id), 0);
      } else {
        setRole(null);
        setRoles([]);
        setRoleLoading(false);
        setDevMode(false);
        persistRole(null);
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

    return () => subscription.unsubscribe();
  }, [loadRoles]);

  const signOut = async () => {
    setDevMode(false);
    persistRole(null);
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
        devMode,
        setDevRole,
        enableDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
