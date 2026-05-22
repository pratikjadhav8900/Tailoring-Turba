export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const design = await prisma.design.findUnique({
      where: { id: params.id },
      include: { product: true }
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error("Error fetching design:", error);
    return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 });
  }
}
