import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthSessionId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin, requireAppUser, logMutation } from "./lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "./lib/adminLists";
import {
  findBackupCodeIndex,
  generateBackupCodes,
  hashBackupCodes,
  isValidBackupCode,
} from "./lib/mfaBackup";
import { generateTotpSecret, isValidTotpCode, otpauthUrl, verifyTotp } from "./lib/totp";

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

async function clearMfaState(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  await ctx.db.patch(userId, {
    totpSecret: undefined,
    totpEnabled: false,
    totpBackupCodeHashes: undefined,
    updatedAt: Date.now(),
  });
  await clearGrantsForUser(ctx, userId);
}

export const status = query({
  args: {},
  returns: v.object({
    totpEnabled: v.boolean(),
    pendingEnroll: v.boolean(),
    required: v.boolean(),
    backupCodesRemaining: v.number(),
  }),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const totpEnabled = Boolean(user.totpEnabled && user.totpSecret);
    const pendingEnroll = Boolean(user.totpSecret && !user.totpEnabled);
    const backupCodesRemaining = user.totpBackupCodeHashes?.length ?? 0;
    if (!totpEnabled) {
      return {
        totpEnabled: false,
        pendingEnroll,
        required: false,
        backupCodesRemaining: 0,
      };
    }
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      return {
        totpEnabled: true,
        pendingEnroll: false,
        required: true,
        backupCodesRemaining,
      };
    }
    const granted = await sessionIsGranted(ctx, sessionId);
    return {
      totpEnabled: true,
      pendingEnroll: false,
      required: !granted,
      backupCodesRemaining,
    };
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
      totpBackupCodeHashes: undefined,
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
  returns: v.object({ backupCodes: v.array(v.string()) }),
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
    const backupCodes = generateBackupCodes();
    const hashes = await hashBackupCodes(backupCodes);
    await ctx.db.patch(user._id, {
      totpEnabled: true,
      totpBackupCodeHashes: hashes,
      updatedAt: Date.now(),
    });
    await grantSession(ctx, user._id, sessionId);
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaConfirmEnroll",
    });
    return { backupCodes };
  },
});

export const cancelEnroll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    if (user.totpEnabled) throw new Error("ALREADY_ENABLED");
    if (!user.totpSecret) return null;
    await clearMfaState(ctx, user._id);
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
    await clearMfaState(ctx, user._id);
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaDisable",
    });
    return null;
  },
});

export const regenerateBackupCodes = mutation({
  args: { code: v.string() },
  returns: v.object({ backupCodes: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (!user.totpEnabled || !user.totpSecret) {
      throw new Error("NOT_ENABLED");
    }
    const ok = await verifyTotp(user.totpSecret, args.code);
    if (!ok) throw new Error("INVALID_CODE");
    const backupCodes = generateBackupCodes();
    const hashes = await hashBackupCodes(backupCodes);
    await ctx.db.patch(user._id, {
      totpBackupCodeHashes: hashes,
      updatedAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: "mfaRegenerateBackupCodes",
    });
    return { backupCodes };
  },
});

export const verifyLogin = mutation({
  args: { code: v.string() },
  returns: v.object({ usedBackupCode: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (!user.totpEnabled || !user.totpSecret) {
      throw new Error("NOT_ENABLED");
    }
    const sessionId = await currentSessionId(ctx);
    let usedBackupCode = false;

    if (isValidTotpCode(args.code)) {
      const ok = await verifyTotp(user.totpSecret, args.code);
      if (!ok) throw new Error("INVALID_CODE");
    } else if (isValidBackupCode(args.code)) {
      const hashes = user.totpBackupCodeHashes ?? [];
      const idx = await findBackupCodeIndex(hashes, args.code);
      if (idx < 0) throw new Error("INVALID_CODE");
      const next = hashes.filter((_, i) => i !== idx);
      await ctx.db.patch(user._id, {
        totpBackupCodeHashes: next.length > 0 ? next : undefined,
        updatedAt: Date.now(),
      });
      usedBackupCode = true;
    } else {
      throw new Error("INVALID_CODE");
    }

    await grantSession(ctx, user._id, sessionId);
    await logMutation(ctx, {
      table: "users",
      documentId: user._id,
      action: usedBackupCode ? "mfaVerifyLoginBackup" : "mfaVerifyLogin",
    });
    return { usedBackupCode };
  },
});

/** Admin recovery — clears TOTP + backup codes + session grants. Cannot target self. */
export const adminDisable = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === args.userId) {
      throw new Error("CANNOT_RESET_SELF");
    }
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("NOT_FOUND");
    if (!target.totpEnabled && !target.totpSecret && !target.totpBackupCodeHashes?.length) {
      throw new Error("NOT_ENABLED");
    }
    await clearMfaState(ctx, args.userId);
    await logMutation(ctx, {
      table: "users",
      documentId: args.userId,
      action: "mfaAdminDisable",
    });
    return null;
  },
});
