/**
 * Canonical public creator profile path.
 * Prefer this helper over hard-coded `/c/...` (which is not a real route).
 */
export function creatorProfilePath(username: string): string {
  const handle = username.trim().replace(/^@+/, '');
  if (!handle) return '/creators';
  return `/${encodeURIComponent(handle)}`;
}

/** Legacy `/c/:username` URLs redirect here. */
export function legacyCreatorProfilePath(username: string): string {
  return `/c/${encodeURIComponent(username.trim().replace(/^@+/, ''))}`;
}
