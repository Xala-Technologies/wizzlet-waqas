import { validatePickInput } from "../../convex/lib/pickInput";
import { parseCsv } from '@/lib/csv';

/** Shared column contract for pick-tracker CSV import/export. */
export const PICK_CSV_HEADERS = [
  'Date', 'Pick/Event', 'Sport', 'EU Odds', 'US Odds', 'Units Risked', 'Result', 'Units Won/Lost', 'Notes',
];

export interface ParsedPickRow {
  date: string;
  pick_event: string;
  sport: string;
  eu_odds: number | null;
  us_odds: string | null;
  units_risked: number;
  result: string;
  units_won_lost: number;
  notes: string | null;
}

const VALID_RESULTS = ['win', 'loss', 'push', 'pending'];

const normaliseResult = (raw: string): string => {
  const r = raw.trim().toLowerCase();
  if (r === 'won' || r === 'w') return 'win';
  if (r === 'lost' || r === 'l') return 'loss';
  if (VALID_RESULTS.includes(r)) return r;
  if (!r) return 'pending';
  throw new Error('Invalid result');
};

const num = (raw: string): number | null => {
  if (!raw) return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) throw new Error('Invalid number');
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error('Invalid number');
  return value;
};

export interface PickCsvResult {
  rows: ParsedPickRow[];
  skipped: number;
}

/**
 * Parses a pick CSV. Column order follows PICK_CSV_HEADERS; a header row is
 * detected and skipped. Rows without a usable date or event are reported as
 * skipped rather than silently dropped.
 */
export function parsePickCsv(text: string): PickCsvResult {
  const table = parseCsv(text.replace(/^\uFEFF/, ''));
  if (table.length > 501) throw new Error('Import at most 500 rows at a time');
  if (table.length === 0) return { rows: [], skipped: 0 };

  const first = table[0].map((c) => c.trim().toLowerCase());
  const hasHeader = first[0] === 'date' || first.includes('pick/event');
  if (hasHeader && (first.length !== PICK_CSV_HEADERS.length || first.some((cell, i) => cell !== PICK_CSV_HEADERS[i].toLowerCase()))) {
    throw new Error('CSV columns must match the exported template');
  }
  const body = hasHeader ? table.slice(1) : table;
  if (body.length > 500) throw new Error('Import at most 500 rows at a time');

  const rows: ParsedPickRow[] = [];
  let skipped = 0;

  for (const raw of body) {
    const [date, event, sport, eu, us, units, result, wonLost, notes] = Array.from({ length: PICK_CSV_HEADERS.length }, (_, i) => (raw[i] ?? '').trim());
    try {
      if (raw.length < 2 || raw.length > PICK_CSV_HEADERS.length) throw new Error('Invalid column count');
      const row: ParsedPickRow = {
        date, pick_event: event, sport: sport || 'Other', eu_odds: num(eu),
        us_odds: us || null, units_risked: num(units) ?? 1,
        result: normaliseResult(result ?? ''), units_won_lost: num(wonLost) ?? 0,
        notes: notes || null,
      };
      validatePickInput({ date: row.date, pickEvent: row.pick_event, sport: row.sport,
        euOdds: row.eu_odds ?? undefined, usOdds: row.us_odds ?? undefined,
        unitsRisked: row.units_risked, unitsWonLost: row.units_won_lost, result: row.result, notes: row.notes ?? undefined });
      rows.push(row);
    } catch { skipped++; }
  }

  return { rows, skipped };
}
