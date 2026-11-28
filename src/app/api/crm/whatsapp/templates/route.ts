import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { listApprovedTemplates } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const templates = await listApprovedTemplates();
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}
