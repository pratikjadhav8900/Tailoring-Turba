import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { processPendingWhatsAppRecipients } from "@/lib/crm/whatsapp-broadcasts";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 40;

/** Manual "Send more now" action — lets a rep continue a large broadcast without waiting for the daily cron. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const result = await processPendingWhatsAppRecipients({ broadcastId: params.id, limit: BATCH_LIMIT });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[CRM_PROCESS_WHATSAPP_BROADCAST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to send more messages" }, { status: 500 });
  }
}
