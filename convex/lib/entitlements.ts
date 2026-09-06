import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { hasActiveSubscription, userHasRole } from "./auth";

/**
 * Premium post entitlement.
 * viewerUserId must be Convex Auth users._id (from getAuthUserId), never raw JWT subject.
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

  return hasActiveSubscription(ctx, user._id, post.creatorId as Id<"creators">);
}

export function redactPostContent<T extends { content?: string | null; isPremium: boolean }>(
  post: T,
  allowed: boolean,
): T {
  if (!post.isPremium || allowed) return post;
  return { ...post, content: null };
}
