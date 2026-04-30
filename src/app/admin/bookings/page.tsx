import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingsClient from "./BookingsClient";

export default async function AdminBookingsPage() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return <div>Unauthorized</div>;
  }

  const bookings = await prisma.booking.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { date: "desc" }
  });

  // Serialize for client
  const serialized = bookings.map(b => ({
    ...b,
    date: b.date.toISOString(),
  }));

  return <BookingsClient initialBookings={serialized} />;
}
