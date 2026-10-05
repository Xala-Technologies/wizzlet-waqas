import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCreatorForUser, requireAdmin, requireAppUser, logMutation } from "./lib/auth";

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
    .collect();
  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
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
    .collect();
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
    emailVerificationTime: undefined,
    updatedAt: Date.now(),
  });
  await clearAuthSessions(ctx, req.userId);
}

async function fulfillAccountDeletion(ctx: MutationCtx, req: Doc<"accountRequests">) {
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
    .collect();
  for (const sub of activeSubs) {
    if (sub.status === "active" || sub.billingStatus === "cancel_pending") {
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
}

/** Member/creator: request a sign-in email change (admin fulfillment via resolveAdmin). */
export const requestEmailChange = mutation({
  args: {
    requestedEmail: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.id("accountRequests"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const requestedEmail = args.requestedEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
      throw new Error("INVALID_EMAIL");
    }
    if (user.email && user.email.trim().toLowerCase() === requestedEmail) {
      throw new Error("EMAIL_UNCHANGED");
    }

    const open = await ctx.db
      .query("accountRequests")
      .withIndex("by_userId_category", (q) =>
        q.eq("userId", user._id).eq("category", "email_change"),
      )
      .collect();
    const alreadyOpen = open.find((r) => r.status === "open");
    if (alreadyOpen) {
      throw new Error("REQUEST_ALREADY_OPEN");
    }

    const now = Date.now();
    const id = await ctx.db.insert("accountRequests", {
      userId: user._id,
      category: "email_change",
      reason: (args.reason ?? "Sign-in email change requested").trim().slice(0, 500),
      requestedEmail,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "accountRequests",
      documentId: id,
      action: "requestEmailChange",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
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
      .collect();
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
    return ctx.db
      .query("accountRequests")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
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
          ...row,
          email: user?.email ?? null,
          fullName: user?.fullName ?? user?.name ?? null,
        };
      }),
    );
  },
});

/**
 * Admin: fulfill or reject an open account request.
 * Email fulfill rotates profile email + password providerAccountId (when present) and clears sessions.
 * Deletion fulfill strips auth/roles, unpublishes creator, cancels local active subs, anonymizes profile.
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
  }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND");
    if (req.status !== "open") throw new Error("REQUEST_NOT_OPEN");
    if (req.userId === admin._id) throw new Error("CANNOT_RESOLVE_OWN_REQUEST");

    const now = Date.now();
    if (args.disposition === "reject") {
      await ctx.db.patch(req._id, { status: "rejected", updatedAt: now });
      await logMutation(ctx, {
        table: "accountRequests",
        documentId: req._id,
        action: "resolveAdmin:reject",
        actorExternalAuthId: admin.externalAuthId,
      });
      return { status: "rejected" as const, category: req.category };
    }

    if (req.category === "email_change") {
      await fulfillEmailChange(ctx, req);
    } else if (req.category === "account_deletion") {
      await fulfillAccountDeletion(ctx, req);
    } else {
      throw new Error("UNSUPPORTED_CATEGORY");
    }

    const note = args.adminNote?.trim().slice(0, 500);
    await ctx.db.patch(req._id, {
      status: "fulfilled",
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
    return { status: "fulfilled" as const, category: req.category };
  },
});
