import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const tags = await prisma.leadTag.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error("[CRM_GET_TAGS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

const TAG_COLORS = ["#FF6A39", "#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const existing = await prisma.leadTag.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ tag: existing });
    }

    const tag = await prisma.leadTag.create({
      data: {
        name,
        color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      },
    });

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error("[CRM_CREATE_TAG_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create tag" }, { status: 500 });
  }
}
