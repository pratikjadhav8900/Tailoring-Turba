import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Helper to create slug from name
const createSlug = (name: string) => {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slug = createSlug(name);

    const category = await prisma.category.create({
      data: { name, slug }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Category create error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
