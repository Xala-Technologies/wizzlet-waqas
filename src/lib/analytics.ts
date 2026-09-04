/**
 * Analytics tracking utilities.
 * Inserts events into the analytics_events table.
 */

import { supabase } from '@/lib/supabase';

interface TrackEventParams {
  eventType: string;
  creatorId?: string | null;
  postId?: string | null;
}

let cachedAuthId: string | null = null;
let cachedUserId: string | null = null;

/** Returns the app user id for the signed-in account, or null when signed out. */
async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const authId = session?.user?.id ?? null;
  if (!authId) {
    cachedAuthId = null;
    cachedUserId = null;
    return null;
  }
  if (cachedAuthId === authId && cachedUserId) return cachedUserId;

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle();

  cachedAuthId = authId;
  cachedUserId = data?.id ?? null;
  return cachedUserId;
}

export async function trackEvent({ eventType, creatorId, postId }: TrackEventParams) {
  try {
    const userId = await getUserId();
    // Analytics rows are RLS-scoped to the signed-in user — skip anonymous hits
    // instead of firing a request that is guaranteed to be rejected.
    if (!userId) return;

    await supabase.from('analytics_events').insert({
      event_type: eventType,
      user_id: userId,
      creator_id: creatorId ?? null,
      post_id: postId ?? null,
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track event:', err);
  }
}


export const trackPageView = (page: string) =>
  trackEvent({ eventType: `page_view:${page}` });

export const trackPostView = (postId: string, creatorId: string) =>
  trackEvent({ eventType: 'post_view', postId, creatorId });

export const trackSubscribeClick = (creatorId: string) =>
  trackEvent({ eventType: 'subscribe_click', creatorId });

/** Reset cached user on sign-out */
export function resetAnalyticsUser() {
  cachedAuthId = null;
  cachedUserId = null;
}
