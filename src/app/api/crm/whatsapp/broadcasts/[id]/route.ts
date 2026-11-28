import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const broadcast = await prisma.whatsAppBroadcast.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        recipients: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found." }, { status: 404 });
    }

    const statusCounts = broadcast.recipients.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({ broadcast, statusCounts });
  } catch (error: any) {
    console.error("[CRM_GET_WHATSAPP_BROADCAST_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch broadcast" }, { status: 500 });
  }
}
