import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Resolves the internal `public.users.id` row for the signed-in auth user.
 * Most domain tables (subscriptions, analytics_events, ...) key off this id
 * rather than the auth uid, so pages need it before they can query.
 */
export function useAppUser() {
  const { user } = useAuth();
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setAppUserId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAppUserId(data?.id ?? null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { appUserId, loading, authUserId: user?.id ?? null };
}
