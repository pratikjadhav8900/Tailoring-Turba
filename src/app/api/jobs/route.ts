export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

/**
 * Public Job Listings (Read-only)
 * Exposes active job openings for public candidates on the Careers portal.
 */
export async function GET() {
  try {
    const jobs = await withRetry(async () => {
      return await prisma.job.findMany({
        select: {
          id: true,
          title: true,
          department: true,
          location: true,
          type: true,
          salaryRange: true,
          description: true,
          requirements: true,
          responsibilities: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" }
      });
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[PUBLIC_JOBS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch job openings." }, { status: 500 });
  }
}
