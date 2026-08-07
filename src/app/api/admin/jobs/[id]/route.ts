export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Auth guard - only admins can edit
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { title, department, location, type, salaryRange, description, requirements, responsibilities } = await req.json();

    if (!title || !department || !location || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedJob = await withRetry(async () => {
      return await prisma.job.update({
        where: { id },
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

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error("PUT Job Error:", error);
    return NextResponse.json({ error: "Failed to update job." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Auth guard - only admins can delete
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    await withRetry(async () => {
      await prisma.job.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Job deleted successfully." });
  } catch (error: any) {
    console.error("DELETE Job Error:", error);
    return NextResponse.json({ error: "Failed to delete job." }, { status: 500 });
  }
}
