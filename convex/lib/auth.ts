import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export type AppRole = "admin" | "moderator" | "user" | "creator" | "subscriber";

export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new ConvexError("UNAUTHENTICATED");
  }
  return identity;
}

export async function getAppUserByExternalAuthId(ctx: Ctx, externalAuthId: string) {
  return ctx.db
    .query("users")
    .withIndex("by_externalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
    .unique();
}

export async function requireAppUser(ctx: Ctx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("UNAUTHENTICATED");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("USER_PROFILE_MISSING");
  }
  return user;
}

export async function listRolesForUser(ctx: Ctx, userId: Id<"users">): Promise<AppRole[]> {
  const rows = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return rows.map((r) => r.role as AppRole);
}

export async function userHasRole(ctx: Ctx, userId: Id<"users">, role: AppRole) {
  const hit = await ctx.db
    .query("userRoles")
    .withIndex("by_userId_role", (q) => q.eq("userId", userId).eq("role", role))
    .unique();
  return !!hit;
}

export async function requireRole(ctx: Ctx, role: AppRole) {
  const user = await requireAppUser(ctx);
  if (!(await userHasRole(ctx, user._id, role))) {
    throw new ConvexError("FORBIDDEN");
  }
  return user;
}

export async function requireAdmin(ctx: Ctx) {
  return requireRole(ctx, "admin");
}

export async function getCreatorForUser(ctx: Ctx, userId: Id<"users">) {
  return ctx.db
    .query("creators")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireCreatorOwner(ctx: Ctx, creatorId: Id<"creators">) {
  const user = await requireAppUser(ctx);
  if (await userHasRole(ctx, user._id, "admin")) {
    const creator = await ctx.db.get(creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    return { user, creator };
  }
  const creator = await ctx.db.get(creatorId);
  if (!creator || creator.userId !== user._id) {
    throw new ConvexError("FORBIDDEN");
  }
  return { user, creator };
}

export async function hasActiveSubscription(
  ctx: Ctx,
  userId: Id<"users">,
  creatorId: Id<"creators">,
) {
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId_creatorId", (q) =>
      q.eq("userId", userId).eq("creatorId", creatorId),
    )
    .collect();
  return subs.some((s) => s.status === "active");
}

export async function logMutation(
  ctx: MutationCtx,
  args: {
    table: string;
    documentId: string;
    legacyId?: string;
    action: string;
    actorExternalAuthId?: string;
  },
) {
  await ctx.db.insert("mutationLog", {
    ...args,
    createdAt: Date.now(),
  });
}
