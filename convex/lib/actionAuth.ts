import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

export async function requireActionUserId(ctx: ActionCtx): Promise<Id<"users">> {
  return ctx.runQuery(internal.session.currentUserId, {});
}
