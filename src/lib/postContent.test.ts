import { describe, expect, it } from 'vitest';
import { parsePostContent } from './postContent';

describe('parsePostContent', () => {
  it('returns defaults for empty content', () => {
    expect(parsePostContent(null).units).toBe('1');
    expect(parsePostContent('').sport).toBe('');
  });

  it('round-trips structured pick fields and notes', () => {
    const blob = [
      'Sport: NBA',
      'Event: Lakers vs Warriors',
      'Type: Moneyline',
      'Pick: Lakers ML',
      'Odds: +150 (US) 2.5 (EU)',
      'Units: 2u',
      '',
      'Fade the public.',
    ].join('\n');

    expect(parsePostContent(blob)).toEqual({
      sport: 'NBA',
      event: 'Lakers vs Warriors',
      pickType: 'Moneyline',
      pick: 'Lakers ML',
      usOdds: '+150',
      euOdds: '2.5',
      units: '2',
      notes: 'Fade the public.',
    });
  });
});
