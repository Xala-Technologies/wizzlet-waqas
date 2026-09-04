/**
 * Single source of truth for odds parsing and conversion.
 * Wizzlet displays dual-format odds (American / decimal-EU) everywhere, so all
 * screens must use these helpers to guarantee identical numbers.
 */

/** American odds -> decimal (EU) odds. Returns null for invalid input. */
export function americanToDecimal(us: string | number | null | undefined, digits = 2): number | null {
  if (us === null || us === undefined || us === '') return null;
  const n = typeof us === 'number' ? us : Number(String(us).trim());
  if (!Number.isFinite(n) || n === 0) return null;
  const dec = n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
  return Number(dec.toFixed(digits));
}

/** Decimal (EU) odds -> American odds string. Returns '' for invalid input. */
export function decimalToAmerican(eu: number | string | null | undefined): string {
  const n = typeof eu === 'number' ? eu : Number(String(eu ?? '').trim());
  if (!Number.isFinite(n) || n <= 1) return '';
  if (n >= 2) return `+${Math.round((n - 1) * 100)}`;
  return `-${Math.round(100 / (n - 1))}`;
}

/**
 * Parses a stored odds string into its American / decimal parts.
 * Supports "-110 (US)", "1.91 (EU)", "-110 1.91" and bare values.
 */
export function parsePickOdds(oddsStr: string | null | undefined): { us: string | null; eu: string | null } {
  if (!oddsStr) return { us: null, eu: null };
  const usMatch = oddsStr.match(/([+-]?\d+)\s*\(US\)/);
  const euMatch = oddsStr.match(/([\d.]+)\s*\(EU\)/);
  if (!usMatch && !euMatch) {
    const parts = oddsStr.trim().split(/\s+/);
    if (parts.length >= 1) {
      const first = parts[0];
      if (first.startsWith('+') || first.startsWith('-')) return { us: first, eu: parts[1] || null };
      if (parseFloat(first) > 0) return { us: null, eu: first };
    }
  }
  return { us: usMatch?.[1] || null, eu: euMatch?.[1] || null };
}

/** Units profit/loss for a settled pick. */
export function profitUnits(result: 'won' | 'lost' | 'push' | 'pending', units: number, usOdds: string | number): number {
  if (result === 'won') {
    const dec = americanToDecimal(usOdds);
    return dec ? Number((units * (dec - 1)).toFixed(2)) : 0;
  }
  if (result === 'lost') return -units;
  return 0;
}
