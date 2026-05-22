export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOperationsOrderAlert, sendOrderConfirmationEmail } from "@/lib/mail";
import { generateInvoicePdf } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { items, orderSheetData, addressId, shippingAddress, paymentId, razorpayOrderId } = body;

    // Security: Only allow order creation if payment is provided (for retail orders)
    if (!paymentId || !razorpayOrderId) {
      return NextResponse.json({ error: "Payment verification required." }, { status: 400 });
    }

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
          status: "PROCESSING",
          paymentId: paymentId,
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
    sendOperationsOrderAlert(order.id, orderDetailsUrl).catch(err => {
      console.error("[MAIL_ERROR] Failed to send operations alert:", err);
    });

    // Fetch full order with user + address for PDF
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true, phone: true } },
        shippingAddress: true,
      },
    });

    // Generate Pro Forma Invoice PDF and email to customer
    if (fullOrder?.user?.email) {
      const isSplit = fullOrder.isSplitPayment ?? false;
      const pdfOrder = {
        id: fullOrder.id,
        orderNumber: fullOrder.orderNumber,
        createdAt: fullOrder.createdAt,
        totalAmount: fullOrder.totalAmount,
        isSplitPayment: isSplit,
        amountPaid: fullOrder.amountPaid ?? 0,
        remainingAmount: fullOrder.remainingAmount ?? 0,
        user: {
          name: fullOrder.user.name,
          email: fullOrder.user.email,
          phone: fullOrder.user.phone,
        },
        shippingAddress: fullOrder.shippingAddress ? {
          name: fullOrder.shippingAddress.name,
          street: fullOrder.shippingAddress.street,
          city: fullOrder.shippingAddress.city,
          state: fullOrder.shippingAddress.state,
          postalCode: fullOrder.shippingAddress.postalCode,
          country: fullOrder.shippingAddress.country,
        } : null,
        items: fullOrder.items.map(i => ({ product: { name: i.product.name }, quantity: i.quantity, price: i.price })),
        type: 'PRO FORMA INVOICE' as const,
      };

      generateInvoicePdf(pdfOrder).then(pdfBuffer => {
        return sendOrderConfirmationEmail(
          fullOrder.user!.email!,
          fullOrder.user!.name || 'Customer',
          fullOrder.id,
          isSplit,
          fullOrder.amountPaid ?? 0,
          pdfBuffer,
          fullOrder.orderNumber ?? undefined
        );
      }).catch(err => {
        console.error("[MAIL_ERROR] Failed to send Pro Forma Invoice email:", err);
      });
    }

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

