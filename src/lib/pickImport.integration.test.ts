import { describe, expect, it } from 'vitest';
import { importCsv, upsert } from '../../convex/picks/mutations';
import { fixture, invoke } from '../test/commerceFixture';

const pick = { date: '2026-10-12', pickEvent: 'Fixture game', sport: 'NFL', euOdds: 2,
  usOdds: '+100', unitsRisked: 1, unitsWonLost: 1, result: 'win', notes: 'CSV fixture' };

describe('atomic, retryable pick imports', () => {
  it('validates every row before writing the first row', async () => {
    const f = fixture();
    await expect(invoke(importCsv, f.ctx, { rows: [pick, { ...pick, date: '2026-02-30' }] })).rejects.toThrow();
    expect(f.all('pickTracker')).toHaveLength(0);
  });
  it('skips exact duplicates within the file and on retry, preserving distinct picks', async () => {
    const f = fixture();
    const rows = [pick, pick, { ...pick, pickEvent: 'Another game' }];
    expect(await invoke(importCsv, f.ctx, { rows })).toEqual({ imported: 2, duplicates: 1 });
    expect(await invoke(importCsv, f.ctx, { rows })).toEqual({ imported: 0, duplicates: 3 });
    expect(f.all('pickTracker')).toHaveLength(2);
    expect(f.all('pickTracker')[0]).toMatchObject({ userId: 'owner', result: 'won' });
  });
  it('does not let another user’s duplicate suppress this user’s import', async () => {
    const f = fixture(); f.add('pickTracker', 'foreign', { ...pick, userId: 'someone-else' });
    expect(await invoke(importCsv, f.ctx, { rows: [pick] })).toEqual({ imported: 1, duplicates: 0 });
  });
  it('enforces validation on direct upsert calls too', async () => {
    const f = fixture();
    await expect(invoke(upsert, f.ctx, { ...pick, unitsRisked: -1 })).rejects.toThrow();
    await expect(invoke(upsert, f.ctx, { ...pick, unitsWonLost: Infinity })).rejects.toThrow();
    expect(f.all('pickTracker')).toHaveLength(0);
  });
  it('rejects overlarge batches before writes', async () => {
    const f = fixture();
    await expect(invoke(importCsv, f.ctx, { rows: Array(501).fill(pick) })).rejects.toThrow();
    expect(f.all('pickTracker')).toHaveLength(0);
  });
});
