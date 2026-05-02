import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOperationsOrderAlert } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { items, orderSheetData, addressId, shippingAddress } = body;
    // items: [{ productId, quantity, price, designId? }]

    let finalAddressId = addressId;

    if (shippingAddress && !finalAddressId) {
      try {
        const newAddress = await prisma.address.create({
          data: {
            id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: session.user.id,
            name: shippingAddress.name,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country || "India",
            updatedAt: new Date(),
          }
        });
        finalAddressId = newAddress.id;
      } catch (addrErr: any) {
        console.error("[ADDRESS_CREATE_ERROR]", addrErr);
        return NextResponse.json({ error: `Failed to save shipping address: ${addrErr.message}` }, { status: 500 });
      }
    }

    if (!items?.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

    // MOQ & Product Presence Check
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json({ error: "Missing product ID for an item in your cart. Please try removing and re-adding it." }, { status: 400 });
      }
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return NextResponse.json({ error: `Product with ID ${item.productId} not found.` }, { status: 404 });
      
      if (item.quantity < product.minOrderQuantity) {
        return NextResponse.json(
          { error: `Minimum order for "${product.name}" is ${product.minOrderQuantity} pcs. You have ${item.quantity}.` },
          { status: 400 }
        );
      }
    }

    const totalAmount = items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0);


    let order;
    try {
      order = await prisma.order.create({
        data: {
          userId: session.user.id,
          totalAmount,
          ...(finalAddressId && { shippingAddressId: finalAddressId }),
          items: {
            create: items.map((i: { 
              productId: string; 
              quantity: number; 
              price: number; 
              designId?: string;
              customStateJson?: string;
              printFiles?: string[];
              mockupUrl?: string;
              mockupUrlBack?: string;
            }) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
              ...(i.designId && { designId: i.designId }),
              ...(i.customStateJson && { customStateJson: i.customStateJson }),
              ...(i.printFiles && { printFiles: i.printFiles }),
              ...(i.mockupUrl && { mockupUrl: i.mockupUrl }),
              ...(i.mockupUrlBack && { mockupUrlBack: i.mockupUrlBack })
            })),
          },
          ...(orderSheetData && {
            orderSheet: { create: { sheetData: orderSheetData } },
          }),
        },
        include: { items: true, orderSheet: true },
      });
    } catch (createErr: any) {
      console.error("[PRISMA_ORDER_CREATE_ERROR]", createErr);
      return NextResponse.json({ error: `Database error: ${createErr.message || "Failed to create order record."}` }, { status: 500 });
    }

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
