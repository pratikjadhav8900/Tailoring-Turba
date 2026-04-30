import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, stateJson, sourceProductId, imageUrl } = body;

    if (!name || !stateJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const design = await prisma.design.create({
      data: {
        userId: session.user.id,
        name,
        stateJson: typeof stateJson === 'string' ? stateJson : JSON.stringify(stateJson),
        sourceProductId: sourceProductId?.toString() || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, design });
  } catch (error: any) {
    console.error("Error saving design:", error);
    return NextResponse.json(
      { error: "Failed to save design", details: error.message },
      { status: 500 }
    );
  }
}
