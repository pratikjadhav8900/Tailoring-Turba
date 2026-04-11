import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { date, timeSlot, notes } = await req.json();
  if (!date || !timeSlot) return NextResponse.json({ error: "Date and time slot are required." }, { status: 400 });

  const booking = await prisma.booking.create({
    data: { userId: session.user.id, date: new Date(date), timeSlot, notes: notes || null },
  });

  return NextResponse.json(booking, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const bookings = await prisma.booking.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(bookings);
}
