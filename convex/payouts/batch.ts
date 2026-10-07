/**
 * Monday auto-payout batch: create ledger payout rows + schedule Connect Transfers.
 */

import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { requireAdmin } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";
import { getCreatorAvailableBalanceCents } from "../lib/payoutBalance";
import {
  isAutoPayoutsEnabled,
  parsePayoutDefaults,
} from "../lib/payoutDefaults";
import {
  isScheduleDueThisWeek,
  utcWeekStartMs,
  weekBatchKey,
} from "../lib/payoutSchedule";

async function loadPlatformPayoutConfig(ctx: QueryCtx | MutationCtx) {
  const row = await ctx.db
    .query("platformSettings")
    .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
    .unique();
  const defaults = parsePayoutDefaults(
    (row?.payoutDefaults ?? undefined) as Record<string, unknown> | undefined,
  );
  const flags = (row?.featureFlags ?? undefined) as
    | Record<string, unknown>
    | undefined;
  return {
    defaults,
    autoEnabled: isAutoPayoutsEnabled(flags),
  };
}

export const listConnectCreatorsForBatch = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      creatorId: v.id("creators"),
      stripeAccountId: v.string(),
      payoutsEnabled: v.boolean(),
      schedule: v.string(),
      minimumPayoutCents: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const creators = await ctx.db
      .query("creators")
      .take(ADMIN_SCAN_MAX_DOCS);
    const out: Array<{
      creatorId: Id<"creators">;
      stripeAccountId: string;
      payoutsEnabled: boolean;
      schedule: string;
      minimumPayoutCents: number;
    }> = [];
    const { defaults } = await loadPlatformPayoutConfig(ctx);
    for (const c of creators) {
      if (!c.stripeAccountId) continue;
      if (c.stripeConnectPayoutsEnabled !== true) continue;
      const settings = await ctx.db
        .query("creatorPayoutSettings")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
        .unique();
      out.push({
        creatorId: c._id,
        stripeAccountId: c.stripeAccountId,
        payoutsEnabled: true,
        schedule: settings?.schedule ?? defaults.payoutCadence,
        minimumPayoutCents:
          settings?.minimumPayoutCents ?? defaults.minPayoutCents,
      });
    }
    return out;
  },
});

export const createBatchPayoutIfNeeded = internalMutation({
  args: {
    creatorId: v.id("creators"),
    amountCents: v.number(),
    batchKey: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    dryRun: v.boolean(),
  },
  returns: v.object({
    created: v.boolean(),
    skipped: v.boolean(),
    reason: v.optional(v.string()),
    payoutId: v.union(v.id("payouts"), v.null()),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payouts")
      .withIndex("by_batchKey", (q) => q.eq("batchKey", args.batchKey))
      .unique();
    if (existing) {
      return {
        created: false,
        skipped: true,
        reason: "ALREADY_BATCHED",
        payoutId: existing._id,
      };
    }
    if (args.dryRun) {
      return {
        created: false,
        skipped: false,
        reason: "DRY_RUN",
        payoutId: null,
      };
    }
    const now = Date.now();
    const payoutId = await ctx.db.insert("payouts", {
      creatorId: args.creatorId,
      amountCents: args.amountCents,
      status: "processing",
      method: "stripe_connect",
      batchKey: args.batchKey,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      createdAt: now,
      updatedAt: now,
    });
    return { created: true, skipped: false, payoutId };
  },
});

export const markBatchPayoutFailed = internalMutation({
  args: {
    payoutId: v.id("payouts"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) return null;
    if (payout.status === "completed" || payout.status === "paid") return null;
    await ctx.db.patch(payout._id, {
      status: "requested",
      errorMessage: args.errorMessage.slice(0, 500),
      updatedAt: Date.now(),
    });
    return null;
  },
});

type BatchResultRow = {
  creatorId: Id<"creators">;
  amountCents: number;
  status: "would_pay" | "paid" | "skipped" | "failed";
  reason?: string;
  payoutId?: Id<"payouts">;
  transferId?: string;
};

async function runWeeklyBatch(
  ctx: ActionCtx,
  args: { dryRun: boolean; force: boolean },
): Promise<{
  weekStartMs: number;
  autoEnabled: boolean;
  rows: BatchResultRow[];
}> {
  const weekStartMs = utcWeekStartMs(Date.now());
  const periodEnd = weekStartMs + 7 * 86_400_000 - 1;
  const settingsRow = await ctx.runQuery(internal.payouts.batch.getPlatformFlags, {});
  if (!args.force && !settingsRow.autoEnabled) {
    return {
      weekStartMs,
      autoEnabled: false,
      rows: [],
    };
  }

  const creators = await ctx.runQuery(
    internal.payouts.batch.listConnectCreatorsForBatch,
    {},
  );
  const rows: BatchResultRow[] = [];

  for (const c of creators) {
    if (!isScheduleDueThisWeek(c.schedule, weekStartMs)) {
      rows.push({
        creatorId: c.creatorId,
        amountCents: 0,
        status: "skipped",
        reason: "SCHEDULE_NOT_DUE",
      });
      continue;
    }

    const balance = await ctx.runQuery(internal.payouts.batch.getBalanceForCreator, {
      creatorId: c.creatorId,
    });
    if (balance.truncated) {
      rows.push({
        creatorId: c.creatorId,
        amountCents: 0,
        status: "skipped",
        reason: "BALANCE_TRUNCATED",
      });
      continue;
    }
    if (balance.payoutBlocked || balance.debtCents > 0) {
      rows.push({
        creatorId: c.creatorId,
        amountCents: 0,
        status: "skipped",
        reason: "PAYOUT_BLOCKED_DEBT",
      });
      continue;
    }
    if (balance.availableCents < c.minimumPayoutCents) {
      rows.push({
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        status: "skipped",
        reason: "BELOW_MINIMUM",
      });
      continue;
    }

    const batchKey = weekBatchKey(c.creatorId, weekStartMs);
    const created = await ctx.runMutation(
      internal.payouts.batch.createBatchPayoutIfNeeded,
      {
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        batchKey,
        periodStart: weekStartMs,
        periodEnd,
        dryRun: args.dryRun,
      },
    );

    if (created.skipped && created.reason === "ALREADY_BATCHED") {
      rows.push({
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        status: "skipped",
        reason: "ALREADY_BATCHED",
        payoutId: created.payoutId ?? undefined,
      });
      continue;
    }
    if (args.dryRun) {
      rows.push({
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        status: "would_pay",
        reason: "DRY_RUN",
      });
      continue;
    }
    if (!created.payoutId) {
      rows.push({
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        status: "failed",
        reason: "CREATE_FAILED",
      });
      continue;
    }

    try {
      const transfer = await ctx.runAction(
        internal.payments.stripeNode.sendConnectPayoutInternal,
        { payoutId: created.payoutId },
      );
      rows.push({
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        status: "paid",
        payoutId: created.payoutId,
        transferId: transfer.transferId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "TRANSFER_FAILED";
      await ctx.runMutation(internal.payouts.batch.markBatchPayoutFailed, {
        payoutId: created.payoutId,
        errorMessage: message,
      });
      rows.push({
        creatorId: c.creatorId,
        amountCents: balance.availableCents,
        status: "failed",
        reason: message,
        payoutId: created.payoutId,
      });
    }
  }

  return {
    weekStartMs,
    autoEnabled: settingsRow.autoEnabled,
    rows,
  };
}

export const getPlatformFlags = internalQuery({
  args: {},
  returns: v.object({
    autoEnabled: v.boolean(),
    earningsHoldDays: v.number(),
    minPayoutCents: v.number(),
    payoutReservePercent: v.number(),
  }),
  handler: async (ctx) => {
    const { defaults, autoEnabled } = await loadPlatformPayoutConfig(ctx);
    return {
      autoEnabled,
      earningsHoldDays: defaults.earningsHoldDays,
      minPayoutCents: defaults.minPayoutCents,
      payoutReservePercent: defaults.payoutReservePercent,
    };
  },
});

export const getBalanceForCreator = internalQuery({
  args: { creatorId: v.id("creators") },
  returns: v.object({
    availableCents: v.number(),
    pendingCents: v.number(),
    debtCents: v.number(),
    payoutBlocked: v.boolean(),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { defaults } = await loadPlatformPayoutConfig(ctx);
    const bal = await getCreatorAvailableBalanceCents(
      ctx,
      args.creatorId,
      Date.now(),
      defaults.payoutReservePercent,
    );
    return {
      availableCents: bal.availableCents,
      pendingCents: bal.pendingCents,
      debtCents: bal.debtCents,
      payoutBlocked: bal.payoutBlocked,
      truncated: bal.truncated,
    };
  },
});

const batchResultValidator = v.object({
  weekStartMs: v.number(),
  autoEnabled: v.boolean(),
  dryRun: v.boolean(),
  paidCount: v.number(),
  wouldPayCount: v.number(),
  skippedCount: v.number(),
  failedCount: v.number(),
  rows: v.array(
    v.object({
      creatorId: v.id("creators"),
      amountCents: v.number(),
      status: v.union(
        v.literal("would_pay"),
        v.literal("paid"),
        v.literal("skipped"),
        v.literal("failed"),
      ),
      reason: v.optional(v.string()),
      payoutId: v.optional(v.id("payouts")),
      transferId: v.optional(v.string()),
    }),
  ),
});

export const runWeeklyConnectPayouts = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    force: v.optional(v.boolean()),
  },
  returns: batchResultValidator,
  handler: async (ctx, args) => {
    const dryRun = args.dryRun === true;
    const force = args.force === true;
    const result = await runWeeklyBatch(ctx, { dryRun, force });
    return {
      ...result,
      dryRun,
      paidCount: result.rows.filter((r) => r.status === "paid").length,
      wouldPayCount: result.rows.filter((r) => r.status === "would_pay").length,
      skippedCount: result.rows.filter((r) => r.status === "skipped").length,
      failedCount: result.rows.filter((r) => r.status === "failed").length,
    };
  },
});

/** Admin: dry-run preview or force-run Monday batch (staging). */
export const runWeeklyConnectPayoutsAdmin = mutation({
  args: {
    dryRun: v.boolean(),
    force: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.payouts.batch.runWeeklyConnectPayouts, {
      dryRun: args.dryRun,
      force: args.force ?? false,
    });
    return null;
  },
});

/** Admin: last-run style preview using dry-run action result via query helper. */
export const previewWeeklyConnectPayouts = query({
  args: {},
  returns: v.object({
    autoEnabled: v.boolean(),
    earningsHoldDays: v.number(),
    minPayoutCents: v.number(),
    candidateCount: v.number(),
    candidates: v.array(
      v.object({
        creatorId: v.id("creators"),
        availableCents: v.number(),
        pendingCents: v.number(),
        minimumPayoutCents: v.number(),
        schedule: v.string(),
        due: v.boolean(),
        eligible: v.boolean(),
        reason: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const { defaults, autoEnabled } = await loadPlatformPayoutConfig(ctx);
    const weekStartMs = utcWeekStartMs(Date.now());
    const creators = await ctx.db.query("creators").take(ADMIN_SCAN_MAX_DOCS);
    const candidates: Array<{
      creatorId: Id<"creators">;
      availableCents: number;
      pendingCents: number;
      minimumPayoutCents: number;
      schedule: string;
      due: boolean;
      eligible: boolean;
      reason?: string;
    }> = [];

    for (const c of creators) {
      if (!c.stripeAccountId || c.stripeConnectPayoutsEnabled !== true) continue;
      const settings = await ctx.db
        .query("creatorPayoutSettings")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
        .unique();
      const schedule = settings?.schedule ?? defaults.payoutCadence;
      const minimumPayoutCents =
        settings?.minimumPayoutCents ?? defaults.minPayoutCents;
      const due = isScheduleDueThisWeek(schedule, weekStartMs);
      const bal = await getCreatorAvailableBalanceCents(
        ctx,
        c._id,
        Date.now(),
        defaults.payoutReservePercent,
      );
      let eligible = false;
      let reason: string | undefined;
      if (!due) reason = "SCHEDULE_NOT_DUE";
      else if (bal.payoutBlocked || bal.debtCents > 0) reason = "PAYOUT_BLOCKED_DEBT";
      else if (bal.truncated) reason = "BALANCE_TRUNCATED";
      else if (bal.availableCents < minimumPayoutCents) reason = "BELOW_MINIMUM";
      else eligible = true;

      candidates.push({
        creatorId: c._id,
        availableCents: bal.availableCents,
        pendingCents: bal.pendingCents,
        minimumPayoutCents,
        schedule,
        due,
        eligible,
        reason,
      });
    }

    return {
      autoEnabled,
      earningsHoldDays: defaults.earningsHoldDays,
      minPayoutCents: defaults.minPayoutCents,
      candidateCount: candidates.filter((c) => c.eligible).length,
      candidates,
    };
  },
});
