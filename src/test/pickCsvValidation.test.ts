import { describe, expect, it } from 'vitest';
import { parsePickCsv } from '../lib/pickCsv';
import { parseCsv } from '../lib/csv';

describe('CSV import validation', () => {
  it.each([
    '2026-02-30,Game,NFL,1.9,-110,1,win,0.9,',
    '2026-01-01,Game,NFL,1.9,-110,-1,loss,-1,',
    '2026-01-01,Game,NFL,1.9,-110,1oops,win,0.9,',
    '2026-01-01,Game,NFL,1.9,-110,1,typo,0.9,',
    '2026-01-01,Game,NFL,0.5,-110,1,win,0.9,',
    '2026-01-01,Game,NFL,1.9,garbage,1,win,0.9,',
    '2026-01-01,Game,NFL,1.9,-110,1,win,garbage,',
  ])('rejects malformed date/number/result without silently substituting a value: %s', line => {
    expect(parsePickCsv(line)).toMatchObject({ rows: [], skipped: 1 });
  });
  it('rejects an unterminated quoted field', () => {
    expect(() => parseCsv('Date,Event\n2026-01-01,"unclosed')).toThrow();
  });
  it('rejects reordered headers rather than assigning values to wrong columns', () => {
    expect(() => parsePickCsv('Date,Pick/Event,Units Risked,Sport\n2026-01-01,Game,2,NFL')).toThrow();
  });
  it('preserves leap days and blank optional values', () => {
    expect(parsePickCsv('2024-02-29,Game,,,,,,,').rows[0]).toMatchObject({ date: '2024-02-29', units_risked: 1, result: 'pending' });
  });
});
