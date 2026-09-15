import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { AppRole } from "../lib/auth";
import { dollarsToCents } from "../lib/money";
import { normalizePickResult } from "../lib/results";

function assertMigrationSecret(secret: string) {
  const expected = process.env.MIGRATION_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("FORBIDDEN_MIGRATION");
  }
}

function ts(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return Date.now();
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : Date.now();
}

/** Strict timestamp for quarantine-aware imports. */
function parseTsOrQuarantine(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : null;
}

/** Batch upsert users — ETL only. */
export const importUsers = internalMutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        externalAuthId: v.string(),
        email: v.string(),
        fullName: v.optional(v.string()),
        username: v.optional(v.string()),
        createdAt: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    for (const row of args.rows) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", row.legacyId))
        .unique();
      const now = Date.now();
      if (existing) {
        await ctx.db.patch(existing._id, {
          externalAuthId: row.externalAuthId,
          email: row.email,
          fullName: row.fullName,
          username: row.username,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("users", {
          legacyId: row.legacyId,
          externalAuthId: row.externalAuthId,
          email: row.email,
          fullName: row.fullName,
          username: row.username,
          createdAt: ts(row.createdAt),
          updatedAt: now,
        });
      }
      n++;
    }
    return { imported: n };
  },
});

export const importRoles = internalMutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        authUserId: v.string(),
        role: v.string(),
        createdAt: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    let skipped = 0;
    for (const row of args.rows) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_externalAuthId", (q) => q.eq("externalAuthId", row.authUserId))
        .unique();
      if (!user) {
        skipped++;
        continue;
      }
      const existing = await ctx.db
        .query("userRoles")
        .withIndex("by_userId_role", (q) =>
          q.eq("userId", user._id).eq("role", row.role as AppRole),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { legacyId: row.legacyId });
      } else {
        await ctx.db.insert("userRoles", {
          legacyId: row.legacyId,
          userId: user._id,
          role: row.role as AppRole,
          createdAt: ts(row.createdAt),
        });
      }
      n++;
    }
    return { imported: n, skipped };
  },
});

export const importCreators = internalMutation({
  args: {
    secret: v.string(),
    rows: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    let skipped = 0;
    for (const raw of args.rows) {
      const row = raw as Record<string, unknown>;
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.user_id)))
        .unique();
      if (!user) {
        // Try auth_id path if user_id was somehow auth uid (shouldn't be)
        skipped++;
        continue;
      }
      const legacyId = String(row.id);
      const existing = await ctx.db
        .query("creators")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
        .unique();
      const now = Date.now();
      const fields = {
        userId: user._id,
        username: String(row.username ?? ""),
        displayName: (row.display_name as string) || undefined,
        bio: (row.bio as string) || undefined,
        avatarUrl: (row.avatar_url as string) || undefined,
        bannerUrl: (row.banner_url as string) || undefined,
        monthlyPriceCents: dollarsToCents(row.monthly_price as number),
        stripeAccountId: (row.stripe_account_id as string) || undefined,
        isPublished: Boolean(row.is_published),
        referralCode: (row.referral_code as string) || undefined,
        messagingEnabled: row.messaging_enabled !== false,
        updatedAt: now,
      };
      if (existing) await ctx.db.patch(existing._id, fields);
      else
        await ctx.db.insert("creators", {
          legacyId,
          ...fields,
          createdAt: ts(row.created_at as string),
        });
      n++;
    }
    return { imported: n, skipped };
  },
});

export const importProducts = internalMutation({
  args: { secret: v.string(), rows: v.array(v.any()) },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    let skipped = 0;
    for (const raw of args.rows) {
      const row = raw as Record<string, unknown>;
      const creator = await ctx.db
        .query("creators")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.creator_id)))
        .unique();
      if (!creator) {
        skipped++;
        continue;
      }
      const legacyId = String(row.id);
      const existing = await ctx.db
        .query("creators")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
        .unique();
      void existing;
      const productExisting = await ctx.db
        .query("products")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
        .unique();
      const now = Date.now();
      const fields = {
        creatorId: creator._id,
        name: String(row.name ?? ""),
        description: (row.description as string) || undefined,
        priceCents: dollarsToCents(row.price as number),
        billingPeriod: String(row.billing_period ?? "month"),
        isFeatured: Boolean(row.is_featured),
        isActive: row.is_active !== false,
        maxSpots: row.max_spots != null ? Number(row.max_spots) : undefined,
        isLimited: Boolean(row.is_limited),
        isClosed: Boolean(row.is_closed),
        updatedAt: now,
      };
      if (productExisting) await ctx.db.patch(productExisting._id, fields);
      else
        await ctx.db.insert("products", {
          legacyId,
          ...fields,
          createdAt: ts(row.created_at as string),
        });
      n++;
    }
    return { imported: n, skipped };
  },
});

export const importPosts = internalMutation({
  args: { secret: v.string(), rows: v.array(v.any()) },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    let skipped = 0;
    for (const raw of args.rows) {
      const row = raw as Record<string, unknown>;
      const creator = await ctx.db
        .query("creators")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.creator_id)))
        .unique();
      if (!creator) {
        skipped++;
        continue;
      }
      const legacyId = String(row.id);
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
        .unique();
      const now = Date.now();
      const fields = {
        creatorId: creator._id,
        title: String(row.title ?? ""),
        content: (row.content as string) || undefined,
        isPremium: Boolean(row.is_premium),
        result: (() => {
          try {
            return normalizePickResult(String(row.result ?? "pending"));
          } catch {
            return "pending" as const;
          }
        })(),
        trackingMode: (row.tracking_mode as string) || undefined,
        updatedAt: now,
      };
      if (existing) await ctx.db.patch(existing._id, fields);
      else
        await ctx.db.insert("posts", {
          legacyId,
          ...fields,
          createdAt: ts(row.created_at as string),
        });
      n++;
    }
    return { imported: n, skipped };
  },
});

export const importSubscriptions = internalMutation({
  args: { secret: v.string(), rows: v.array(v.any()) },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    let skipped = 0;
    let quarantined = 0;
    for (const raw of args.rows) {
      const row = raw as Record<string, unknown>;
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.user_id)))
        .unique();
      const creator = await ctx.db
        .query("creators")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.creator_id)))
        .unique();
      if (!user || !creator) {
        skipped++;
        continue;
      }
      const statusRaw = row.status;
      if (statusRaw == null || statusRaw === "") {
        quarantined++;
        continue;
      }
      const status = String(statusRaw).toLowerCase().trim();
      const allowed = new Set(["active", "cancelled", "canceled", "past_due", "incomplete"]);
      if (!allowed.has(status)) {
        quarantined++;
        continue;
      }
      const normalizedStatus = status === "canceled" ? "cancelled" : status;
      const createdAt = parseTsOrQuarantine(row.created_at);
      if (row.created_at != null && row.created_at !== "" && createdAt == null) {
        quarantined++;
        continue;
      }
      const legacyId = String(row.id);
      const existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
        .unique();
      const now = Date.now();
      const fields = {
        userId: user._id,
        creatorId: creator._id,
        stripeSubscriptionId: (row.stripe_subscription_id as string) || undefined,
        status: normalizedStatus,
        amountCents: dollarsToCents(row.amount as number),
        platformFeeCents: dollarsToCents(row.platform_fee as number),
        creatorEarningsCents: dollarsToCents(row.creator_earnings as number),
        feePercentage: Number(row.fee_percentage ?? 10),
        updatedAt: now,
      };
      if (existing) await ctx.db.patch(existing._id, fields);
      else
        await ctx.db.insert("subscriptions", {
          legacyId,
          ...fields,
          createdAt: createdAt ?? now,
        });
      n++;
    }
    return { imported: n, skipped, quarantined };
  },
});

export const importGenericByUserAuthOrLegacy = internalMutation({
  args: {
    secret: v.string(),
    table: v.union(
      v.literal("pickTracker"),
      v.literal("notifications"),
      v.literal("savedPosts"),
      v.literal("creatorBookmarks"),
      v.literal("analyticsEvents"),
    ),
    rows: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    let n = 0;
    let skipped = 0;
    for (const raw of args.rows) {
      const row = raw as Record<string, unknown>;
      const legacyId = String(row.id);
      const userIdRaw = String(row.user_id ?? "");
      const user =
        (await ctx.db
          .query("users")
          .withIndex("by_legacyId", (q) => q.eq("legacyId", userIdRaw))
          .unique()) ||
        (await ctx.db
          .query("users")
          .withIndex("by_externalAuthId", (q) => q.eq("externalAuthId", userIdRaw))
          .unique());
      if (!user && args.table !== "analyticsEvents") {
        skipped++;
        continue;
      }

      if (args.table === "pickTracker" && user) {
        const existing = await ctx.db
          .query("pickTracker")
          .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
          .unique();
        const fields = {
          userId: user._id,
          date: String(row.date ?? ""),
          pickEvent: String(row.pick_event ?? ""),
          sport: String(row.sport ?? "Other"),
          odds: (row.odds as string) || undefined,
          euOdds: row.eu_odds != null ? Number(row.eu_odds) : undefined,
          usOdds: (row.us_odds as string) || undefined,
          unitsRisked: Number(row.units_risked ?? 1),
          unitsWonLost: row.units_won_lost != null ? Number(row.units_won_lost) : undefined,
          result: (() => {
            try {
              return normalizePickResult(String(row.result ?? "pending"));
            } catch {
              return "pending" as const;
            }
          })(),
          notes: (row.notes as string) || undefined,
        };
        if (existing) await ctx.db.patch(existing._id, fields);
        else
          await ctx.db.insert("pickTracker", {
            legacyId,
            ...fields,
            createdAt: ts(row.created_at as string),
          });
        n++;
      } else if (args.table === "notifications" && user) {
        const existing = await ctx.db
          .query("notifications")
          .withIndex("by_legacyId", (q) => q.eq("legacyId", legacyId))
          .unique();
        const fields = {
          userId: user._id,
          type: String(row.type ?? "info"),
          title: String(row.title ?? ""),
          description: (row.description as string) || undefined,
          read: Boolean(row.read),
          link: (row.link as string) || undefined,
        };
        if (existing) await ctx.db.patch(existing._id, fields);
        else
          await ctx.db.insert("notifications", {
            legacyId,
            ...fields,
            createdAt: ts(row.created_at as string),
          });
        n++;
      } else if (args.table === "analyticsEvents") {
        let creatorId: Id<"creators"> | undefined;
        let postId: Id<"posts"> | undefined;
        if (row.creator_id) {
          const c = await ctx.db
            .query("creators")
            .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.creator_id)))
            .unique();
          creatorId = c?._id;
        }
        if (row.post_id) {
          const p = await ctx.db
            .query("posts")
            .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.post_id)))
            .unique();
          postId = p?._id;
        }
        await ctx.db.insert("analyticsEvents", {
          legacyId,
          userId: user?._id,
          creatorId,
          postId,
          eventType: String(row.event_type ?? "unknown"),
          createdAt: ts(row.created_at as string),
        });
        n++;
      } else if (args.table === "savedPosts" && user) {
        const post = await ctx.db
          .query("posts")
          .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.post_id)))
          .unique();
        if (!post) {
          skipped++;
          continue;
        }
        const existing = await ctx.db
          .query("savedPosts")
          .withIndex("by_userId_postId", (q) => q.eq("userId", user._id).eq("postId", post._id))
          .unique();
        if (!existing) {
          await ctx.db.insert("savedPosts", {
            legacyId,
            userId: user._id,
            postId: post._id,
            createdAt: ts(row.created_at as string),
          });
        }
        n++;
      } else if (args.table === "creatorBookmarks" && user) {
        const creator = await ctx.db
          .query("creators")
          .withIndex("by_legacyId", (q) => q.eq("legacyId", String(row.creator_id)))
          .unique();
        if (!creator) {
          skipped++;
          continue;
        }
        const existing = await ctx.db
          .query("creatorBookmarks")
          .withIndex("by_userId_creatorId", (q) =>
            q.eq("userId", user._id).eq("creatorId", creator._id),
          )
          .unique();
        if (!existing) {
          await ctx.db.insert("creatorBookmarks", {
            legacyId,
            userId: user._id,
            creatorId: creator._id,
            createdAt: ts(row.created_at as string),
          });
        }
        n++;
      }
    }
    return { imported: n, skipped };
  },
});

export const seedPlatformSettings = internalMutation({
  args: {
    secret: v.string(),
    introFeePercent: v.optional(v.number()),
    standardFeePercent: v.optional(v.number()),
    introFeeDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    const fields = {
      introFeePercent: args.introFeePercent ?? 5,
      standardFeePercent: args.standardFeePercent ?? 10,
      introFeeDays: args.introFeeDays ?? 90,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return ctx.db.insert("platformSettings", {
      singletonKey: "default",
      ...fields,
    });
  },
});

export const importPlatformSettings = internalMutation({
  args: { secret: v.string(), row: v.any() },
  handler: async (ctx, args) => {
    assertMigrationSecret(args.secret);
    const row = args.row as Record<string, unknown>;
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    const fields = {
      introFeePercent: Number(row.intro_fee_percent ?? row.introFeePercent ?? 5),
      standardFeePercent: Number(row.standard_fee_percent ?? row.standardFeePercent ?? 10),
      introFeeDays: Number(row.intro_fee_days ?? row.introFeeDays ?? 90),
      branding: row.branding,
      payoutDefaults: row.payout_defaults ?? row.payoutDefaults,
      featureFlags: row.feature_flags ?? row.featureFlags,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return ctx.db.insert("platformSettings", { singletonKey: "default", ...fields });
  },
});
