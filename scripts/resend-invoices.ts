/**
 * Bulk Re-generate & Resend Invoice Emails
 * 
 * This script fetches all orders (or a specific order by number) from the database,
 * generates the invoice PDF using the LATEST template, and re-sends it to the customer.
 * 
 * Usage:
 *   npx tsx scripts/resend-invoices.ts                     # Re-send Pro Forma for ALL orders
 *   npx tsx scripts/resend-invoices.ts --order 1025        # Re-send for a specific order number
 *   npx tsx scripts/resend-invoices.ts --type tax          # Re-send Tax Invoices for all shipped/delivered orders
 *   npx tsx scripts/resend-invoices.ts --dry-run           # Preview what would be sent without actually sending
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const orderNumberArg = args.includes("--order") ? args[args.indexOf("--order") + 1] : null;
  const invoiceType = args.includes("--type") ? args[args.indexOf("--type") + 1] : "proforma";
  const dryRun = args.includes("--dry-run");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Tailoring Turba — Bulk Invoice Re-generation Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Invoice Type : ${invoiceType === "tax" ? "Tax Invoice" : "Pro Forma Invoice"}`);
  console.log(`  Target       : ${orderNumberArg ? `Order #${orderNumberArg}` : "ALL orders"}`);
  console.log(`  Mode         : ${dryRun ? "DRY RUN (no emails will be sent)" : "LIVE (emails will be sent)"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Dynamically import the PDF and mail modules (they use Node APIs)
  const { generateInvoicePdf } = await import("../src/lib/pdf");
  const { sendOrderConfirmationEmail, sendTaxInvoiceEmail } = await import("../src/lib/mail");

  // Build the query filter
  const where: any = {};
  if (orderNumberArg) {
    where.orderNumber = parseInt(orderNumberArg, 10);
  }
  if (invoiceType === "tax") {
    // Only send tax invoices for orders that have been shipped or delivered
    where.status = { in: ["SHIPPED", "DELIVERED"] };
  } else {
    // For proforma, skip cancelled orders
    where.status = { notIn: ["CANCELLED"] };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true, phone: true } },
      shippingAddress: true,
    },
    orderBy: { orderNumber: "asc" },
  });

  if (orders.length === 0) {
    console.log("❌ No orders found matching the criteria.\n");
    return;
  }

  console.log(`📦 Found ${orders.length} order(s) to process.\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const order of orders) {
    const displayNo = order.orderNumber ?? order.id.slice(-8).toUpperCase();

    if (!order.user?.email) {
      console.log(`  ⚠️  Order #${displayNo} — Skipped (no customer email)`);
      skipCount++;
      continue;
    }

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
      items: order.items.map((i) => ({
        product: { name: i.product.name },
        quantity: i.quantity,
        price: i.price,
      })),
      type: invoiceType === "tax" ? ("INVOICE" as const) : ("PRO FORMA INVOICE" as const),
    };

    if (dryRun) {
      console.log(`  📄 Order #${displayNo} → ${order.user.email} — Would send ${invoiceType === "tax" ? "Tax" : "Pro Forma"} Invoice`);
      successCount++;
      continue;
    }

    try {
      const pdfBuffer = await generateInvoicePdf(pdfOrder);

      if (invoiceType === "tax") {
        await sendTaxInvoiceEmail(
          order.user.email,
          order.user.name || "Customer",
          order.id,
          pdfBuffer,
          order.orderNumber ?? undefined
        );
      } else {
        await sendOrderConfirmationEmail(
          order.user.email,
          order.user.name || "Customer",
          order.id,
          order.isSplitPayment ?? false,
          order.amountPaid ?? 0,
          pdfBuffer,
          order.orderNumber ?? undefined
        );
      }

      console.log(`  ✅ Order #${displayNo} → ${order.user.email} — Sent!`);
      successCount++;

      // Small delay between emails to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`  ❌ Order #${displayNo} — FAILED: ${err.message}`);
      errorCount++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Results: ✅ ${successCount} sent, ⚠️ ${skipCount} skipped, ❌ ${errorCount} failed`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
