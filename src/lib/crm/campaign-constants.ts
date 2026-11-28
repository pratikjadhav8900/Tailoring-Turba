// No imports — safe to use from both client components (the composer) and
// the server-side campaign-sending logic, so the unsubscribe tag can never
// drift out of sync between the two.

/** Resend's literal merge tag for the per-recipient unsubscribe link (triple braces — confirmed against their API reference). */
export const RESEND_UNSUBSCRIBE_TAG = "{{{RESEND_UNSUBSCRIBE_URL}}}";

export const DEFAULT_CAMPAIGN_FOOTER_HTML = `
<hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;" />
<p style="font-size:12px;color:#9ca3af;margin-top:16px;line-height:1.6;">
  Tailoring Turba &middot; You're receiving this because you're a lead or customer of Tailoring Turba.
  <a href="${RESEND_UNSUBSCRIBE_TAG}" style="color:#9ca3af;">Unsubscribe</a>
</p>`;
