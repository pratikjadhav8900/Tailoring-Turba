export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Auth guard - only admins can access applications
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await withRetry(async () => {
      return await prisma.inquiry.findMany({
        where: {
          companyName: "Career Application"
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    });

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error("GET Job Applications Error:", error);
    return NextResponse.json({ error: "Failed to fetch job applications." }, { status: 500 });
  }
}
