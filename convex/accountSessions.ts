import { getAuthSessionId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getOptionalAppUser, logMutation, requireAppUser } from "./lib/auth";

const sessionSummary = v.object({
  id: v.id("authSessions"),
  createdAt: v.number(),
  expiresAt: v.number(),
  isCurrent: v.boolean(),
});

export const listMine = query({
  args: {},
  returns: v.union(v.null(), v.object({ sessions: v.array(sessionSummary), hasMore: v.boolean() })),
  handler: async (ctx) => {
    // A revoked session is anonymous even while its JWT remains valid. Returning
    // no data lets AuthContext redirect without a query-error race on sign-out.
    const user = await getOptionalAppUser(ctx);
    if (!user) return null;
    const currentId = await getAuthSessionId(ctx);
    const sessions = await ctx.db.query("authSessions")
      .withIndex("userId", q => q.eq("userId", user._id))
      .filter(q => q.gt(q.field("expirationTime"), Date.now()))
      .order("desc").take(102);
    const shown = sessions.slice(0, 100);
    // Keep the current session visible even if many newer sign-ins exist.
    if (currentId && !shown.some(s => s._id === currentId)) {
      const current = await ctx.db.get(currentId);
      if (current?.userId === user._id) shown.push(current);
    }
    return {
      sessions: shown.map(s => ({ id: s._id, createdAt: s._creationTime, expiresAt: s.expirationTime, isCurrent: s._id === currentId }))
        .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || b.createdAt - a.createdAt),
      hasMore: sessions.some(session => !shown.some(s => s._id === session._id)),
    };
  },
});

async function deleteOwnedSession(ctx: MutationCtx, sessionId: Id<"authSessions">) {
  // Match Convex Auth's session deletion, plus this application's MFA grants.
  // Do not truncate token deletion: a successful response means revocation is complete.
  const tokens = await ctx.db.query("authRefreshTokens")
    .withIndex("sessionId", q => q.eq("sessionId", sessionId)).collect();
  const grants = await ctx.db.query("mfaSessionGrants")
    .withIndex("by_sessionId", q => q.eq("sessionId", sessionId)).collect();
  for (const token of tokens) await ctx.db.delete(token._id);
  for (const grant of grants) await ctx.db.delete(grant._id);
  await ctx.db.delete(sessionId);
}

export const revoke = mutation({
  args: { sessionId: v.id("authSessions") },
  returns: v.object({ currentSessionRevoked: v.boolean() }),
  handler: async (ctx, { sessionId }) => {
    const user = await requireAppUser(ctx);
    const session = await ctx.db.get(sessionId);
    // Same response for missing and foreign IDs; never accept a client userId.
    if (!session || session.userId !== user._id) throw new ConvexError("SESSION_NOT_FOUND");
    const currentSessionRevoked = sessionId === await getAuthSessionId(ctx);
    await deleteOwnedSession(ctx, sessionId);
    await logMutation(ctx, { table: "authSessions", documentId: sessionId, action: "revokeSession", actorExternalAuthId: user._id });
    return { currentSessionRevoked };
  },
});

export const revokeAll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    // Indexed by owner, like Convex Auth's invalidateSessions implementation.
    // All deletions are one transaction; a resource-limit error rolls back rather
    // than claiming that everyone was signed out after a partial capped scan.
    const sessions = await ctx.db.query("authSessions")
      .withIndex("userId", q => q.eq("userId", user._id)).collect();
    for (const session of sessions) await deleteOwnedSession(ctx, session._id);
    // Also remove grants left behind by earlier ordinary sign-outs.
    const grants = await ctx.db.query("mfaSessionGrants")
      .withIndex("by_userId", q => q.eq("userId", user._id)).collect();
    for (const grant of grants) await ctx.db.delete(grant._id);
    await logMutation(ctx, { table: "users", documentId: user._id, action: "revokeAllSessions", actorExternalAuthId: user._id });
    return null;
  },
});
