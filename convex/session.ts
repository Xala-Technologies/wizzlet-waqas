import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "./lib/auth";

/** Actions use the same session and second-factor checks as queries/mutations. */
export const currentUserId = internalQuery({
  args: {},
  returns: v.id("users"),
  handler: async ctx => (await requireAppUser(ctx))._id,
});
