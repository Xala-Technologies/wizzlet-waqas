/**
 * Small CSV helpers shared across dashboards.
 * Kept dependency-free so both admin exports and pick-tracker
 * import/export use one consistent, quote-safe implementation.
 */

const escapeCell = (value: unknown): string => {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Parses CSV text (RFC4180-ish: quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === ',') { row.push(cell); cell = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

/** Reads a File selected through an <input type="file"> as UTF-8 text. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
