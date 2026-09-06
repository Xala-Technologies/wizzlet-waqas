import { v } from "convex/values";

export const appRoleValidator = v.union(
  v.literal("admin"),
  v.literal("moderator"),
  v.literal("user"),
  v.literal("creator"),
  v.literal("subscriber"),
);

/** Matches `users` table documents returned from `ctx.db.get`. */
export const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  legacyId: v.optional(v.string()),
  externalAuthId: v.optional(v.string()),
  fullName: v.optional(v.string()),
  username: v.optional(v.string()),
  discordId: v.optional(v.string()),
  discordUsername: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  notificationPrefs: v.optional(v.any()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

export const userWithRolesValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  legacyId: v.optional(v.string()),
  externalAuthId: v.optional(v.string()),
  fullName: v.optional(v.string()),
  username: v.optional(v.string()),
  discordId: v.optional(v.string()),
  discordUsername: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  notificationPrefs: v.optional(v.any()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  roles: v.array(appRoleValidator),
});

export const subscriptionDocValidator = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  userId: v.id("users"),
  creatorId: v.id("creators"),
  productId: v.optional(v.id("products")),
  stripeSubscriptionId: v.optional(v.string()),
  status: v.string(),
  billingStatus: v.optional(v.string()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  amountCents: v.number(),
  platformFeeCents: v.number(),
  creatorEarningsCents: v.number(),
  feePercentage: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const subscriptionWithCreatorValidator = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  userId: v.id("users"),
  creatorId: v.id("creators"),
  productId: v.optional(v.id("products")),
  stripeSubscriptionId: v.optional(v.string()),
  status: v.string(),
  billingStatus: v.optional(v.string()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  amountCents: v.number(),
  platformFeeCents: v.number(),
  creatorEarningsCents: v.number(),
  feePercentage: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  creator: v.object({
    _id: v.id("creators"),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    monthlyPriceCents: v.optional(v.number()),
    messagingEnabled: v.boolean(),
  }),
});

export const subscriptionWithUserValidator = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  userId: v.id("users"),
  creatorId: v.id("creators"),
  productId: v.optional(v.id("products")),
  stripeSubscriptionId: v.optional(v.string()),
  status: v.string(),
  billingStatus: v.optional(v.string()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  amountCents: v.number(),
  platformFeeCents: v.number(),
  creatorEarningsCents: v.number(),
  feePercentage: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  user: v.union(
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      fullName: v.optional(v.string()),
      username: v.optional(v.string()),
    }),
    v.null(),
  ),
});

export const directMessageDocValidator = v.object({
  _id: v.id("directMessages"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  subscriberId: v.id("users"),
  senderRole: v.string(),
  body: v.string(),
  read: v.boolean(),
  createdAt: v.number(),
});

export const pickResultValidator = v.union(
  v.literal("pending"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("push"),
);

export const verificationStatusValidator = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("verified"),
);

export const creatorDocValidator = v.object({
  _id: v.id("creators"),
  _creationTime: v.number(),
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
  verificationStatus: v.optional(verificationStatusValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const creatorPublicValidator = v.object({
  _id: v.id("creators"),
  username: v.string(),
  displayName: v.optional(v.string()),
  bio: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  bannerUrl: v.optional(v.string()),
  monthlyPriceCents: v.optional(v.number()),
  isPublished: v.boolean(),
  messagingEnabled: v.boolean(),
  verificationStatus: verificationStatusValidator,
  createdAt: v.number(),
});

export const creatorDiscoveryItemValidator = v.object({
  _id: v.id("creators"),
  username: v.string(),
  displayName: v.optional(v.string()),
  bio: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  monthlyPriceCents: v.optional(v.number()),
  verificationStatus: verificationStatusValidator,
  createdAt: v.number(),
  postCount: v.number(),
});

export const creatorPublishedPageValidator = v.object({
  items: v.array(creatorDiscoveryItemValidator),
  continueCursor: v.union(v.id("creators"), v.null()),
  isDone: v.boolean(),
});

export const postDocValidator = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  title: v.string(),
  content: v.optional(v.string()),
  isPremium: v.boolean(),
  result: v.optional(pickResultValidator),
  trackingMode: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const postPreviewValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  content: v.union(v.string(), v.null()),
  isPremium: v.boolean(),
  result: v.optional(pickResultValidator),
  createdAt: v.number(),
});

export const memberFeedItemValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  content: v.union(v.string(), v.null()),
  isPremium: v.boolean(),
  result: v.optional(pickResultValidator),
  createdAt: v.number(),
  creator: v.object({
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }),
});

export const savedPostDetailedValidator = v.object({
  savedId: v.id("savedPosts"),
  savedAt: v.number(),
  post: v.object({
    _id: v.id("posts"),
    title: v.string(),
    content: v.union(v.string(), v.null()),
    isPremium: v.boolean(),
    result: v.optional(pickResultValidator),
    createdAt: v.number(),
  }),
  creator: v.object({
    _id: v.id("creators"),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }),
});

export const productDocValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
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
});

export const productPublicValidator = v.object({
  _id: v.id("products"),
  creatorId: v.id("creators"),
  name: v.string(),
  description: v.optional(v.string()),
  priceCents: v.number(),
  billingPeriod: v.string(),
  isFeatured: v.boolean(),
  isLimited: v.boolean(),
  maxSpots: v.optional(v.number()),
  isClosed: v.boolean(),
});

export const notificationDocValidator = v.object({
  _id: v.id("notifications"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  read: v.boolean(),
  link: v.optional(v.string()),
  createdAt: v.number(),
});

export const supportMessageDocValidator = v.object({
  _id: v.id("supportMessages"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  senderRole: v.string(),
  channel: v.optional(v.string()),
  body: v.string(),
  read: v.boolean(),
  createdAt: v.number(),
});

export const payoutDocValidator = v.object({
  _id: v.id("payouts"),
  _creationTime: v.number(),
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
});

export const creatorPayoutSettingsDocValidator = v.object({
  _id: v.id("creatorPayoutSettings"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  method: v.string(),
  accountLabel: v.optional(v.string()),
  schedule: v.string(),
  minimumPayoutCents: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const availableBalanceValidator = v.object({
  earnedCents: v.number(),
  reservedCents: v.number(),
  availableCents: v.number(),
});

export const resolutionCaseDocValidator = v.object({
  _id: v.id("resolutionCases"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  subject: v.string(),
  category: v.optional(v.string()),
  description: v.optional(v.string()),
  status: v.string(),
  priority: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const resolutionCaseMessageDocValidator = v.object({
  _id: v.id("resolutionCaseMessages"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  caseId: v.id("resolutionCases"),
  senderRole: v.string(),
  body: v.string(),
  createdAt: v.number(),
});

export const sportEventDocValidator = v.object({
  _id: v.id("sportEvents"),
  _creationTime: v.number(),
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
});

export const platformSettingsDocValidator = v.object({
  _id: v.id("platformSettings"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  singletonKey: v.literal("default"),
  introFeePercent: v.number(),
  standardFeePercent: v.number(),
  introFeeDays: v.number(),
  branding: v.optional(v.any()),
  payoutDefaults: v.optional(v.any()),
  featureFlags: v.optional(v.any()),
  updatedAt: v.number(),
});

export const savedPostDocValidator = v.object({
  _id: v.id("savedPosts"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  userId: v.id("users"),
  postId: v.id("posts"),
  createdAt: v.number(),
});

export const creatorBookmarkDocValidator = v.object({
  _id: v.id("creatorBookmarks"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  userId: v.id("users"),
  creatorId: v.id("creators"),
  createdAt: v.number(),
});

export const pickTrackerDocValidator = v.object({
  _id: v.id("pickTracker"),
  _creationTime: v.number(),
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
  result: pickResultValidator,
  notes: v.optional(v.string()),
  createdAt: v.number(),
});

export const analyticsEventDocValidator = v.object({
  _id: v.id("analyticsEvents"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.optional(v.id("creators")),
  postId: v.optional(v.id("posts")),
  userId: v.optional(v.id("users")),
  eventType: v.string(),
  createdAt: v.number(),
});

export const analyticsActivityItemValidator = v.object({
  _id: v.id("analyticsEvents"),
  eventType: v.string(),
  createdAt: v.number(),
  post: v.object({
    _id: v.id("posts"),
    title: v.string(),
    creator: v.union(
      v.object({
        username: v.string(),
        displayName: v.optional(v.string()),
      }),
      v.null(),
    ),
  }),
});

export const creatorEarningsValidator = v.object({
  grossCents: v.number(),
  feeCents: v.number(),
  netCents: v.number(),
  perSubCents: v.number(),
  activeCount: v.number(),
  monthly: v.array(
    v.object({
      month: v.string(),
      revenueCents: v.number(),
    }),
  ),
  recentPayments: v.array(
    v.object({
      id: v.id("paymentEvents"),
      label: v.string(),
      amountCents: v.number(),
      createdAt: v.number(),
    }),
  ),
});

export const creatorLinkDocValidator = v.object({
  _id: v.id("creatorLinks"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  name: v.string(),
  url: v.string(),
  slug: v.optional(v.string()),
  clicks: v.number(),
  conversions: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const promoCodeDocValidator = v.object({
  _id: v.id("promoCodes"),
  _creationTime: v.number(),
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
});

export const referralDocValidator = v.object({
  _id: v.id("referrals"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  creatorId: v.id("creators"),
  referredUserId: v.optional(v.id("users")),
  referredEmail: v.optional(v.string()),
  converted: v.boolean(),
  commissionEarnedCents: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const emailCampaignDocValidator = v.object({
  _id: v.id("emailCampaigns"),
  _creationTime: v.number(),
  legacyId: v.optional(v.string()),
  subject: v.string(),
  body: v.string(),
  audience: v.optional(v.string()),
  recipients: v.number(),
  status: v.string(),
  sentBy: v.optional(v.id("users")),
  createdAt: v.number(),
});

export const adminDashboardStatsValidator = v.object({
  userCount: v.number(),
  creatorCount: v.number(),
  activeSubscriptionCount: v.number(),
  totalRevenueCents: v.number(),
  platformFeesCents: v.number(),
  availableBalanceCents: v.number(),
  pendingBalanceCents: v.number(),
  paidOutCents: v.number(),
  openCases: v.number(),
  mrrCents: v.number(),
  monthly: v.array(
    v.object({
      month: v.string(),
      revenue: v.number(),
      fees: v.number(),
      creators: v.number(),
      customers: v.number(),
    }),
  ),
  recentSubs: v.array(
    v.object({
      id: v.id("subscriptions"),
      userName: v.string(),
      creatorName: v.string(),
      amountCents: v.number(),
      createdAt: v.number(),
    }),
  ),
  recentCreators: v.array(
    v.object({
      name: v.string(),
      date: v.number(),
    }),
  ),
  recentCustomers: v.array(
    v.object({
      name: v.string(),
      email: v.optional(v.string()),
      date: v.number(),
    }),
  ),
});
