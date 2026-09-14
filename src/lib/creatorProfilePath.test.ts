import { describe, expect, it } from 'vitest';
import { creatorProfilePath, legacyCreatorProfilePath } from './creatorProfilePath';

describe('creatorProfilePath', () => {
  it('builds the canonical /:username path', () => {
    expect(creatorProfilePath('LeoPickz')).toBe('/LeoPickz');
  });

  it('strips leading @ and encodes safely', () => {
    expect(creatorProfilePath('@edge finder')).toBe('/edge%20finder');
  });

  it('falls back to creators directory when empty', () => {
    expect(creatorProfilePath('   ')).toBe('/creators');
  });
});

describe('legacyCreatorProfilePath', () => {
  it('keeps the legacy /c/ prefix for redirect tests', () => {
    expect(legacyCreatorProfilePath('LeoPickz')).toBe('/c/LeoPickz');
  });
});
