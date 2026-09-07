export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await withRetry(async () => {
      return await prisma.job.findMany({
        orderBy: { createdAt: "desc" }
      });
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("[ADMIN_GET_JOBS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth guard - only admins can post
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, department, location, type, salaryRange, description, requirements, responsibilities } = await req.json();

    if (!title || !department || !location || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newJob = await withRetry(async () => {
      return await prisma.job.create({
        data: {
          title,
          department,
          location,
          type,
          salaryRange: salaryRange || "",
          description,
          requirements: Array.isArray(requirements) ? requirements : [],
          responsibilities: Array.isArray(responsibilities) ? responsibilities : []
        }
      });
    });

    return NextResponse.json(newJob);
  } catch (error: any) {
    console.error("[ADMIN_POST_JOB_ERROR]", error);
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}
