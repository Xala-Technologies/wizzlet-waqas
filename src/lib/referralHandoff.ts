/** sessionStorage key for OAuth round-trip (query `?ref=` is lost on provider return). */
export const REFERRAL_CODE_STORAGE_KEY = 'prizelet.referralCode';

/**
 * Normalize and validate a creator referral code for session handoff.
 * Matches product codes like `j2creator-jn73sz` (lowercase alnum / _ / -).
 */
export function sanitizeReferralCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const code = raw.trim().toLowerCase();
  if (!code) return null;
  if (code.length < 2 || code.length > 64) return null;
  if (!/^[a-z0-9_-]+$/.test(code)) return null;
  return code;
}

export function readStoredReferralCode(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sanitizeReferralCode(sessionStorage.getItem(REFERRAL_CODE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeReferralCode(code: string | null | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  const safe = sanitizeReferralCode(code);
  try {
    if (safe) {
      sessionStorage.setItem(REFERRAL_CODE_STORAGE_KEY, safe);
    } else {
      sessionStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredReferralCode(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
