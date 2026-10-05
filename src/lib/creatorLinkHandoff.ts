/** sessionStorage key for `/go/:linkId` → Checkout attribution. */
export const CREATOR_LINK_STORAGE_KEY = 'prizelet.creatorLinkId';

/**
 * Convex document ids are opaque alphanumeric strings (typically 32 chars).
 * Reject anything that is not a plausible id before stashing or sending to Checkout.
 */
export function sanitizeCreatorLinkId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const id = raw.trim();
  if (!id) return null;
  if (id.length < 10 || id.length > 64) return null;
  if (!/^[a-z0-9]+$/i.test(id)) return null;
  return id;
}

export function readStoredCreatorLinkId(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sanitizeCreatorLinkId(sessionStorage.getItem(CREATOR_LINK_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeCreatorLinkId(linkId: string | null | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  const safe = sanitizeCreatorLinkId(linkId);
  try {
    if (safe) {
      sessionStorage.setItem(CREATOR_LINK_STORAGE_KEY, safe);
    } else {
      sessionStorage.removeItem(CREATOR_LINK_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredCreatorLinkId(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(CREATOR_LINK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
