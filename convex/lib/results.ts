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

/** True once a result has left pending — owner must not rewrite. */
export function isSettledPickResult(result: PickResult | string | null | undefined): boolean {
  if (result == null || result === "") return false;
  const n = normalizePickResult(String(result));
  return n === "won" || n === "lost" || n === "push";
}

/**
 * Win rate for decided picks only: wins / (wins + losses).
 * Excludes pending and push from the denominator.
 */
export function computeWinRate(results: Array<string | null | undefined>): {
  wins: number;
  losses: number;
  decided: number;
  winRatePct: number;
} {
  let wins = 0;
  let losses = 0;
  for (const raw of results) {
    if (raw == null || raw === "") continue;
    const n = String(raw).trim().toLowerCase();
    const result =
      n === "win" || n === "w" || n === "won"
        ? "won"
        : n === "loss" || n === "l" || n === "lost"
          ? "lost"
          : n === "push" || n === "void" || n === "p"
            ? "push"
            : n === "pending" || n === "open"
              ? "pending"
              : null;
    if (result === "won") wins += 1;
    else if (result === "lost") losses += 1;
  }
  const decided = wins + losses;
  return {
    wins,
    losses,
    decided,
    winRatePct: decided > 0 ? Math.round((wins / decided) * 100) : 0,
  };
}
