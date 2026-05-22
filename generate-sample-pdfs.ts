import { generateInvoicePdf, InvoiceOrder } from "./src/lib/pdf";
import fs from "fs";

async function main() {
  const dummyOrder: InvoiceOrder = {
    id: "ord_123456789abc",
    orderNumber: 1042,
    createdAt: new Date(),
    totalAmount: 15500,
    isSplitPayment: true,
    amountPaid: 9300,
    remainingAmount: 6200,
    user: {
      name: "John Doe",
      email: "tailoringturba@gmail.com",
      phone: "+91 9876543210"
    },
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street, Apt 4B",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India"
    },
    items: [
      {
        product: { name: "Custom Polo Shirt (Black)" },
        quantity: 50,
        price: 250
      },
      {
        product: { name: "Custom Polo Shirt (White)" },
        quantity: 10,
        price: 250
      }
    ],
    type: "INVOICE"
  };

  const proFormaOrder: InvoiceOrder = {
    ...dummyOrder,
    type: "PRO FORMA INVOICE",
    orderNumber: 1043,
  };

  try {
    const invoicePdf = await generateInvoicePdf(dummyOrder);
    const proFormaPdf = await generateInvoicePdf(proFormaOrder);

    fs.writeFileSync("./public/Sample_Invoice.pdf", invoicePdf);
    fs.writeFileSync("./public/Sample_Pro_Forma_Invoice.pdf", proFormaPdf);
    
    console.log("Successfully generated sample PDFs in the public folder!");
  } catch (err) {
    console.error("Failed to generate PDFs:", err);
  }
}

main();
