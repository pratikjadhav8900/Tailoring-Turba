export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateInvoicePdf } from "@/lib/pdf";

/**
 * GET /api/orders/[id]/invoice
 * On-demand PDF download for the owning customer (or an admin). Previously the only way
 * to get an invoice PDF was an admin-only "resend by email" action — the customer-facing
 * "Invoice" button on /dashboard/transactions had nothing to call.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      shippingAddress: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const role = (session.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (order.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const pdfBuffer = await generateInvoicePdf({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      isSplitPayment: order.isSplitPayment ?? false,
      amountPaid: order.amountPaid ?? 0,
      remainingAmount: order.remainingAmount ?? 0,
      user: {
        name: order.user?.name ?? null,
        email: order.user?.email ?? null,
        phone: order.user?.phone ?? null,
      },
      shippingAddress: order.shippingAddress
        ? {
            name: order.shippingAddress.name,
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          }
        : null,
      items: order.items.map((i) => ({ product: { name: i.product.name }, quantity: i.quantity, price: i.price })),
      // Unpaid orders never had a tax invoice raised — a proforma is the honest document to hand back.
      type: order.status === "PENDING" ? "PRO FORMA INVOICE" : "INVOICE",
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber || order.id.slice(-8)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    console.error("[CUSTOMER_INVOICE_ERROR]", err);
    return NextResponse.json({ error: "Failed to generate invoice." }, { status: 500 });
  }
}
