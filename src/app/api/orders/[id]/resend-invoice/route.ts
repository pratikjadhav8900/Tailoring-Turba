export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateInvoicePdf } from "@/lib/pdf";
import { sendOrderConfirmationEmail, sendTaxInvoiceEmail } from "@/lib/mail";
import { getEstimatedDeliveryDateRange } from "@/lib/delivery";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const invoiceType = searchParams.get("type") || "proforma"; // "proforma" | "tax"

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true, phone: true } },
      shippingAddress: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!order.user?.email) return NextResponse.json({ error: "Customer has no email address." }, { status: 400 });

  const pdfOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    totalAmount: order.totalAmount,
    isSplitPayment: order.isSplitPayment ?? false,
    amountPaid: order.amountPaid ?? 0,
    remainingAmount: order.remainingAmount ?? 0,
    user: {
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone,
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
    type: invoiceType === "tax" ? ("INVOICE" as const) : ("PRO FORMA INVOICE" as const),
  };

  try {
    const pdfBuffer = await generateInvoicePdf(pdfOrder);

    let mailResult;
    if (invoiceType === "tax") {
      mailResult = await sendTaxInvoiceEmail(
        order.user.email,
        order.user.name || "Customer",
        order.id,
        pdfBuffer,
        order.orderNumber ?? undefined
      );
    } else {
      const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
      mailResult = await sendOrderConfirmationEmail(
        order.user.email,
        order.user.name || "Customer",
        order.id,
        order.isSplitPayment ?? false,
        order.amountPaid ?? 0,
        pdfBuffer,
        order.orderNumber ?? undefined,
        getEstimatedDeliveryDateRange(order.createdAt, totalQty)
      );
    }

    if (mailResult && !mailResult.success) {
      const errMsg = (mailResult.error as any)?.message || "Failed to deliver email through mail service.";
      throw new Error(errMsg);
    }

    return NextResponse.json({
      success: true,
      message: `${invoiceType === "tax" ? "Tax" : "Pro Forma"} Invoice re-generated and sent to ${order.user.email}`,
    });
  } catch (err: any) {
    console.error("[RESEND_INVOICE_ERROR]", err);
    return NextResponse.json({ error: `Failed to generate/send invoice: ${err.message}` }, { status: 500 });
  }
}
