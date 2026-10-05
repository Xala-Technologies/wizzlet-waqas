import { afterEach, describe, expect, it } from 'vitest';
import {
  CREATOR_LINK_STORAGE_KEY,
  clearStoredCreatorLinkId,
  readStoredCreatorLinkId,
  sanitizeCreatorLinkId,
  storeCreatorLinkId,
} from './creatorLinkHandoff';

describe('creatorLinkHandoff', () => {
  afterEach(() => {
    clearStoredCreatorLinkId();
  });

  it('sanitizes plausible Convex link ids', () => {
    expect(sanitizeCreatorLinkId('jd75mwt8abcdefghijklmnopqr')).toBe(
      'jd75mwt8abcdefghijklmnopqr',
    );
    expect(sanitizeCreatorLinkId(' short ')).toBeNull();
    expect(sanitizeCreatorLinkId('../evil')).toBeNull();
    expect(sanitizeCreatorLinkId('has space idxx')).toBeNull();
  });

  it('round-trips sessionStorage', () => {
    storeCreatorLinkId('jd75mwt8abcdefghijklmnopqr');
    expect(sessionStorage.getItem(CREATOR_LINK_STORAGE_KEY)).toBe(
      'jd75mwt8abcdefghijklmnopqr',
    );
    expect(readStoredCreatorLinkId()).toBe('jd75mwt8abcdefghijklmnopqr');
    clearStoredCreatorLinkId();
    expect(readStoredCreatorLinkId()).toBeNull();
  });
});
