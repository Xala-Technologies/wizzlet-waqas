import { action } from "../_generated/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";

type ReportBundle = {
  creators: Array<{
    _id: Id<"creators">;
    displayName: string | null;
    username: string | null;
    isPublished: boolean;
    monthlyPriceCents: number | null;
    createdAt: number;
  }>;
  users: Array<{
    _id: Id<"users">;
    fullName: string | null;
    username?: string;
    email?: string;
    createdAt: number | null;
  }>;
  subscriptions: Array<{
    _id: Id<"subscriptions">;
    userId: Id<"users">;
    creatorId: Id<"creators">;
    status: string;
    amountCents: number;
    platformFeeCents: number;
    creatorEarningsCents: number;
    feePercentage: number;
    createdAt: number;
  }>;
  payouts: Array<{
    _id: Id<"payouts">;
    creatorId: Id<"creators">;
    amountCents: number;
    status: string;
    method: string | null;
    reference: string | null;
    processedAt: number | null;
    createdAt: number;
  }>;
  truncated: boolean;
  listLimit: number;
};

/** Server-side report bundle for Admin Reports CSV (O2). */
export const exportReportBundle = action({
  args: {},
  returns: v.object({
    creators: v.array(
      v.object({
        _id: v.id("creators"),
        displayName: v.union(v.string(), v.null()),
        username: v.union(v.string(), v.null()),
        isPublished: v.boolean(),
        monthlyPriceCents: v.union(v.number(), v.null()),
        createdAt: v.number(),
      }),
    ),
    users: v.array(
      v.object({
        _id: v.id("users"),
        fullName: v.union(v.string(), v.null()),
        username: v.optional(v.string()),
        email: v.optional(v.string()),
        createdAt: v.union(v.number(), v.null()),
      }),
    ),
    subscriptions: v.array(
      v.object({
        _id: v.id("subscriptions"),
        userId: v.id("users"),
        creatorId: v.id("creators"),
        status: v.string(),
        amountCents: v.number(),
        platformFeeCents: v.number(),
        creatorEarningsCents: v.number(),
        feePercentage: v.number(),
        createdAt: v.number(),
      }),
    ),
    payouts: v.array(
      v.object({
        _id: v.id("payouts"),
        creatorId: v.id("creators"),
        amountCents: v.number(),
        status: v.string(),
        method: v.union(v.string(), v.null()),
        reference: v.union(v.string(), v.null()),
        processedAt: v.union(v.number(), v.null()),
        createdAt: v.number(),
      }),
    ),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx): Promise<ReportBundle> => {
    return await ctx.runQuery(api.admin.snapshots.reportSourceData, {});
  },
});
