/**
 * Analytics tracking — Convex only.
 */

import { convex } from '@/integrations/convex/client';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

interface TrackEventParams {
  eventType: string;
  creatorId?: string | null;
  postId?: string | null;
}

export async function trackEvent({ eventType, creatorId, postId }: TrackEventParams) {
  try {
    await convex.mutation(api.analytics.mutations.track, {
      eventType,
      creatorId: creatorId ? (creatorId as Id<'creators'>) : undefined,
      postId: postId ? (postId as Id<'posts'>) : undefined,
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track event:', err);
  }
}

export const trackPageView = (page: string) => trackEvent({ eventType: `page_view:${page}` });

export const trackPostView = (postId: string, creatorId: string) =>
  trackEvent({ eventType: 'post_view', postId, creatorId });

export const trackSubscribeClick = (creatorId: string) =>
  trackEvent({ eventType: 'subscribe_click', creatorId });

export function resetAnalyticsUser() {
  /* Convex identity is session-scoped */
}
