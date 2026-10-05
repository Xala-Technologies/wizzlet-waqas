import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { ADMIN_SCAN_MAX_DOCS } from "./adminLists";

export async function takeSubsByStatus(
  ctx: QueryCtx,
  status: string,
): Promise<{ docs: Doc<"subscriptions">[]; truncated: boolean }> {
  const docs = await ctx.db
    .query("subscriptions")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(ADMIN_SCAN_MAX_DOCS);
  return { docs, truncated: docs.length >= ADMIN_SCAN_MAX_DOCS };
}

export async function takePayoutsByStatus(
  ctx: QueryCtx,
  status: string,
): Promise<{ docs: Doc<"payouts">[]; truncated: boolean }> {
  const docs = await ctx.db
    .query("payouts")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(ADMIN_SCAN_MAX_DOCS);
  return { docs, truncated: docs.length >= ADMIN_SCAN_MAX_DOCS };
}

export async function takeCasesByStatus(
  ctx: QueryCtx,
  status: string,
): Promise<{ docs: Doc<"resolutionCases">[]; truncated: boolean }> {
  const docs = await ctx.db
    .query("resolutionCases")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(ADMIN_SCAN_MAX_DOCS);
  return { docs, truncated: docs.length >= ADMIN_SCAN_MAX_DOCS };
}

export async function takeCreatorsByPublished(
  ctx: QueryCtx,
  isPublished: boolean,
): Promise<{ docs: Doc<"creators">[]; truncated: boolean }> {
  const docs = await ctx.db
    .query("creators")
    .withIndex("by_published", (q) => q.eq("isPublished", isPublished))
    .take(ADMIN_SCAN_MAX_DOCS);
  return { docs, truncated: docs.length >= ADMIN_SCAN_MAX_DOCS };
}

export async function takePaymentEventsByStatus(
  ctx: QueryCtx,
  status: string,
): Promise<{ docs: Doc<"paymentEvents">[]; truncated: boolean }> {
  const docs = await ctx.db
    .query("paymentEvents")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(ADMIN_SCAN_MAX_DOCS);
  return { docs, truncated: docs.length >= ADMIN_SCAN_MAX_DOCS };
}
