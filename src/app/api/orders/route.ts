import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOperationsOrderAlert } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { items, orderSheetData, addressId } = body;
    // items: [{ productId, quantity, price, designId? }]

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
        ...(addressId && { shippingAddressId: addressId }),
        items: {
          create: items.map((i: { productId: string; quantity: number; price: number; designId?: string }) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            ...(i.designId && { designId: i.designId })
          })),
        },
        ...(orderSheetData && {
          orderSheet: { create: { sheetData: orderSheetData } },
        }),
      },
      include: { items: true, orderSheet: true },
    });

    // Notify Operations
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const orderDetailsUrl = `${baseUrl}/admin/orders/${order.id}`;
    
    // We trigger the email without awaiting to prevent blocking the response
    sendOperationsOrderAlert(order.id, orderDetailsUrl).catch(err => {
      console.error("[MAIL_ERROR] Failed to send operations alert:", err);
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
