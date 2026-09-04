import { describe, it, expect } from 'vitest';
import { toCsv, parseCsv } from '@/lib/csv';
import { parsePickCsv } from '@/lib/pickCsv';

describe('csv', () => {
  it('quotes cells containing commas, quotes and newlines', () => {
    const csv = toCsv(['a', 'b'], [['x,y', 'he said "hi"'], ['line\nbreak', 1]]);
    expect(csv).toBe('a,b\n"x,y","he said ""hi"""\n"line\nbreak",1');
  });

  it('round-trips through the parser', () => {
    const rows = [['x,y', 'he said "hi"'], ['plain', '2']];
    expect(parseCsv(toCsv(['a', 'b'], rows))).toEqual([['a', 'b'], ...rows]);
  });
});

describe('parsePickCsv', () => {
  it('parses valid rows, normalises results and reports skipped rows', () => {
    const text = [
      'Date,Pick/Event,Sport,EU Odds,US Odds,Units Risked,Result,Units Won/Lost,Notes',
      '2026-01-05,Chiefs -3.5,NFL,1.91,-110,2,Won,1.82,"sharp, money"',
      '2026-01-06,Lakers under,NBA,2.0,+100,1,lost,-1,',
      ',,,,,,,,',
      'not-a-date,Broken row,NFL,,,,,,',
    ].join('\n');

    const { rows, skipped } = parsePickCsv(text);
    expect(skipped).toBe(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: '2026-01-05', pick_event: 'Chiefs -3.5', sport: 'NFL',
      eu_odds: 1.91, us_odds: '-110', units_risked: 2, result: 'win',
      units_won_lost: 1.82, notes: 'sharp, money',
    });
    expect(rows[1].result).toBe('loss');
  });

  it('defaults missing optional values', () => {
    const { rows } = parsePickCsv('2026-02-01,Some game,,,,,,,');
    expect(rows[0]).toMatchObject({ sport: 'Other', units_risked: 1, result: 'pending', units_won_lost: 0, notes: null });
  });
});
