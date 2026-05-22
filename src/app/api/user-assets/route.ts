export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await prisma.userAsset.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (error: any) {
    console.error("Error fetching user assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const asset = await prisma.userAsset.create({
      data: {
        userId: session.user.id,
        url,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving user asset:", error);
    return NextResponse.json({ error: "Failed to save asset" }, { status: 500 });
  }
}
