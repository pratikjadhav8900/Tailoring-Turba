import { PrismaClient } from "@prisma/client";
import { generateInvoicePdf } from "./src/lib/pdf";
import { sendOrderConfirmationEmail } from "./src/lib/mail";

const prisma = new PrismaClient();

async function main() {
  try {
    const order = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        shippingAddress: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      console.log("No order found");
      return;
    }

    console.log("Generating PDF for order:", order.id);
    const pdfBuffer = await generateInvoicePdf({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      isSplitPayment: order.isSplitPayment,
      amountPaid: order.amountPaid,
      remainingAmount: order.remainingAmount,
      user: {
        name: order.user.name || "Customer",
        email: order.user.email,
        phone: order.user.phone,
      },
      shippingAddress: order.shippingAddress,
      items: order.items.map((i: any) => ({
        product: {
          name: i.product?.name || "Unknown Product",
        },
        quantity: i.quantity,
        price: i.price,
      })),
    });

    console.log("PDF generated successfully. Size:", pdfBuffer.length);

    console.log("Sending email...");
    await sendOrderConfirmationEmail(
      order.user.email,
      order.user.name || "Customer",
      order.id,
      order.isSplitPayment,
      order.amountPaid,
      pdfBuffer,
      order.orderNumber
    );
    console.log("Email sent successfully!");

  } catch (err) {
    console.error("FAILED WITH ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
