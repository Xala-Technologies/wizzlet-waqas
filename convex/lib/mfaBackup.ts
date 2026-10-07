/** MFA backup codes — no Convex imports (unit-tested). */

import { generateOtpSalt, hashOtp, otpMatches } from "./emailOtp";

export const BACKUP_CODE_COUNT = 8;
export const BACKUP_CODE_BODY_LEN = 8;
const BACKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type BackupCodeHash = { salt: string; hash: string };

export function normalizeBackupCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidBackupCode(raw: string): boolean {
  const cleaned = normalizeBackupCode(raw);
  if (cleaned.length !== BACKUP_CODE_BODY_LEN) return false;
  for (const ch of cleaned) {
    if (!BACKUP_ALPHABET.includes(ch)) return false;
  }
  return true;
}

export function formatBackupCode(code: string): string {
  const cleaned = normalizeBackupCode(code);
  if (cleaned.length !== BACKUP_CODE_BODY_LEN) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export function generateBackupCodes(
  random: { getRandomValues: (arr: Uint8Array) => Uint8Array } = crypto,
  count: number = BACKUP_CODE_COUNT,
): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(BACKUP_CODE_BODY_LEN);
    random.getRandomValues(bytes);
    let body = "";
    for (let j = 0; j < BACKUP_CODE_BODY_LEN; j++) {
      body += BACKUP_ALPHABET[bytes[j]! % BACKUP_ALPHABET.length];
    }
    codes.push(formatBackupCode(body));
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<BackupCodeHash[]> {
  const out: BackupCodeHash[] = [];
  for (const code of codes) {
    const salt = generateOtpSalt();
    const hash = await hashOtp(salt, normalizeBackupCode(code));
    out.push({ salt, hash });
  }
  return out;
}

/** Returns the index of the matching unused hash, or -1. */
export async function findBackupCodeIndex(
  hashes: BackupCodeHash[],
  code: string,
): Promise<number> {
  if (!isValidBackupCode(code)) return -1;
  const normalized = normalizeBackupCode(code);
  for (let i = 0; i < hashes.length; i++) {
    const entry = hashes[i];
    if (!entry) continue;
    if (await otpMatches(entry.salt, normalized, entry.hash)) return i;
  }
  return -1;
}
