import { describe, expect, it } from 'vitest';
import { parsePostContent } from './postContent';

describe('parsePostContent', () => {
  it('returns defaults for empty content', () => {
    expect(parsePostContent(null).units).toBe('1');
    expect(parsePostContent('').sport).toBe('');
    expect(parsePostContent(null).tags).toBe('');
  });

  it('round-trips structured pick fields, tags, and notes', () => {
    const blob = [
      'Sport: Basketball',
      'Event: Lakers vs Warriors',
      'Type: Moneyline',
      'Pick: Lakers ML',
      'Odds: +150 (US) 2.5 (EU)',
      'Units: 2u',
      'Tags: value, high confidence',
      '',
      'Fade the public.',
    ].join('\n');

    expect(parsePostContent(blob)).toEqual({
      sport: 'Basketball',
      event: 'Lakers vs Warriors',
      pickType: 'Moneyline',
      pick: 'Lakers ML',
      usOdds: '+150',
      euOdds: '2.5',
      units: '2',
      tags: 'value, high confidence',
      notes: 'Fade the public.',
    });
  });
});
