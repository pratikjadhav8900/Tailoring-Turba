import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { tagId } = await req.json();
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const assignment = await prisma.leadTagAssignment.upsert({
      where: { leadId_tagId: { leadId: params.id, tagId } },
      create: { leadId: params.id, tagId },
      update: {},
      include: { tag: true },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    console.error("[CRM_TAG_LEAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to tag lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get("tagId");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    await prisma.leadTagAssignment.deleteMany({ where: { leadId: params.id, tagId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CRM_UNTAG_LEAD_ERROR]", error);
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 });
  }
}
