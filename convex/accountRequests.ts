import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAppUser, logMutation } from "./lib/auth";

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

/** Member/creator: request a sign-in email change (manual fulfillment). */
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

export const listOpenAdmin = query({
  args: {},
  returns: v.array(accountRequestDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const open = await ctx.db
      .query("accountRequests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(100);
    return open;
  },
});
