import { query } from "./_generated/server";
import { v } from "convex/values";
import { configuredSocialProviders } from "./lib/socialAuth";

/** Public — UI shows X/Discord buttons only when Convex env credentials exist. */
export const socialProviders = query({
  args: {},
  returns: v.object({
    twitter: v.boolean(),
    discord: v.boolean(),
  }),
  handler: async () => {
    return configuredSocialProviders();
  },
});
