export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";
import { sendOperationsBookingAlert, sendCustomerBookingConfirmation } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // Rate limit public bookings: Max 5 bookings per 15 minutes per IP
  const rateLimit = checkRateLimit(`booking_ip_${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please wait a few minutes before submitting again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const session = await auth();
  
  const { date, timeSlot, notes, name, email, phone } = await req.json();
  if (!date || !timeSlot) return NextResponse.json({ error: "Date and time slot are required." }, { status: 400 });

  const userId = session?.user?.id;

  const sNotes = notes ? sanitize(notes) : null;
  const sName = name ? sanitize(name) : null;
  const sEmail = email ? sanitize(email) : null;
  const sPhone = phone ? sanitize(phone) : null;

  const booking = await prisma.booking.create({
    data: { 
      userId: userId || null, 
      guestName: !userId ? sName : null,
      guestEmail: !userId ? sEmail : null,
      guestPhone: !userId ? sPhone : null,
      date: new Date(date), 
      timeSlot, 
      notes: sNotes 
    },
    include: { user: true }
  });

  // Notify Operations
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingDetailsUrl = `${baseUrl}/admin/bookings`;
  
  const formattedDate = new Date(booking.date).toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const customerName = booking.user?.name || booking.guestName || "A Customer";
  const customerEmail = booking.user?.email || booking.guestEmail;

  const customerPhone = booking.user?.phone || booking.guestPhone;

  sendOperationsBookingAlert(booking.id, bookingDetailsUrl, customerName, formattedDate, booking.timeSlot, customerEmail, customerPhone).catch(err => {
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

