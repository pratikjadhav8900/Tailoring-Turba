export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Zombie POST /api/orders remediation (CRITICAL C-2)
 * Direct unverified order creation with arbitrary payment IDs is completely disabled.
 * Orders must be initiated via /api/razorpay/order and verified via /api/razorpay/verify.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Direct order placement via POST /api/orders is disabled for security. All orders must be created and verified through the authoritative Razorpay payment gateway workflow.",
      code: "ORDER_CREATION_ENDPOINT_DEPRECATED",
    },
    { status: 405 }
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: { items: { include: { product: true } }, orderSheet: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
