import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "discord pending grants and expired access",
  { minutes: 5 },
  internal.discord.roles.retryPendingGrants,
);

/** Weekly Monday 09:00 UTC — Connect auto-payouts (gated by featureFlags.autoPayoutsEnabled). */
crons.weekly(
  "weekly connect payouts monday",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.payouts.batch.runWeeklyConnectPayouts,
  { dryRun: false, force: false },
);

export default crons;
