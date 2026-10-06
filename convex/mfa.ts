import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthSessionId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAppUser, logMutation } from "./lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "./lib/adminLists";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "./lib/totp";

async function currentSessionId(ctx: QueryCtx | MutationCtx): Promise<Id<"authSessions">> {
  const sessionId = await getAuthSessionId(ctx);
  if (!sessionId) throw new Error("UNAUTHENTICATED");
  return sessionId;
}

async function sessionIsGranted(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<"authSessions">,
): Promise<boolean> {
  const grant = await ctx.db
    .query("mfaSessionGrants")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .unique();
  return Boolean(grant);
}

async function grantSession(
  ctx: MutationCtx,
  userId: Id<"users">,
  sessionId: Id<"authSessions">,
): Promise<void> {
  const existing = await ctx.db
    .query("mfaSessionGrants")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .unique();
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { verifiedAt: now, userId });
    return;
  }
  await ctx.db.insert("mfaSessionGrants", {
    userId,
    sessionId,
    verifiedAt: now,
  });
}

async function clearGrantsForUser(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  const grants = await ctx.db
    .query("mfaSessionGrants")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(ADMIN_SCAN_MAX_DOCS);
  for (const grant of grants) {
    await ctx.db.delete(grant._id);
  }
}

export const status = query({
  args: {},
  returns: v.object({
    totpEnabled: v.boolean(),
    pendingEnroll: v.boolean(),
    required: v.boolean(),
  }),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const totpEnabled = Boolean(user.totpEnabled && user.totpSecret);
    const pendingEnroll = Boolean(user.totpSecret && !user.totpEnabled);
    if (!totpEnabled) {
      return { totpEnabled: false, pendingEnroll, required: false };
    }
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      return { totpEnabled: true, pendingEnroll: false, required: true };
    }
    const granted = await sessionIsGranted(ctx, sessionId);
    return { totpEnabled: true, pendingEnroll: false, required: !granted };
  },
});

export const startEnroll = mutation({
  args: {},
  returns: v.object({
    secret: v.string(),
    otpauthUrl: v.string(),
  }),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    if (user.totpEnabled && user.totpSecret) {
      throw new Error("ALREADY_ENABLED");
    }
    const secret = generateTotpSecret();
    await ctx.db.patch(user._id, {
      totpSecret: secret,
      totpEnabled: false,
      updatedAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaStartEnroll",
    });
    return {
      secret,
      otpauthUrl: otpauthUrl({
        email: user.email ?? user.username ?? "account",
        secret,
      }),
    };
  },
});

export const confirmEnroll = mutation({
  args: { code: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (user.totpEnabled && user.totpSecret) {
      throw new Error("ALREADY_ENABLED");
    }
    if (!user.totpSecret) {
      throw new Error("NOT_STARTED");
    }
    const ok = await verifyTotp(user.totpSecret, args.code);
    if (!ok) throw new Error("INVALID_CODE");
    const sessionId = await currentSessionId(ctx);
    await ctx.db.patch(user._id, {
      totpEnabled: true,
      updatedAt: Date.now(),
    });
    await grantSession(ctx, user._id, sessionId);
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaConfirmEnroll",
    });
    return null;
  },
});

export const cancelEnroll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    if (user.totpEnabled) throw new Error("ALREADY_ENABLED");
    if (!user.totpSecret) return null;
    await ctx.db.patch(user._id, {
      totpSecret: undefined,
      totpEnabled: false,
      updatedAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaCancelEnroll",
    });
    return null;
  },
});

export const disable = mutation({
  args: { code: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (!user.totpEnabled || !user.totpSecret) {
      throw new Error("NOT_ENABLED");
    }
    const ok = await verifyTotp(user.totpSecret, args.code);
    if (!ok) throw new Error("INVALID_CODE");
    await ctx.db.patch(user._id, {
      totpSecret: undefined,
      totpEnabled: false,
      updatedAt: Date.now(),
    });
    await clearGrantsForUser(ctx, user._id);
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaDisable",
    });
    return null;
  },
});

export const verifyLogin = mutation({
  args: { code: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (!user.totpEnabled || !user.totpSecret) {
      throw new Error("NOT_ENABLED");
    }
    const ok = await verifyTotp(user.totpSecret, args.code);
    if (!ok) throw new Error("INVALID_CODE");
    const sessionId = await currentSessionId(ctx);
    await grantSession(ctx, user._id, sessionId);
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaVerifyLogin",
    });
    return null;
  },
});
