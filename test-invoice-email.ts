import { sendMail } from "./src/lib/mail";
import { generateInvoicePdf, InvoiceOrder } from "./src/lib/pdf";

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

    await sendMail({
      to: "tailoringturba@gmail.com",
      subject: "Sample Invoice and Pro Forma Invoice",
      html: `
        <h2>Here are your sample invoices!</h2>
        <p>You requested to see what the generated PDF invoices look like. I have attached both a standard tax <b>Invoice</b> and a <b>Pro Forma Invoice</b> to this email.</p>
        <p>Best regards,<br/>Your AI Assistant</p>
      `,
      attachments: [
        {
          filename: 'Sample_Invoice.pdf',
          content: invoicePdf,
          contentType: 'application/pdf'
        },
        {
          filename: 'Sample_Pro_Forma_Invoice.pdf',
          content: proFormaPdf,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log("Successfully sent sample invoices to tailoringturba@gmail.com!");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

main();
