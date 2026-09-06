import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import {
  ADMIN_SCAN_MAX_DOCS,
  adminScanAll,
  adminTakeNewest,
} from "../lib/adminLists";
import { isPaidOutPayoutStatus } from "../lib/payoutBalance";
import {
  adminDashboardStatsValidator,
  emailCampaignDocValidator,
  userDocValidator,
} from "../lib/validators";

export const listUsers = query({
  args: {},
  returns: v.array(userDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return adminTakeNewest(ctx, "users");
  },
});

export const dashboardStats = query({
  args: {},
  returns: adminDashboardStatsValidator,
  handler: async (ctx) => {
    await requireAdmin(ctx);
    // Sequential takes — Convex forbids multiple `.paginate()` calls in one function;
    // `.take()` is safe across tables, but keep scans sequential for clearer failure modes.
    const usersScan = await adminScanAll(ctx, "users");
    const creatorsScan = await adminScanAll(ctx, "creators");
    const subsScan = await adminScanAll(ctx, "subscriptions");
    const payoutsScan = await adminScanAll(ctx, "payouts");
    const casesScan = await adminScanAll(ctx, "resolutionCases");
    const eventsScan = await adminScanAll(ctx, "paymentEvents");

    const users = usersScan.docs;
    const creators = creatorsScan.docs;
    const subs = subsScan.docs;
    const payouts = payoutsScan.docs;
    const cases = casesScan.docs;
    const events = eventsScan.docs;
    const truncated =
      usersScan.truncated ||
      creatorsScan.truncated ||
      subsScan.truncated ||
      payoutsScan.truncated ||
      casesScan.truncated ||
      eventsScan.truncated;

    const active = subs.filter((s) => s.status === "active");
    const paidOutCents = payouts
      .filter((p) => isPaidOutPayoutStatus(p.status))
      .reduce((a, b) => a + b.amountCents, 0);
    const openCases = cases.filter(
      (c) => c.status === "open" || c.status === "pending" || c.status === "in_progress",
    ).length;

    const platformFeesCents = active.reduce((a, b) => a + b.platformFeeCents, 0);
    const totalRevenueCents = active.reduce((a, b) => a + b.amountCents, 0);

    const monthMap = new Map<
      string,
      { revenue: number; fees: number; creators: number; customers: number }
    >();
    for (const e of events) {
      if (e.paymentMode === "sandbox") continue;
      const d = new Date(e.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const cur = monthMap.get(key) ?? { revenue: 0, fees: 0, creators: 0, customers: 0 };
      cur.revenue += e.amountCents;
      cur.fees += e.platformFeeCents;
      monthMap.set(key, cur);
    }
    for (const c of creators) {
      const d = new Date(c.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const cur = monthMap.get(key) ?? { revenue: 0, fees: 0, creators: 0, customers: 0 };
      cur.creators += 1;
      monthMap.set(key, cur);
    }
    for (const u of users) {
      const ts = u.createdAt ?? u._creationTime;
      const d = new Date(ts);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const cur = monthMap.get(key) ?? { revenue: 0, fees: 0, creators: 0, customers: 0 };
      cur.customers += 1;
      monthMap.set(key, cur);
    }
    const monthly = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => ({
        month,
        revenue: Math.round(row.revenue / 100),
        fees: Math.round(row.fees / 100),
        creators: row.creators,
        customers: row.customers,
      }));

    const recentSubsRaw = [...subs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    const recentSubs = [];
    for (const s of recentSubsRaw) {
      const u = await ctx.db.get(s.userId);
      const c = await ctx.db.get(s.creatorId);
      recentSubs.push({
        id: s._id,
        userName: u?.fullName ?? u?.email ?? "Unknown",
        creatorName: c?.displayName ?? (c ? `@${c.username}` : "Unknown"),
        amountCents: s.amountCents,
        createdAt: s.createdAt,
      });
    }

    const recentCreators = [...creators]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((c) => ({
        name: c.displayName ?? `@${c.username}`,
        date: c.createdAt,
      }));

    const recentCustomers = [...users]
      .sort((a, b) => (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime))
      .slice(0, 5)
      .map((u) => ({
        name: u.fullName ?? "Unknown",
        email: u.email,
        date: u.createdAt ?? u._creationTime,
      }));

    return {
      userCount: users.length,
      creatorCount: creators.length,
      activeSubscriptionCount: active.length,
      totalRevenueCents,
      platformFeesCents,
      availableBalanceCents: Math.round(platformFeesCents * 0.85),
      pendingBalanceCents: Math.round(platformFeesCents * 0.15),
      paidOutCents,
      openCases,
      mrrCents: totalRevenueCents,
      monthly,
      recentSubs,
      recentCreators,
      recentCustomers,
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});

const announcementAudienceValidator = v.union(
  v.literal("all"),
  v.literal("active"),
  v.literal("canceled"),
  v.literal("specific"),
);

async function resolveAnnouncementRecipients(
  ctx: QueryCtx | MutationCtx,
  audience: "all" | "active" | "canceled" | "specific",
  creatorId: Id<"creators"> | undefined,
): Promise<{ ids: Id<"users">[]; truncated: boolean; label: string }> {
  const usersScan = await adminScanAll(ctx, "users");
  const subsScan = await adminScanAll(ctx, "subscriptions");
  const truncated = usersScan.truncated || subsScan.truncated;
  const activeUsers = new Set(
    subsScan.docs.filter((s) => s.status === "active").map((s) => s.userId),
  );

  if (audience === "all") {
    return {
      ids: usersScan.docs.map((u) => u._id),
      truncated,
      label: "All Customers",
    };
  }
  if (audience === "active") {
    return {
      ids: [...activeUsers],
      truncated,
      label: "Active Subscribers",
    };
  }
  if (audience === "canceled") {
    const canceled = [
      ...new Set(
        subsScan.docs
          .filter((s) => s.status !== "active" && !activeUsers.has(s.userId))
          .map((s) => s.userId),
      ),
    ];
    return { ids: canceled, truncated, label: "Canceled Subscribers" };
  }
  if (!creatorId) {
    return { ids: [], truncated, label: "Customers of creator" };
  }
  const creator = await ctx.db.get(creatorId);
  const label = `Customers of ${creator?.displayName || creator?.username || "creator"}`;
  const ids = [
    ...new Set(
      subsScan.docs
        .filter((s) => s.creatorId === creatorId && s.status === "active")
        .map((s) => s.userId),
    ),
  ];
  return { ids, truncated, label };
}

/** Preview recipient count without shipping full ID lists to the client. */
export const previewAnnouncementAudience = query({
  args: {
    audience: announcementAudienceValidator,
    creatorId: v.optional(v.id("creators")),
  },
  returns: v.object({
    count: v.number(),
    label: v.string(),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const resolved = await resolveAnnouncementRecipients(
      ctx,
      args.audience,
      args.creatorId,
    );
    return {
      count: resolved.ids.length,
      label: resolved.label,
      truncated: resolved.truncated,
    };
  },
});

/** Resolve audience server-side and deliver in-app announcements. */
export const sendAnnouncement = mutation({
  args: {
    subject: v.string(),
    body: v.string(),
    audience: announcementAudienceValidator,
    creatorId: v.optional(v.id("creators")),
  },
  returns: v.object({
    campaignId: v.id("emailCampaigns"),
    recipients: v.number(),
  }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.audience === "specific" && !args.creatorId) {
      throw new Error("Select a creator for this audience");
    }
    const resolved = await resolveAnnouncementRecipients(
      ctx,
      args.audience,
      args.creatorId,
    );
    if (resolved.ids.length === 0) {
      throw new Error("No customers match this audience");
    }
    const campaignId = await ctx.db.insert("emailCampaigns", {
      subject: args.subject,
      body: args.body,
      audience: resolved.label,
      recipients: resolved.ids.length,
      status: "in_app_announcement",
      sentBy: admin._id,
      createdAt: Date.now(),
    });
    for (const userId of resolved.ids) {
      await ctx.db.insert("notifications", {
        userId,
        type: "announcement",
        title: args.subject,
        description: args.body.slice(0, 400),
        read: false,
        createdAt: Date.now(),
      });
    }
    return { campaignId, recipients: resolved.ids.length };
  },
});

/** @deprecated Prefer sendAnnouncement — kept for older clients. */
export const createEmailCampaign = mutation({
  args: {
    subject: v.string(),
    body: v.string(),
    audience: v.optional(v.string()),
    recipientUserIds: v.array(v.id("users")),
  },
  returns: v.id("emailCampaigns"),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const campaignId = await ctx.db.insert("emailCampaigns", {
      subject: args.subject,
      body: args.body,
      audience: args.audience,
      recipients: args.recipientUserIds.length,
      status: "in_app_announcement",
      sentBy: admin._id,
      createdAt: Date.now(),
    });
    for (const userId of args.recipientUserIds) {
      await ctx.db.insert("notifications", {
        userId,
        type: "announcement",
        title: args.subject,
        description: args.body.slice(0, 400),
        read: false,
        createdAt: Date.now(),
      });
    }
    return campaignId;
  },
});

export const listCampaigns = query({
  args: {},
  returns: v.array(emailCampaignDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return adminTakeNewest(ctx, "emailCampaigns");
  },
});
