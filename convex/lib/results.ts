import { ConvexError } from "convex/values";

export type PickResult = "pending" | "won" | "lost" | "push";

/** Normalize legacy win/loss/push synonyms to canonical vocabulary. */
export function normalizePickResult(raw: string): PickResult {
  const v = raw.trim().toLowerCase();
  if (v === "pending" || v === "open" || v === "") return "pending";
  if (v === "won" || v === "win" || v === "w") return "won";
  if (v === "lost" || v === "loss" || v === "l") return "lost";
  if (v === "push" || v === "void" || v === "p") return "push";
  throw new ConvexError(`INVALID_PICK_RESULT:${raw}`);
}
