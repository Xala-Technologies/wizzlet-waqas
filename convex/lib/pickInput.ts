import { normalizePickResult } from "./results";

export type PickInput = {
  date: string; pickEvent: string; sport: string; euOdds?: number; usOdds?: string;
  unitsRisked: number; unitsWonLost?: number; result: string; notes?: string;
};

export function validPickDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Shared validation at the file boundary and the authoritative write boundary. */
export function validatePickInput(row: PickInput) {
  if (!validPickDate(row.date)) throw new Error("Use a valid date in YYYY-MM-DD format");
  if (!row.pickEvent.trim() || row.pickEvent.length > 1000) throw new Error("Pick/event is required (maximum 1,000 characters)");
  if (!Number.isFinite(row.unitsRisked) || row.unitsRisked <= 0) throw new Error("Units risked must be a positive number");
  if (row.euOdds !== undefined && (!Number.isFinite(row.euOdds) || row.euOdds <= 1)) throw new Error("EU odds must be greater than 1");
  if (row.usOdds && (!/^[+-]?\d+$/.test(row.usOdds) || !Number.isSafeInteger(Number(row.usOdds)) || Math.abs(Number(row.usOdds)) < 100)) throw new Error("US odds must be an integer of at least +100 or at most -100");
  if (row.unitsWonLost !== undefined && !Number.isFinite(row.unitsWonLost)) throw new Error("Units won/lost must be a finite number");
  if ((row.notes?.length ?? 0) > 10_000) throw new Error("Notes are too long");
  normalizePickResult(row.result);
}

/** Exact semantic duplicates are safe to retry, including a previously completed import. */
export function pickImportKey(row: PickInput) {
  return JSON.stringify([row.date, row.pickEvent.trim(), row.sport.trim(), row.euOdds ?? null,
    row.usOdds ? Number(row.usOdds) : null, row.unitsRisked, row.unitsWonLost ?? 0,
    normalizePickResult(row.result), row.notes?.trim() ?? ""]);
}
