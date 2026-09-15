import { useQuery } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

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

export function useCreatorProfile() {
  const { user } = useAuth();
  const convexCreator = useQuery(api.creators.queries.myCreator, user ? {} : 'skip');

  const loading = user ? convexCreator === undefined : false;
  const creator: CreatorProfile | null = convexCreator
    ? {
        id: convexCreator._id,
        user_id: convexCreator.userId,
        username: convexCreator.username,
        display_name: convexCreator.displayName ?? null,
        monthly_price:
          convexCreator.monthlyPriceCents != null
            ? convexCreator.monthlyPriceCents / 100
            : null,
        referral_code: convexCreator.referralCode ?? null,
        messaging_enabled: convexCreator.messagingEnabled,
        created_at: new Date(convexCreator.createdAt).toISOString(),
      }
    : null;

  return { creator, loading, reload: async () => null };
}

export function buildReferralCode(creator: { username: string | null; id: string }) {
  const base = (creator.username ?? 'wz').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'wz';
  return `${base}-${creator.id.slice(0, 6)}`.toLowerCase();
}
