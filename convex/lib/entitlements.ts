import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { hasContentAccess, userHasRole } from "./auth";
import { subscriptionGrantsContentAccess } from "./contentAccess";

/**
 * Premium post entitlement.
 * viewerUserId must be Convex Auth users._id (from getAuthUserId), never raw JWT subject.
 *
 * - Public (!isPremium): anyone
 * - Premium, no product filter: any active subscriber on the creator
 * - Premium + visibleProductIds: active sub whose productId is in the list
 */
export async function canViewPostContent(
  ctx: QueryCtx,
  post: Doc<"posts">,
  viewerUserId: Id<"users"> | null,
): Promise<boolean> {
  if (!post.isPremium) return true;
  if (!viewerUserId) return false;

  const user = await ctx.db.get(viewerUserId);
  if (!user) return false;

  if (await userHasRole(ctx, user._id, "admin")) return true;

  const creator = await ctx.db.get(post.creatorId);
  if (!creator) return false;
  if (creator.userId === user._id) return true;

  const productIds = post.visibleProductIds ?? [];
  if (productIds.length === 0) {
    return hasContentAccess(ctx, user._id, post.creatorId as Id<"creators">);
  }

  const nowMs = Date.now();
  const allowed = new Set(productIds.map(String));
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId_creatorId", (q) =>
      q.eq("userId", user._id).eq("creatorId", post.creatorId),
    )
    .collect();

  return subs.some(
    (s) =>
      subscriptionGrantsContentAccess(s, nowMs) &&
      s.productId != null &&
      allowed.has(String(s.productId)),
  );
}

export function redactPostContent<T extends { content?: string | null; isPremium: boolean }>(
  post: T,
  allowed: boolean,
): T {
  if (!post.isPremium || allowed) return post;
  return { ...post, content: null };
}
