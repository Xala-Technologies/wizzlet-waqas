import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const appRole = v.union(
  v.literal("admin"),
  v.literal("moderator"),
  v.literal("user"),
  v.literal("creator"),
  v.literal("subscriber"),
);

/** Canonical pick/post result vocabulary (normalize win/loss → won/lost). */
const pickResult = v.union(
  v.literal("pending"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("push"),
);

const verificationStatus = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("verified"),
);

export default defineSchema({
  ...authTables,

  /** App users — extends Convex Auth users table with product fields. */
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    legacyId: v.optional(v.string()),
    /** Legacy Supabase auth uid — optional during migration/ETL only. */
    externalAuthId: v.optional(v.string()),
    fullName: v.optional(v.string()),
    username: v.optional(v.string()),
    discordId: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    notificationPrefs: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_externalAuthId", ["externalAuthId"])
    .index("by_legacyId", ["legacyId"])
    .index("by_username", ["username"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  userRoles: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    role: appRole,
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_role", ["userId", "role"])
    .index("by_legacyId", ["legacyId"]),

  creators: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    monthlyPriceCents: v.optional(v.number()),
    stripeAccountId: v.optional(v.string()),
    isPublished: v.boolean(),
    discordServerId: v.optional(v.string()),
    discordRoleId: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    messagingEnabled: v.boolean(),
    verificationStatus: v.optional(verificationStatus),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"])
    .index("by_legacyId", ["legacyId"])
    .index("by_published", ["isPublished"])
    .index("by_referralCode", ["referralCode"]),

  products: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    name: v.string(),
    description: v.optional(v.string()),
    priceCents: v.number(),
    billingPeriod: v.string(),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    maxSpots: v.optional(v.number()),
    isLimited: v.boolean(),
    isClosed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_creatorId_active", ["creatorId", "isActive"])
    .index("by_legacyId", ["legacyId"]),

  posts: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    title: v.string(),
    content: v.optional(v.string()),
    isPremium: v.boolean(),
    result: v.optional(pickResult),
    trackingMode: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_creatorId_createdAt", ["creatorId", "createdAt"])
    .index("by_legacyId", ["legacyId"]),

  subscriptions: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.string(),
    /** Distinct from access: active | past_due | canceled | unpaid | incomplete */
    billingStatus: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amountCents: v.number(),
    platformFeeCents: v.number(),
    creatorEarningsCents: v.number(),
    feePercentage: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_userId_creatorId", ["userId", "creatorId"])
    .index("by_productId", ["productId"])
    .index("by_status", ["status"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_legacyId", ["legacyId"]),

  analyticsEvents: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.optional(v.id("creators")),
    postId: v.optional(v.id("posts")),
    userId: v.optional(v.id("users")),
    eventType: v.string(),
    createdAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_userId", ["userId"])
    .index("by_legacyId", ["legacyId"]),

  pickTracker: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    postId: v.optional(v.id("posts")),
    date: v.string(),
    pickEvent: v.string(),
    sport: v.string(),
    odds: v.optional(v.string()),
    euOdds: v.optional(v.number()),
    usOdds: v.optional(v.string()),
    unitsRisked: v.number(),
    unitsWonLost: v.optional(v.number()),
    result: pickResult,
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_postId", ["postId"])
    .index("by_legacyId", ["legacyId"]),

  /** Ledger for creator earnings / admin finance (replaces fake payment lists). */
  paymentEvents: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    userId: v.optional(v.id("users")),
    subscriptionId: v.optional(v.id("subscriptions")),
    productId: v.optional(v.id("products")),
    type: v.string(), // subscription_charge | refund | adjustment | payout | renewal
    amountCents: v.number(),
    platformFeeCents: v.number(),
    creatorEarningsCents: v.number(),
    currency: v.string(),
    status: v.string(),
    /** Delivery/event id (webhook) or legacy key — not the commercial identity alone */
    externalRef: v.optional(v.string()),
    /** Stable commerce identity: checkout session id or invoice id */
    commercialRef: v.optional(v.string()),
    checkoutSessionId: v.optional(v.string()),
    /** test | live — exclude sandbox/test from real payouts */
    paymentMode: v.optional(v.union(v.literal("test"), v.literal("live"), v.literal("sandbox"))),
    createdAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_userId", ["userId"])
    .index("by_subscriptionId", ["subscriptionId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_legacyId", ["legacyId"])
    .index("by_externalRef", ["externalRef"])
    .index("by_commercialRef", ["commercialRef"])
    .index("by_checkoutSessionId", ["checkoutSessionId"]),

  /** Stripe (or other) webhook delivery receipts — separate from financial ledger. */
  webhookReceipts: defineTable({
    provider: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    processingState: v.union(
      v.literal("processed"),
      v.literal("failed"),
      v.literal("ignored"),
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_provider_eventId", ["provider", "eventId"]),

  /** Admin-managed sports slate (replaces hardcoded src/lib/events.ts). */
  sportEvents: defineTable({
    legacyId: v.optional(v.string()),
    sport: v.string(),
    league: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startsAt: v.number(),
    status: v.string(),
    homeOdds: v.optional(v.number()),
    awayOdds: v.optional(v.number()),
    drawOdds: v.optional(v.number()),
    priority: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_startsAt", ["startsAt"])
    .index("by_published_startsAt", ["isPublished", "startsAt"])
    .index("by_legacyId", ["legacyId"]),

  notifications: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    read: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"])
    .index("by_legacyId", ["legacyId"]),

  savedPosts: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_postId", ["userId", "postId"])
    .index("by_legacyId", ["legacyId"]),

  creatorBookmarks: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.id("users"),
    creatorId: v.id("creators"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_creatorId", ["userId", "creatorId"])
    .index("by_legacyId", ["legacyId"]),

  payouts: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    amountCents: v.number(),
    status: v.string(),
    method: v.optional(v.string()),
    reference: v.optional(v.string()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_status", ["status"])
    .index("by_legacyId", ["legacyId"]),

  creatorLinks: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    name: v.string(),
    url: v.string(),
    slug: v.optional(v.string()),
    clicks: v.number(),
    conversions: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_legacyId", ["legacyId"]),

  promoCodes: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    code: v.string(),
    discountPercent: v.number(),
    maxUses: v.optional(v.number()),
    usedCount: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_code", ["code"])
    .index("by_legacyId", ["legacyId"]),

  referrals: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    referredUserId: v.optional(v.id("users")),
    referredEmail: v.optional(v.string()),
    converted: v.boolean(),
    commissionEarnedCents: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_legacyId", ["legacyId"]),

  creatorPayoutSettings: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    method: v.string(),
    accountLabel: v.optional(v.string()),
    schedule: v.string(),
    minimumPayoutCents: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_legacyId", ["legacyId"]),

  resolutionCases: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    subject: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_status", ["status"])
    .index("by_legacyId", ["legacyId"]),

  resolutionCaseMessages: defineTable({
    legacyId: v.optional(v.string()),
    caseId: v.id("resolutionCases"),
    senderRole: v.string(),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_caseId", ["caseId"])
    .index("by_legacyId", ["legacyId"]),

  supportMessages: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    senderRole: v.string(),
    channel: v.optional(v.string()),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_legacyId", ["legacyId"]),

  platformSettings: defineTable({
    legacyId: v.optional(v.string()),
    singletonKey: v.literal("default"),
    introFeePercent: v.number(),
    standardFeePercent: v.number(),
    introFeeDays: v.number(),
    branding: v.optional(v.any()),
    payoutDefaults: v.optional(v.any()),
    featureFlags: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_singletonKey", ["singletonKey"]),

  directMessages: defineTable({
    legacyId: v.optional(v.string()),
    creatorId: v.id("creators"),
    subscriberId: v.id("users"),
    senderRole: v.string(),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_subscriberId", ["subscriberId"])
    .index("by_creatorId_subscriberId", ["creatorId", "subscriberId"])
    .index("by_legacyId", ["legacyId"]),

  emailCampaigns: defineTable({
    legacyId: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    audience: v.optional(v.string()),
    recipients: v.number(),
    status: v.string(),
    sentBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_legacyId", ["legacyId"]),

  /** Uploaded file ownership metadata */
  fileAssets: defineTable({
    storageId: v.id("_storage"),
    ownerUserId: v.id("users"),
    purpose: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_storageId", ["storageId"])
    .index("by_ownerUserId", ["ownerUserId"]),

  /** ETL checkpoints — not product data */
  migrationCheckpoints: defineTable({
    table: v.string(),
    lastProcessedLegacyId: v.optional(v.string()),
    processedCount: v.number(),
    successCount: v.number(),
    failureCount: v.number(),
    migrationVersion: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_table", ["table"]),

  /** Correlates writes during Convex-primary for rollback */
  mutationLog: defineTable({
    table: v.string(),
    documentId: v.string(),
    legacyId: v.optional(v.string()),
    action: v.string(),
    actorExternalAuthId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
