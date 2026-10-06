/** RFC 6238 TOTP (SHA-1, 6 digits, 30s) — no Convex imports (unit-tested). */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SEC = 30;
export const TOTP_WINDOW = 1;

export function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32[(value << (5 - bits)) & 31];
  }
  return out;
}

export function decodeBase32(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error("INVALID_TOTP_SECRET");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export function generateTotpSecret(
  random: { getRandomValues: (arr: Uint8Array) => Uint8Array } = crypto,
): string {
  const bytes = new Uint8Array(20);
  random.getRandomValues(bytes);
  return encodeBase32(bytes);
}

export function otpauthUrl(args: {
  email: string;
  secret: string;
  issuer?: string;
}): string {
  const issuer = args.issuer ?? "Prizelet";
  const account = args.email.trim() || "account";
  const label = encodeURIComponent(`${issuer}:${account}`);
  const q = new URLSearchParams({
    secret: args.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SEC),
  });
  return `otpauth://totp/${label}?${q.toString()}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(sig);
}

export async function totpAt(secret: string, unixSeconds: number): Promise<string> {
  const key = decodeBase32(secret);
  const counter = Math.floor(unixSeconds / TOTP_PERIOD_SEC);
  const buf = new Uint8Array(8);
  let n = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = n & 255;
    n = Math.floor(n / 256);
  }
  const hmac = await hmacSha1(key, buf);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = bin % 10 ** TOTP_DIGITS;
  return String(otp).padStart(TOTP_DIGITS, "0");
}

export function isValidTotpCode(code: string): boolean {
  return new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(code.trim());
}

export async function verifyTotp(
  secret: string,
  code: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  const trimmed = code.trim();
  if (!isValidTotpCode(trimmed)) return false;
  const t = Math.floor(nowMs / 1000);
  for (let skew = -TOTP_WINDOW; skew <= TOTP_WINDOW; skew++) {
    const expected = await totpAt(secret, t + skew * TOTP_PERIOD_SEC);
    if (timingSafeEqual(expected, trimmed)) return true;
  }
  return false;
}
