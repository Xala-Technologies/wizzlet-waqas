import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { getCreatorForUser, requireAdmin, requireAppUser, logMutation } from "./lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "./lib/adminLists";
import {
  generateNumericOtp,
  generateOtpSalt,
  hashOtp,
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  otpExpired,
  otpMatches,
  otpResendTooSoon,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
} from "./lib/emailOtp";
import {
  allowDevOtpEcho,
  emailChangeOtpMessage,
  mailerConfigured,
  sendResendEmail,
} from "./lib/transactionalEmail";

const accountRequestDocValidator = v.object({
  _id: v.id("accountRequests"),
  _creationTime: v.number(),
  userId: v.id("users"),
  category: v.string(),
  reason: v.string(),
  requestedEmail: v.optional(v.string()),
  status: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const AUTH_PROVIDERS = ["password", "discord", "twitter"] as const;

async function clearAuthSessions(ctx: MutationCtx, userId: Id<"users">) {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .take(ADMIN_SCAN_MAX_DOCS);
  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .take(ADMIN_SCAN_MAX_DOCS);
    for (const token of refreshTokens) {
      await ctx.db.delete(token._id);
    }
    await ctx.db.delete(session._id);
  }
}

async function deleteAuthAccounts(ctx: MutationCtx, userId: Id<"users">) {
  for (const provider of AUTH_PROVIDERS) {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", provider),
      )
      .unique();
    if (account) {
      await ctx.db.delete(account._id);
    }
  }
}

async function stripUserRoles(ctx: MutationCtx, userId: Id<"users">) {
  const roles = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(ADMIN_SCAN_MAX_DOCS);
  for (const role of roles) {
    await ctx.db.delete(role._id);
  }
}

async function fulfillEmailChange(ctx: MutationCtx, req: Doc<"accountRequests">) {
  const requestedEmail = req.requestedEmail?.trim().toLowerCase();
  if (!requestedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
    throw new Error("INVALID_REQUESTED_EMAIL");
  }

  const user = await ctx.db.get(req.userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  const emailOwner = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", requestedEmail))
    .unique();
  if (emailOwner && emailOwner._id !== req.userId) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordClash = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", requestedEmail),
    )
    .unique();
  if (passwordClash && passwordClash.userId !== req.userId) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordAccount = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", req.userId).eq("provider", "password"),
    )
    .unique();
  if (passwordAccount) {
    await ctx.db.patch(passwordAccount._id, {
      providerAccountId: requestedEmail,
      emailVerified: undefined,
    });
  }

  await ctx.db.patch(req.userId, {
    email: requestedEmail,
    emailVerificationTime: Date.now(),
    updatedAt: Date.now(),
  });
  await clearAuthSessions(ctx, req.userId);
}

function stripOtpFields<T extends Doc<"accountRequests">>(row: T) {
  return {
    _id: row._id,
    _creationTime: row._creationTime,
    userId: row.userId,
    category: row.category,
    reason: row.reason,
    requestedEmail: row.requestedEmail,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function assertEmailAvailable(
  ctx: MutationCtx,
  userId: Id<"users">,
  requestedEmail: string,
) {
  const emailOwner = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", requestedEmail))
    .unique();
  if (emailOwner && emailOwner._id !== userId) {
    throw new Error("EMAIL_TAKEN");
  }
  const passwordClash = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", requestedEmail),
    )
    .unique();
  if (passwordClash && passwordClash.userId !== userId) {
    throw new Error("EMAIL_TAKEN");
  }
}

async function mintOtpOnEmailRequest(
  ctx: MutationCtx,
  args: {
    user: Doc<"users">;
    requestedEmail: string;
    reason?: string;
  },
): Promise<{ requestId: Id<"accountRequests">; code: string }> {
  const requestedEmail = normalizeEmail(args.requestedEmail);
  if (!isValidEmail(requestedEmail)) {
    throw new Error("INVALID_EMAIL");
  }
  if (args.user.email && normalizeEmail(args.user.email) === requestedEmail) {
    throw new Error("EMAIL_UNCHANGED");
  }
  await assertEmailAvailable(ctx, args.user._id, requestedEmail);

  const open = await ctx.db
    .query("accountRequests")
    .withIndex("by_userId_category", (q) =>
      q.eq("userId", args.user._id).eq("category", "email_change"),
    )
    .take(ADMIN_SCAN_MAX_DOCS);
  const alreadyOpen = open.find((r) => r.status === "open");
  const now = Date.now();
  if (alreadyOpen && otpResendTooSoon(alreadyOpen.otpLastSentAt, now)) {
    throw new Error("OTP_RESEND_COOLDOWN");
  }

  const code = generateNumericOtp();
  const salt = generateOtpSalt();
  const otpHash = await hashOtp(salt, code);
  const reason = (args.reason ?? "Sign-in email change requested").trim().slice(0, 500);
  const otpPatch = {
    requestedEmail,
    reason,
    otpHash,
    otpSalt: salt,
    otpExpiresAt: now + OTP_TTL_MS,
    otpAttemptCount: 0,
    otpLastSentAt: now,
    updatedAt: now,
  };

  if (alreadyOpen) {
    await ctx.db.patch(alreadyOpen._id, otpPatch);
    await logMutation(ctx, {
      table: "accountRequests",
      documentId: alreadyOpen._id,
      action: "mintEmailChangeOtp",
      actorExternalAuthId: args.user.externalAuthId,
    });
    return { requestId: alreadyOpen._id, code };
  }

  const id = await ctx.db.insert("accountRequests", {
    userId: args.user._id,
    category: "email_change",
    status: "open",
    createdAt: now,
    ...otpPatch,
  });
  await logMutation(ctx, {
    table: "accountRequests",
    documentId: id,
    action: "mintEmailChangeOtp",
    actorExternalAuthId: args.user.externalAuthId,
  });
  return { requestId: id, code };
}

/** Soft-delete locally; returns `sub_*` ids for the caller to cancel on Stripe. */
async function fulfillAccountDeletion(
  ctx: MutationCtx,
  req: Doc<"accountRequests">,
): Promise<string[]> {
  const user = await ctx.db.get(req.userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  const now = Date.now();
  await clearAuthSessions(ctx, req.userId);
  await deleteAuthAccounts(ctx, req.userId);
  await stripUserRoles(ctx, req.userId);

  const creator = await getCreatorForUser(ctx, req.userId);
  if (creator?.isPublished) {
    await ctx.db.patch(creator._id, { isPublished: false, updatedAt: now });
  }

  const activeSubs = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", req.userId))
    .take(ADMIN_SCAN_MAX_DOCS);
  const stripeSubscriptionIds: string[] = [];
  for (const sub of activeSubs) {
    if (sub.status === "active" || sub.billingStatus === "cancel_pending") {
      const stripeId = sub.stripeSubscriptionId;
      if (typeof stripeId === "string" && stripeId.startsWith("sub_")) {
        stripeSubscriptionIds.push(stripeId);
      }
      await ctx.db.patch(sub._id, {
        status: "cancelled",
        billingStatus: "canceled",
        updatedAt: now,
      });
    }
  }

  await ctx.db.patch(req.userId, {
    email: `deleted+${req.userId}@prizelet.invalid`,
    fullName: "Deleted user",
    name: "Deleted user",
    username: undefined,
    phone: undefined,
    image: undefined,
    bio: undefined,
    discordId: undefined,
    discordUsername: undefined,
    emailVerificationTime: undefined,
    updatedAt: now,
  });

  // Backup path if the admin client cancel action is skipped/fails.
  if (stripeSubscriptionIds.length > 0) {
    await ctx.scheduler.runAfter(
      0,
      internal.payments.stripeNode.cancelStripeSubscriptionsBestEffort,
      {
        stripeSubscriptionIds,
        reason: `account_deletion:${req._id}`,
      },
    );
  }
  return stripeSubscriptionIds;
}

/** Member/creator: open or refresh an email-change case and mint a hashed OTP (no plaintext). */
export const requestEmailChange = mutation({
  args: {
    requestedEmail: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.id("accountRequests"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const minted = await mintOtpOnEmailRequest(ctx, {
      user,
      requestedEmail: args.requestedEmail,
      reason: args.reason,
    });
    return minted.requestId;
  },
});

const mintResultValidator = v.object({
  requestId: v.id("accountRequests"),
  code: v.string(),
  requestedEmail: v.string(),
});

export const mintEmailChangeOtp = internalMutation({
  args: {
    userId: v.id("users"),
    requestedEmail: v.string(),
    reason: v.optional(v.string()),
  },
  returns: mintResultValidator,
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const minted = await mintOtpOnEmailRequest(ctx, {
      user,
      requestedEmail: args.requestedEmail,
      reason: args.reason,
    });
    const req = await ctx.db.get(minted.requestId);
    return {
      requestId: minted.requestId,
      code: minted.code,
      requestedEmail: req?.requestedEmail ?? normalizeEmail(args.requestedEmail),
    };
  },
});

async function deliverEmailChangeCode(args: {
  requestedEmail: string;
  code: string;
}): Promise<{ delivery: "email" | "dev"; devCode?: string }> {
  const echoDev = allowDevOtpEcho();
  if (mailerConfigured()) {
    const { subject, text } = emailChangeOtpMessage(args.code);
    await sendResendEmail({
      apiKey: process.env.RESEND_API_KEY!.trim(),
      from: process.env.EMAIL_FROM!.trim(),
      to: args.requestedEmail,
      subject,
      text,
    });
    return echoDev
      ? { delivery: "email", devCode: args.code }
      : { delivery: "email" };
  }
  if (echoDev) {
    console.info("[email-otp][dev] code minted (not emailed)", {
      to: args.requestedEmail,
    });
    return { delivery: "dev", devCode: args.code };
  }
  throw new Error("MAILER_NOT_CONFIGURED");
}

const startEmailResultValidator = v.object({
  requestId: v.id("accountRequests"),
  delivery: v.union(v.literal("email"), v.literal("dev")),
  devCode: v.optional(v.string()),
});

/** Authenticated self-serve: mint OTP and email it (dev echo only when ALLOW_DEV_ADMIN_GRANT). */
export const startEmailChange = action({
  args: {
    requestedEmail: v.string(),
    reason: v.optional(v.string()),
  },
  returns: startEmailResultValidator,
  handler: async (ctx, args): Promise<{
    requestId: Id<"accountRequests">;
    delivery: "email" | "dev";
    devCode?: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const minted: {
      requestId: Id<"accountRequests">;
      code: string;
      requestedEmail: string;
    } = await ctx.runMutation(internal.accountRequests.mintEmailChangeOtp, {
      userId,
      requestedEmail: args.requestedEmail,
      reason: args.reason,
    });
    const delivered = await deliverEmailChangeCode({
      requestedEmail: minted.requestedEmail,
      code: minted.code,
    });
    return {
      requestId: minted.requestId,
      ...delivered,
    };
  },
});

export const resendEmailChangeOtp = action({
  args: {},
  returns: startEmailResultValidator,
  handler: async (ctx): Promise<{
    requestId: Id<"accountRequests">;
    delivery: "email" | "dev";
    devCode?: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const minted: {
      requestId: Id<"accountRequests">;
      code: string;
      requestedEmail: string;
    } = await ctx.runMutation(internal.accountRequests.remintOpenEmailChangeOtp, {
      userId,
    });
    const delivered = await deliverEmailChangeCode({
      requestedEmail: minted.requestedEmail,
      code: minted.code,
    });
    return {
      requestId: minted.requestId,
      ...delivered,
    };
  },
});

export const remintOpenEmailChangeOtp = internalMutation({
  args: { userId: v.id("users") },
  returns: mintResultValidator,
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const open = await ctx.db
      .query("accountRequests")
      .withIndex("by_userId_category", (q) =>
        q.eq("userId", user._id).eq("category", "email_change"),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    const alreadyOpen = open.find((r) => r.status === "open");
    if (!alreadyOpen?.requestedEmail) throw new Error("REQUEST_NOT_OPEN");
    const minted = await mintOtpOnEmailRequest(ctx, {
      user,
      requestedEmail: alreadyOpen.requestedEmail,
      reason: alreadyOpen.reason,
    });
    return {
      requestId: minted.requestId,
      code: minted.code,
      requestedEmail: alreadyOpen.requestedEmail,
    };
  },
});

/** Member/creator: verify OTP and rotate sign-in email (clears sessions). */
export const verifyEmailChangeOtp = mutation({
  args: { code: v.string() },
  returns: v.object({
    status: v.literal("fulfilled"),
    category: v.literal("email_change"),
  }),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (!isValidOtpCode(args.code)) throw new Error("INVALID_OTP");
    const open = await ctx.db
      .query("accountRequests")
      .withIndex("by_userId_category", (q) =>
        q.eq("userId", user._id).eq("category", "email_change"),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    const req = open.find((r) => r.status === "open");
    if (!req) throw new Error("REQUEST_NOT_OPEN");
    const now = Date.now();
    if (otpExpired(req.otpExpiresAt, now)) throw new Error("OTP_EXPIRED");
    const attempts = req.otpAttemptCount ?? 0;
    if (attempts >= OTP_MAX_ATTEMPTS) throw new Error("OTP_LOCKED");
    if (!req.otpHash || !req.otpSalt) throw new Error("OTP_MISSING");
    const ok = await otpMatches(req.otpSalt, args.code, req.otpHash);
    if (!ok) {
      await ctx.db.patch(req._id, {
        otpAttemptCount: attempts + 1,
        updatedAt: now,
      });
      throw new Error("OTP_INVALID");
    }
    await fulfillEmailChange(ctx, req);
    await ctx.db.patch(req._id, {
      status: "fulfilled",
      otpHash: undefined,
      otpSalt: undefined,
      otpExpiresAt: undefined,
      otpAttemptCount: undefined,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "accountRequests",
      documentId: req._id,
      action: "verifyEmailChangeOtp",
      actorExternalAuthId: user.externalAuthId,
    });
    return { status: "fulfilled" as const, category: "email_change" as const };
  },
});

/** Member/creator: request account deletion (admin fulfillment via resolveAdmin). */
export const requestAccountDeletion = mutation({
  args: {
    reason: v.optional(v.string()),
  },
  returns: v.id("accountRequests"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const open = await ctx.db
      .query("accountRequests")
      .withIndex("by_userId_category", (q) =>
        q.eq("userId", user._id).eq("category", "account_deletion"),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    const alreadyOpen = open.find((r) => r.status === "open");
    if (alreadyOpen) {
      throw new Error("REQUEST_ALREADY_OPEN");
    }

    const now = Date.now();
    const id = await ctx.db.insert("accountRequests", {
      userId: user._id,
      category: "account_deletion",
      reason: (args.reason ?? "Account deletion requested").trim().slice(0, 500),
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "accountRequests",
      documentId: id,
      action: "requestAccountDeletion",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
  },
});

export const listMine = query({
  args: {},
  returns: v.array(accountRequestDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const rows = await ctx.db
      .query("accountRequests")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(ADMIN_SCAN_MAX_DOCS);
    return rows.map(stripOtpFields);
  },
});

const openAdminRowValidator = v.object({
  _id: v.id("accountRequests"),
  _creationTime: v.number(),
  userId: v.id("users"),
  email: v.union(v.string(), v.null()),
  fullName: v.union(v.string(), v.null()),
  category: v.string(),
  reason: v.string(),
  requestedEmail: v.optional(v.string()),
  status: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listOpenAdmin = query({
  args: {},
  returns: v.array(openAdminRowValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const open = await ctx.db
      .query("accountRequests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(100);
    return Promise.all(
      open.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return {
          _id: row._id,
          _creationTime: row._creationTime,
          userId: row.userId,
          email: user?.email ?? null,
          fullName: user?.fullName ?? user?.name ?? null,
          category: row.category,
          reason: row.reason,
          requestedEmail: row.requestedEmail,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
    );
  },
});

/**
 * Admin: fulfill or reject an open account request.
 * Email fulfill rotates profile email + password providerAccountId (when present) and clears sessions.
 * Deletion fulfill strips auth/roles, unpublishes creator, cancels local active subs,
 * anonymizes profile, and returns `sub_*` ids for the admin client to cancel on Stripe.
 */
export const resolveAdmin = mutation({
  args: {
    requestId: v.id("accountRequests"),
    disposition: v.union(v.literal("fulfill"), v.literal("reject")),
    adminNote: v.optional(v.string()),
  },
  returns: v.object({
    status: v.union(v.literal("fulfilled"), v.literal("rejected")),
    category: v.string(),
    stripeSubscriptionIds: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND");
    if (req.status !== "open") throw new Error("REQUEST_NOT_OPEN");
    if (req.userId === admin._id) throw new Error("CANNOT_RESOLVE_OWN_REQUEST");

    const now = Date.now();
    if (args.disposition === "reject") {
      await ctx.db.patch(req._id, {
        status: "rejected",
        otpHash: undefined,
        otpSalt: undefined,
        otpExpiresAt: undefined,
        otpAttemptCount: undefined,
        updatedAt: now,
      });
      await logMutation(ctx, {
        table: "accountRequests",
        documentId: req._id,
        action: "resolveAdmin:reject",
        actorExternalAuthId: admin.externalAuthId,
      });
      return {
        status: "rejected" as const,
        category: req.category,
        stripeSubscriptionIds: [],
      };
    }

    let stripeSubscriptionIds: string[] = [];
    if (req.category === "email_change") {
      await fulfillEmailChange(ctx, req);
    } else if (req.category === "account_deletion") {
      stripeSubscriptionIds = await fulfillAccountDeletion(ctx, req);
    } else {
      throw new Error("UNSUPPORTED_CATEGORY");
    }

    const note = args.adminNote?.trim().slice(0, 500);
    await ctx.db.patch(req._id, {
      status: "fulfilled",
      otpHash: undefined,
      otpSalt: undefined,
      otpExpiresAt: undefined,
      otpAttemptCount: undefined,
      updatedAt: now,
      ...(note
        ? { reason: `${req.reason}\n[admin] ${note}`.slice(0, 1000) }
        : {}),
    });
    await logMutation(ctx, {
      table: "accountRequests",
      documentId: req._id,
      action: "resolveAdmin:fulfill",
      actorExternalAuthId: admin.externalAuthId,
    });
    return {
      status: "fulfilled" as const,
      category: req.category,
      stripeSubscriptionIds,
    };
  },
});
