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

  const [userRecord, orders, designs, bookings, recommendedProducts, totalOrdersCount] = await withRetry(() =>
    Promise.all([
      // Fetch actual user profile, company info, and addresses
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          gstNumber: true,
          isB2BApproved: true,
          image: true,
          Address: {
            orderBy: { isDefault: "desc" },
            take: 3,
          }
        }
      }),
      // Fetch recent orders with nested items, product models, and custom designs
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          items: {
            include: {
              product: true,
              design: true,
            }
          },
          shippingAddress: true,
        }
      }),
      // Fetch saved designs with source products
      prisma.design.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
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
      // Fetch recent products as recommendations
      prisma.product.findMany({
        where: {
          isActive: true,
          name: { not: "Custom Design" }
        },
        orderBy: { createdAt: "desc" },
        take: 4
      }),
      // Total count of customer orders
      prisma.order.count({
        where: { userId }
      })
    ])
  );

  return (
    <DashboardClient
      user={{
        ...session.user,
        ...(userRecord || {}),
      }}
      orders={orders as any}
      designs={designs as any}
      bookings={bookings as any}
      recommendedProducts={recommendedProducts as any}
      totalOrdersCount={totalOrdersCount}
    />
  );
}
