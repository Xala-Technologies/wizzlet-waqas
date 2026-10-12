/** Tracking destinations must be absolute web URLs, never executable schemes. */
export function normalizeCreatorLinkUrl(raw: string): string | null {
  const value = raw.trim();
  const hasControlCharacter = Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
  if (!/^https?:\/\//i.test(value) || hasControlCharacter) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
