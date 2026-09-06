import { useQuery } from 'convex/react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

/**
 * Resolves the app user id for domain FKs from Convex users.me.
 */
export function useAppUser() {
  const { user } = useAuth();
  const convexMe = useQuery(api.users.queries.me, user ? {} : 'skip');

  return {
    appUserId: convexMe?._id ?? null,
    loading: user ? convexMe === undefined : false,
    authUserId: user?.id ?? null,
  };
}
