import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CreatorProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  monthly_price: number | null;
  referral_code: string | null;
  messaging_enabled: boolean;
  created_at: string;
}

/**
 * Resolves the `public.creators` row that belongs to the signed-in account.
 * Every creator dashboard page needs this before it can query its own data.
 */
export function useCreatorProfile() {
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCreator(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    const { data: appUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!appUser) {
      setCreator(null);
      setLoading(false);
      return null;
    }

    const { data } = await supabase
      .from('creators')
      .select('id, user_id, username, display_name, monthly_price, referral_code, messaging_enabled, created_at')
      .eq('user_id', appUser.id)
      .maybeSingle();

    setCreator((data as CreatorProfile) ?? null);
    setLoading(false);
    return (data as CreatorProfile) ?? null;
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { creator, loading, reload: load };
}

/** Stable, human-friendly referral code derived from the creator id. */
export function buildReferralCode(creator: { username: string | null; id: string }) {
  const base = (creator.username ?? 'wz').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'wz';
  return `${base}-${creator.id.slice(0, 6)}`.toLowerCase();
}
