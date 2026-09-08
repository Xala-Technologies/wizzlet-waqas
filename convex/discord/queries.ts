import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const roleSyncPrep = internalQuery({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
  },
  returns: v.union(
    v.object({
      guildId: v.string(),
      roleId: v.string(),
      discordUserId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    const user = await ctx.db.get(args.userId);
    if (!creator || !user) return null;
    const guildId = creator.discordServerId?.trim();
    const roleId = creator.discordRoleId?.trim();
    const discordUserId = user.discordId?.trim();
    if (!guildId || !roleId || !discordUserId) return null;
    return { guildId, roleId, discordUserId };
  },
});
