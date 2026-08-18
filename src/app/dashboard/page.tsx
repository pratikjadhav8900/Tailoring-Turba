export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [orders, designs, bookings, recommendedProducts] = await withRetry(() =>
    Promise.all([
      // Fetch latest 5 orders with nested items, product models, and custom designs
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            include: {
              product: true,
              design: true,
            }
          }
        }
      }),
      // Fetch latest 4 saved designs with their respective source product bases
      prisma.design.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          product: true
        }
      }),
      // Fetch active Pune Showroom visits (requested or confirmed)
      prisma.booking.findMany({
        where: {
          userId,
          status: { in: ["REQUESTED", "CONFIRMED"] }
        },
        orderBy: { date: "asc" }
      }),
      // Fetch recent 4 products as suggestions (excluding placeholder custom designs)
      prisma.product.findMany({
        where: {
          isActive: true,
          name: { not: "Custom Design" }
        },
        orderBy: { createdAt: "desc" },
        take: 4
      })
    ])
  );

  return (
    <DashboardClient
      user={session.user}
      orders={orders as any}
      designs={designs as any}
      bookings={bookings as any}
      recommendedProducts={recommendedProducts as any}
    />
  );
}
