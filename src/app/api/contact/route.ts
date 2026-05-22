export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { sanitize } from "@/lib/sanitize";
import { generateInvoicePdf, InvoiceOrder } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    let { name, email, phone, company, quantity, message, cartItems, totalAmount, customCharge } = await req.json();

    if (!name || !email || !phone || !message) {
      return NextResponse.json({ error: "Name, email, phone and message are required." }, { status: 400 });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    // Sanitize all inputs
    name = sanitize(name);
    email = sanitize(email);
    phone = sanitize(phone);
    company = sanitize(company);
    message = sanitize(message);


    // 0. Save to Database
    await prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        companyName: company,
        quantity: parseInt(quantity as string) || 0,
        requirements: message,
      }
    });

    // 1. Generate Pro Forma Invoice if cartItems exist
    let attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    if (cartItems && cartItems.length > 0) {
      try {
        const order: InvoiceOrder = {
          id: 'PF-' + Date.now().toString().slice(-6),
          orderNumber: Math.floor(Math.random() * 10000),
          createdAt: new Date(),
          totalAmount: totalAmount || 0,
          isSplitPayment: true,
          amountPaid: 0,
          remainingAmount: totalAmount || 0,
          type: 'PRO FORMA INVOICE',
          user: { name, email, phone },
          shippingAddress: { name: company || name, street: 'TBD', city: 'TBD', state: 'TBD', postalCode: '000000', country: 'IN' },
          items: cartItems
        };
        const pdfBuffer = await generateInvoicePdf(order);
        attachments.push({
          filename: `ProForma_Invoice_${company ? company.replace(/\s+/g, '_') : name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      } catch (err) {
        console.error("Failed to generate Pro Forma Invoice PDF:", err);
      }
    }

    // 2. Alert operations team
    const opsHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #435b43;">📩 New Bulk Quote Request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: 700; width: 140px; color: #555;">Name:</td><td style="padding: 8px 0;">${name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 700; color: #555;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: 700; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; font-weight: 700; color: #555;">Company:</td><td style="padding: 8px 0;">${company || "—"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 700; color: #555;">Quantity:</td><td style="padding: 8px 0;">${quantity || "—"} units</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 700; color: #555; vertical-align: top;">Message:</td><td style="padding: 8px 0; white-space: pre-wrap;">${message}</td></tr>
        </table>
        ${attachments.length > 0 ? `<div style="margin-top: 15px; padding: 10px; background: #e8f5e9; color: #2e7d32; border-radius: 4px; font-weight: bold;">📎 Pro Forma Invoice Generated & Attached</div>` : ''}
        <div style="margin-top: 20px; padding: 12px; background: #f4ebd0; border-radius: 6px; font-size: 13px; color: #6b6b65;">
          Reply to this email or call the customer directly to follow up within 24 hours.
        </div>
      </div>
    `;

    await sendMail({
      to: "tailoringturba@gmail.com",
      subject: `[NEW QUOTE] ${company || name} — ${quantity || "?"} units`,
      html: opsHtml,
      attachments
    });

    // 3. Confirmation to customer
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
        </div>
        <div style="padding: 28px 24px;">
          <h2 style="color: #435b43; margin-top: 0;">We've received your enquiry ✓</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for reaching out! We've received your bulk quote request and our team will get back to you within <strong>24 hours</strong> with a personalised pricing sheet.</p>
          <div style="background-color: #f4ebd0; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #435b43;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b6b65; text-transform: uppercase; letter-spacing: 1px;">Your Request Summary</p>
            ${company ? `<p style="margin: 6px 0;"><strong>Company:</strong> ${company}</p>` : ""}
            ${quantity ? `<p style="margin: 6px 0;"><strong>Quantity:</strong> ${quantity} units</p>` : ""}
            <p style="margin: 6px 0;"><strong>Message:</strong> ${message}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e9ecef;">
            <h3 style="margin-top: 0; color: #333; font-size: 16px;">Important Terms & Conditions</h3>
            <ul style="padding-left: 20px; color: #555; line-height: 1.5; font-size: 14px;">
              <li><strong>Payment Terms:</strong> Bulk orders require a 60% advance payment to initiate production, with the remaining 40% balance due prior to final dispatch.</li>
              <li><strong>Refund Policy:</strong> Due to the highly customized nature of our products, custom bulk orders are non-refundable once production has commenced. Defective or misprinted items will be replaced upon immediate notification after delivery.</li>
            </ul>
          </div>
          
          <p>In the meantime, feel free to WhatsApp us at <strong>+91 90225 53346</strong> for any urgent queries.</p>
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #6b6b65; text-align: center;">
            <p>Tailoring Turba | Custom B2B Apparel Manufacturer</p>
            <p>📧 tailoringturba@gmail.com &nbsp;|&nbsp; 📱 +91 90225 53346</p>
          </div>
        </div>
      </div>
    `;

    await sendMail({
      to: email,
      subject: "Your Bulk Quote Request — Tailoring Turba",
      html: customerHtml,
      attachments
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CONTACT_FORM]", err);
    return NextResponse.json({ error: "Failed to send enquiry." }, { status: 500 });
  }
}

