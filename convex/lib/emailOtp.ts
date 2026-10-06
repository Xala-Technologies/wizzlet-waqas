/** Email-change OTP helpers — no Convex imports (unit-tested from src/lib). */

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(normalizeEmail(raw));
}

export function isValidOtpCode(code: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code.trim());
}

export function generateNumericOtp(
  random: { getRandomValues: (arr: Uint32Array) => Uint32Array } = crypto,
): string {
  const buf = new Uint32Array(1);
  random.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(OTP_LENGTH, "0");
}

export function generateOtpSalt(
  random: { getRandomValues: (arr: Uint8Array) => Uint8Array } = crypto,
): string {
  const buf = new Uint8Array(16);
  random.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashOtp(salt: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${code.trim()}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function otpMatches(
  salt: string,
  code: string,
  expectedHash: string,
): Promise<boolean> {
  const got = await hashOtp(salt, code);
  if (got.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) {
    diff |= got.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

export function otpExpired(expiresAt: number | undefined, now: number): boolean {
  return !expiresAt || now > expiresAt;
}

export function otpResendTooSoon(
  lastSentAt: number | undefined,
  now: number,
  cooldownMs: number = OTP_RESEND_COOLDOWN_MS,
): boolean {
  return typeof lastSentAt === "number" && now - lastSentAt < cooldownMs;
}
