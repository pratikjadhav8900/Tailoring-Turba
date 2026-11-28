import { Resend } from "resend";

let client: Resend | null = null;

/** Throws if RESEND_API_KEY isn't configured — bulk campaigns have no SMTP fallback (unlike sendMail). */
export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured. Bulk email campaigns require Resend.");
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export const CAMPAIGN_FROM = process.env.EMAIL_FROM || '"Tailoring Turba" <no-reply@tailoringturba.com>';
