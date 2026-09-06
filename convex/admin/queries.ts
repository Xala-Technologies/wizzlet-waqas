import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../lib/auth";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("users").collect();
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const creators = await ctx.db.query("creators").collect();
    const subs = await ctx.db.query("subscriptions").collect();
    const payouts = await ctx.db.query("payouts").collect();
    const cases = await ctx.db.query("resolutionCases").collect();
    const active = subs.filter((s) => s.status === "active");
    const paidOutCents = payouts
      .filter((p) => p.status === "completed")
      .reduce((a, b) => a + b.amountCents, 0);
    const openCases = cases.filter(
      (c) => c.status === "open" || c.status === "pending" || c.status === "in_progress",
    ).length;

    const platformFeesCents = active.reduce((a, b) => a + b.platformFeeCents, 0);
    const totalRevenueCents = active.reduce((a, b) => a + b.amountCents, 0);

    // Build month buckets from real subscription createdAt
    const monthMap = new Map<string, { revenue: number; fees: number; creators: number; customers: number }>();
    for (const s of subs) {
      const key = new Date(s.createdAt).toLocaleString("en-US", { month: "short" });
      const cur = monthMap.get(key) ?? { revenue: 0, fees: 0, creators: 0, customers: 0 };
      cur.revenue += s.amountCents;
      cur.fees += s.platformFeeCents;
      monthMap.set(key, cur);
    }
    for (const c of creators) {
      const key = new Date(c.createdAt).toLocaleString("en-US", { month: "short" });
      const cur = monthMap.get(key) ?? { revenue: 0, fees: 0, creators: 0, customers: 0 };
      cur.creators += 1;
      monthMap.set(key, cur);
    }
    for (const u of users) {
      const key = new Date(u.createdAt ?? u._creationTime).toLocaleString("en-US", { month: "short" });
      const cur = monthMap.get(key) ?? { revenue: 0, fees: 0, creators: 0, customers: 0 };
      cur.customers += 1;
      monthMap.set(key, cur);
    }
    const monthly = [...monthMap.entries()].map(([month, v]) => ({
      month,
      revenue: Math.round(v.revenue / 100),
      fees: Math.round(v.fees / 100),
      creators: v.creators,
      customers: v.customers,
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
    };
  },
});

export const createEmailCampaign = mutation({
  args: {
    subject: v.string(),
    body: v.string(),
    audience: v.optional(v.string()),
    recipientUserIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const campaignId = await ctx.db.insert("emailCampaigns", {
      subject: args.subject,
      body: args.body,
      audience: args.audience,
      recipients: args.recipientUserIds.length,
      status: "sent",
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
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("emailCampaigns").collect();
  },
});
