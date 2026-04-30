import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOperationsBookingAlert, sendCustomerBookingConfirmation } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const session = await auth();
  
  const { date, timeSlot, notes, name, email, phone } = await req.json();
  if (!date || !timeSlot) return NextResponse.json({ error: "Date and time slot are required." }, { status: 400 });

  const userId = session?.user?.id;

  const booking = await prisma.booking.create({
    data: { 
      userId: userId || null, 
      guestName: !userId ? name : null,
      guestEmail: !userId ? email : null,
      guestPhone: !userId ? phone : null,
      date: new Date(date), 
      timeSlot, 
      notes: notes || null 
    },
    include: { user: true }
  });

  // Notify Operations
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingDetailsUrl = `${baseUrl}/admin/bookings`;
  
  const formattedDate = new Date(booking.date).toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const customerName = booking.user?.name || booking.guestName || "A Customer";
  const customerEmail = booking.user?.email || booking.guestEmail;

  sendOperationsBookingAlert(booking.id, bookingDetailsUrl, customerName, formattedDate, booking.timeSlot).catch(err => {
    console.error("[MAIL_ERROR] Failed to send booking operations alert:", err);
  });

  // Send confirmation to the customer
  if (customerEmail) {
    sendCustomerBookingConfirmation(
      customerEmail,
      customerName,
      formattedDate,
      booking.timeSlot,
      booking.notes
    ).catch(err => {
      console.error("[MAIL_ERROR] Failed to send customer confirmation:", err);
    });
  }

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
