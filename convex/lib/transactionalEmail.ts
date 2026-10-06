import { isProductionOrigin, parseEnvBool } from "./envOrigin";

export function mailerConfigured(
  env: {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  } = process.env,
): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim());
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
