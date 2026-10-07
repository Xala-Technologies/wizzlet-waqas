import { isProductionOrigin, parseEnvBool } from "./envOrigin";

export function mailerConfigured(
  env: {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  } = process.env,
): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim());
}

/** Domain-only hint for admin UI — never returns the API key. */
export function emailFromDomainHint(
  emailFrom: string | undefined | null = process.env.EMAIL_FROM,
): string | null {
  const raw = (emailFrom ?? "").trim();
  if (!raw) return null;
  const angle = raw.match(/<([^>]+)>/);
  const addr = (angle?.[1] ?? raw).trim().toLowerCase();
  const at = addr.lastIndexOf("@");
  if (at <= 0 || at === addr.length - 1) return null;
  return addr.slice(at + 1);
}

/** Dev-only plaintext OTP in the action result — never on production-shaped SITE_URL. */
export function allowDevOtpEcho(
  env: {
    SITE_URL?: string;
    ALLOW_DEV_ADMIN_GRANT?: string;
  } = process.env,
): boolean {
  if (isProductionOrigin(env.SITE_URL)) return false;
  return parseEnvBool(env.ALLOW_DEV_ADMIN_GRANT);
}

/** Ops snapshot for admin settings — booleans only, no secrets. */
export function mailerOpsStatus(
  env: {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    SITE_URL?: string;
    ALLOW_DEV_ADMIN_GRANT?: string;
  } = process.env,
): {
  configured: boolean;
  fromDomain: string | null;
  productionOrigin: boolean;
  devEchoAllowed: boolean;
} {
  return {
    configured: mailerConfigured(env),
    fromDomain: emailFromDomainHint(env.EMAIL_FROM),
    productionOrigin: isProductionOrigin(env.SITE_URL),
    devEchoAllowed: allowDevOtpEcho(env),
  };
}

export function emailChangeOtpMessage(code: string): {
  subject: string;
  text: string;
} {
  return {
    subject: "Your Prizelet email verification code",
    text: `Your Prizelet verification code is ${code}. It expires in 10 minutes. If you did not request an email change, you can ignore this message.`,
  };
}

export async function sendResendEmail(args: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const fetchImpl = args.fetchImpl ?? fetch;
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MAILER_FAILED:${res.status}:${body.slice(0, 180)}`);
  }
}
