import type { QueryCtx } from "../_generated/server";
import { ADMIN_SCAN_MAX_DOCS } from "./adminLists";

export type ReportingPayment = {
  status: string;
  type: string;
  paymentMode?: string;
  amountCents: number;
  platformFeeCents: number;
  creatorEarningsCents: number;
  balanceState?: string;
  commercialRef?: string;
  relatedCommercialRef?: string;
};

/** Monetary ledger entries; subscription lifecycle and payout transfers are not revenue. */
export function isReportPayment(row: Pick<ReportingPayment, "type" | "paymentMode">) {
  return row.paymentMode !== "sandbox" && row.type !== "subscription_cancel" && row.type !== "payout";
}

/** Signed, settled amounts. Failed/pending attempts never count as paid revenue. */
export function settledReportPayments<T extends ReportingPayment>(rows: T[]): T[] {
  const settled = rows.filter(row => isReportPayment(row) && (row.status === "settled" || row.status === "paid"));
  const reversedRefs = new Set(settled
    .filter(row => row.amountCents < 0 && (row.type === "refund" || row.type === "dispute"))
    .map(row => row.relatedCommercialRef).filter(Boolean));
  // Legacy reversals without a separate debit have already removed the credit.
  // When an explicit debit exists, retain both sides to avoid subtracting twice.
  return settled.filter(row => row.balanceState !== "reversed" ||
    Boolean(row.commercialRef && reversedRefs.has(row.commercialRef)));
}

export function sumReportPayments(rows: ReportingPayment[]) {
  return settledReportPayments(rows).reduce((total, row) => ({
    amountCents: total.amountCents + row.amountCents,
    platformFeeCents: total.platformFeeCents + row.platformFeeCents,
    creatorEarningsCents: total.creatorEarningsCents + row.creatorEarningsCents,
  }), { amountCents: 0, platformFeeCents: 0, creatorEarningsCents: 0 });
}

export function paymentFeePercent(amountCents: number, feeCents: number) {
  return amountCents === 0 ? 0 : Math.round((feeCents / amountCents) * 1000) / 10;
}

/** One bounded ledger read, including failed attempts for transaction reports. */
export async function takeReportPayments(ctx: QueryCtx) {
  const docs = await ctx.db.query("paymentEvents").withIndex("by_createdAt").order("desc").take(ADMIN_SCAN_MAX_DOCS);
  return { docs: docs.filter(isReportPayment), truncated: docs.length >= ADMIN_SCAN_MAX_DOCS };
}
