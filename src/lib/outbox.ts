import { prisma } from "@/lib/prisma";
import { sendOutForDeliveryEmail, sendTaxInvoiceEmail } from "@/lib/mail";
import { generateInvoicePdf } from "@/lib/pdf";

export async function processOutboxNotification(notificationId: string) {
  const notif = await prisma.outboxNotification.findUnique({
    where: { id: notificationId },
    include: {
      order: {
        include: {
          user: true,
          shippingAddress: true,
          items: { include: { product: true } },
        },
      },
    },
  });

  if (!notif || notif.status === "SENT") return;

  try {
    const payload = notif.payload as any;

    if (notif.template === "OUT_FOR_DELIVERY") {
      const res = await sendOutForDeliveryEmail(
        notif.recipient,
        notif.order.user?.name || "Customer",
        notif.orderId,
        notif.order.orderNumber ?? undefined,
        payload.awb,
        payload.courierName,
        payload.balanceDuePaise || 0
      );

      if (res && !res.success) {
        throw new Error((res.error as any)?.message || "Delivery email provider rejected transmission");
      }
    } else if (notif.template === "TAX_INVOICE") {
      const pdfOrder = {
        id: notif.order.id,
        orderNumber: notif.order.orderNumber,
        createdAt: notif.order.createdAt,
        totalAmount: notif.order.totalAmount,
        isSplitPayment: notif.order.isSplitPayment ?? false,
        amountPaid: notif.order.amountPaid ?? 0,
        remainingAmount: notif.order.remainingAmount ?? 0,
        user: {
          name: notif.order.user?.name ?? null,
          email: notif.order.user?.email ?? null,
          phone: notif.order.user?.phone ?? null,
        },
        shippingAddress: notif.order.shippingAddress
          ? {
              name: notif.order.shippingAddress.name,
              street: notif.order.shippingAddress.street,
              city: notif.order.shippingAddress.city,
              state: notif.order.shippingAddress.state,
              postalCode: notif.order.shippingAddress.postalCode,
              country: notif.order.shippingAddress.country,
            }
          : null,
        items: notif.order.items.map((i) => ({ product: { name: i.product.name }, quantity: i.quantity, price: i.price })),
        type: "INVOICE" as const,
      };

      const pdfBuffer = await generateInvoicePdf(pdfOrder);
      const res = await sendTaxInvoiceEmail(
        notif.recipient,
        notif.order.user?.name || "Customer",
        notif.orderId,
        pdfBuffer,
        notif.order.orderNumber ?? undefined
      );

      if (res && !res.success) {
        throw new Error((res.error as any)?.message || "Tax invoice email provider rejected transmission");
      }
    }

    await prisma.outboxNotification.update({
      where: { id: notif.id },
      data: {
        status: "SENT",
        processedAt: new Date(),
        lastError: null,
      },
    });
  } catch (err: any) {
    console.error(`[OUTBOX_PROCESS_ERROR] Notification ${notificationId} failed:`, err);
    await prisma.outboxNotification.update({
      where: { id: notif.id },
      data: {
        status: "FAILED",
        attemptCount: { increment: 1 },
        lastError: err.message || "Unknown transmission failure",
      },
    });
  }
}
