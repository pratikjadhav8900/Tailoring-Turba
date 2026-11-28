// Meta WhatsApp Cloud API client — direct Graph API calls, no BSP middleman.
// Shapes confirmed against Meta's current API reference (Nov 2026):
// send: POST /{PHONE_NUMBER_ID}/messages, list templates: GET /{WABA_ID}/message_templates.

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
  if (!accessToken || !phoneNumberId || !businessAccountId) {
    throw new Error(
      "WhatsApp isn't connected yet. Set META_WHATSAPP_ACCESS_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID, and META_WHATSAPP_BUSINESS_ACCOUNT_ID once Meta's WhatsApp Business setup is complete."
    );
  }
  return { accessToken, phoneNumberId, businessAccountId };
}

export interface WhatsAppTemplateComponent {
  type: string; // HEADER | BODY | FOOTER | BUTTONS
  format?: string;
  text?: string;
}

export interface WhatsAppTemplateSummary {
  name: string;
  status: string;
  category: string;
  language: string;
  components: WhatsAppTemplateComponent[];
  bodyVariableCount: number;
}

function countBodyVariables(components: WhatsAppTemplateComponent[]): number {
  const body = components.find((c) => c.type === "BODY");
  if (!body?.text) return 0;
  const matches = new Set((body.text.match(/\{\{\d+\}\}/g) || []).map((m) => m));
  return matches.size;
}

/** Only APPROVED templates are usable — Meta rejects a send against anything else. */
export async function listApprovedTemplates(): Promise<WhatsAppTemplateSummary[]> {
  const { accessToken, businessAccountId } = getWhatsAppConfig();
  const res = await fetch(
    `${GRAPH_BASE}/${businessAccountId}/message_templates?fields=name,status,category,language,components&limit=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to fetch WhatsApp templates from Meta.");
  }

  return (data.data || [])
    .filter((t: any) => t.status === "APPROVED")
    .map((t: any) => ({
      name: t.name,
      status: t.status,
      category: t.category,
      language: t.language,
      components: t.components || [],
      bodyVariableCount: countBodyVariables(t.components || []),
    }));
}

export interface SendTemplateResult {
  success: boolean;
  waMessageId?: string;
  error?: string;
}

/**
 * Sends ONE template message. There is no bulk-send endpoint on Meta's side
 * either — a broadcast is just many of these calls, paced by our own batching.
 */
export async function sendTemplateMessage(params: {
  to: string; // E.164, e.g. +919822000004
  templateName: string;
  languageCode: string;
  bodyParams?: string[]; // positional {{1}}, {{2}}... text values
}): Promise<SendTemplateResult> {
  const { accessToken, phoneNumberId } = getWhatsAppConfig();

  const components =
    params.bodyParams && params.bodyParams.length > 0
      ? [{ type: "body", parameters: params.bodyParams.map((text) => ({ type: "text", text })) }]
      : undefined;

  try {
    const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.languageCode },
          ...(components ? { components } : {}),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, waMessageId: data?.messages?.[0]?.id };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error calling Meta Graph API" };
  }
}
