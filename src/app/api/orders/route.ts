import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { items, orderSheetData } = body;
    // items: [{ productId, quantity, price }]

    if (!items?.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

    // MOQ Check
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return NextResponse.json({ error: `Product not found.` }, { status: 404 });
      if (item.quantity < product.minOrderQuantity) {
        return NextResponse.json(
          { error: `Minimum order for "${product.name}" is ${product.minOrderQuantity} pcs. You have ${item.quantity}.` },
          { status: 400 }
        );
      }
    }

    const totalAmount = items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount,
        items: {
          create: items.map((i: { productId: string; quantity: number; price: number }) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
        ...(orderSheetData && {
          orderSheet: { create: { sheetData: orderSheetData } },
        }),
      },
      include: { items: true, orderSheet: true },
    });

    return NextResponse.json({ orderId: order.id, totalAmount: order.totalAmount }, { status: 201 });
  } catch (err) {
    console.error("[ORDER_CREATE]", err);
    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
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
