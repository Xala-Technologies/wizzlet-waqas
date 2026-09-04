import { describe, it, expect } from 'vitest';
import { americanToDecimal, decimalToAmerican, parsePickOdds, profitUnits } from './odds';

describe('americanToDecimal', () => {
  it('converts positive American odds', () => {
    expect(americanToDecimal('+150')).toBe(2.5);
    expect(americanToDecimal(100)).toBe(2);
  });
  it('converts negative American odds', () => {
    expect(americanToDecimal('-110')).toBe(1.91);
    expect(americanToDecimal('-200')).toBe(1.5);
  });
  it('honours the digits argument', () => {
    expect(americanToDecimal('-110', 3)).toBe(1.909);
  });
  it('rejects invalid input', () => {
    for (const v of [null, undefined, '', 'abc', 0, '0']) expect(americanToDecimal(v as never)).toBeNull();
  });
});

describe('decimalToAmerican', () => {
  it('round-trips favourites and underdogs', () => {
    expect(decimalToAmerican(2.5)).toBe('+150');
    expect(decimalToAmerican(1.91)).toBe('-110');
    expect(decimalToAmerican(2)).toBe('+100');
  });
  it('rejects odds at or below 1', () => {
    expect(decimalToAmerican(1)).toBe('');
    expect(decimalToAmerican(0.5)).toBe('');
    expect(decimalToAmerican('nope')).toBe('');
  });
});

describe('parsePickOdds', () => {
  it('parses tagged formats', () => {
    expect(parsePickOdds('-110 (US) 1.91 (EU)')).toEqual({ us: '-110', eu: '1.91' });
  });
  it('parses bare American odds with optional decimal', () => {
    expect(parsePickOdds('-110 1.91')).toEqual({ us: '-110', eu: '1.91' });
    expect(parsePickOdds('+220')).toEqual({ us: '+220', eu: null });
  });
  it('parses a bare decimal', () => {
    expect(parsePickOdds('1.85')).toEqual({ us: null, eu: '1.85' });
  });
  it('handles empty input', () => {
    expect(parsePickOdds(null)).toEqual({ us: null, eu: null });
  });
});

describe('profitUnits', () => {
  it('pays out wins at the decimal price', () => {
    expect(profitUnits('won', 1, '-110')).toBe(0.91);
    expect(profitUnits('won', 2, '+150')).toBe(3);
  });
  it('loses the staked units', () => {
    expect(profitUnits('lost', 1.5, '-110')).toBe(-1.5);
  });
  it('returns zero for push and pending', () => {
    expect(profitUnits('push', 3, '-110')).toBe(0);
    expect(profitUnits('pending', 3, '-110')).toBe(0);
  });
});
