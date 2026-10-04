import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "discord pending grants and expired access",
  { minutes: 5 },
  internal.discord.roles.retryPendingGrants,
);

export default crons;
