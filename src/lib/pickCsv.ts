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
  return 'pending';
};

const num = (raw: string): number | null => {
  const n = parseFloat(String(raw).replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) ? n : null;
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
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], skipped: 0 };

  const first = table[0].map((c) => c.trim().toLowerCase());
  const hasHeader = first[0] === 'date' || first.includes('pick/event');
  const body = hasHeader ? table.slice(1) : table;

  const rows: ParsedPickRow[] = [];
  let skipped = 0;

  for (const raw of body) {
    const [date, event, sport, eu, us, units, result, wonLost, notes] = raw.map((c) => (c ?? '').trim());
    const parsedDate = date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toISOString().split('T')[0]
      : null;
    if (!parsedDate || !event) { skipped++; continue; }

    rows.push({
      date: parsedDate,
      pick_event: event,
      sport: sport || 'Other',
      eu_odds: num(eu),
      us_odds: us || null,
      units_risked: num(units) ?? 1,
      result: normaliseResult(result ?? ''),
      units_won_lost: num(wonLost) ?? 0,
      notes: notes || null,
    });
  }

  return { rows, skipped };
}
