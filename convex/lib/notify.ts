import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/** Users who currently hold a given role (e.g. all admins). */
export async function listUserIdsWithRole(
  ctx: Ctx,
  role: "admin" | "moderator" | "user" | "creator" | "subscriber",
): Promise<Id<"users">[]> {
  const rows = await ctx.db
    .query("userRoles")
    .withIndex("by_role", (q) => q.eq("role", role))
    .collect();
  return [...new Set(rows.map((r) => r.userId))];
}

export async function createNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    type: string;
    title: string;
    description?: string;
    link?: string;
  },
): Promise<Id<"notifications">> {
  return ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    description: args.description,
    read: false,
    link: args.link,
    createdAt: Date.now(),
  });
}

/** Notify every admin (deduped). Skips the optional `exceptUserId` (e.g. sender). */
export async function notifyAdmins(
  ctx: MutationCtx,
  args: {
    type: string;
    title: string;
    description?: string;
    link?: string;
    exceptUserId?: Id<"users">;
  },
): Promise<number> {
  const adminIds = await listUserIdsWithRole(ctx, "admin");
  let created = 0;
  for (const userId of adminIds) {
    if (args.exceptUserId && userId === args.exceptUserId) continue;
    await createNotification(ctx, {
      userId,
      type: args.type,
      title: args.title,
      description: args.description,
      link: args.link,
    });
    created += 1;
  }
  return created;
}

/** Mark the caller's unread notifications whose link contains `linkIncludes`. */
export async function markNotificationsReadByLink(
  ctx: MutationCtx,
  args: { userId: Id<"users">; linkIncludes: string },
): Promise<number> {
  const unread = await ctx.db
    .query("notifications")
    .withIndex("by_userId_read", (q) => q.eq("userId", args.userId).eq("read", false))
    .collect();
  let updated = 0;
  for (const n of unread) {
    if (!n.link || !n.link.includes(args.linkIncludes)) continue;
    await ctx.db.patch(n._id, { read: true });
    updated += 1;
  }
  return updated;
}

export function previewBody(body: string, max = 120): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
