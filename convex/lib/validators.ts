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
