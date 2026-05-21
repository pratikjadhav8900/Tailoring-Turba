import nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export const sendMail = async ({ to, subject, html, attachments }: SendMailOptions) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Tailoring Turba" <no-reply@tailoringturba.com>',
    to,
    subject,
    html,
    ...(attachments && { attachments }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  const subject = "Your Password Reset OTP - Tailoring Turba";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #435b43;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for your Tailoring Turba account. Please use the following One-Time Password (OTP) to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #f4f4f4; border-radius: 8px; letter-spacing: 5px;">
          ${otp}
        </span>
      </div>
      <p>This OTP is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
      <p>Best regards,<br/>The Tailoring Turba Team</p>
    </div>
  `;

  return sendMail({ to: email, subject, html });
};

export const sendOperationsOrderAlert = async (orderId: string, orderDetailsUrl: string) => {
  const subject = `[URGENT] New Custom Order Received - #${orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #435b43;">New Order Requires Fulfillment</h2>
      <p>Hello Operations Team,</p>
      <p>A new custom order (<strong>#${orderId}</strong>) has been successfully placed and is awaiting fulfillment.</p>
      <p>Please click the button below to view the order details, customer shipping address, print mockups, and to download the raw high-resolution assets.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${orderDetailsUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; background-color: #435b43; color: #ffffff; text-decoration: none; border-radius: 6px;">
          View Order & Download Assets
        </a>
      </div>
      <p>Best regards,<br/>The Tailoring Turba Automated System</p>
    </div>
  `;

  return sendMail({ to: "tailoringturba@gmail.com", subject, html });
};

export const sendOperationsBookingAlert = async (bookingId: string, bookingDetailsUrl: string, customerName: string, date: string, timeSlot: string) => {
  const subject = `[NEW BOOKING] Tailoring Visit Requested - ${date}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #435b43;">New Tailoring Appointment Booked</h2>
      <p>Hello Operations Team,</p>
      <p>A new tailoring visit/consultation has been requested by <strong>${customerName}</strong>.</p>
      <div style="background-color: #f4ebd0; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 0;"><strong>Time Slot:</strong> ${timeSlot}</p>
      </div>
      <p>Please click the button below to view the booking details in the admin portal.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${bookingDetailsUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; background-color: #435b43; color: #ffffff; text-decoration: none; border-radius: 6px;">
          View All Bookings
        </a>
      </div>
      <p>Best regards,<br/>The Tailoring Turba Automated System</p>
    </div>
  `;

  return sendMail({ to: "tailoringturba@gmail.com", subject, html });
};

export const sendCustomerBookingConfirmation = async (
  customerEmail: string,
  customerName: string,
  date: string,
  timeSlot: string,
  notes?: string | null
) => {
  const subject = "Your Appointment is Confirmed — Tailoring Turba";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #435b43; margin-top: 0;">Appointment Confirmed ✓</h2>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Thank you for booking a tailoring consultation with us! We look forward to meeting you.</p>
        <div style="background-color: #f4ebd0; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #435b43;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b6b65; text-transform: uppercase; letter-spacing: 1px;">Appointment Details</p>
          <p style="margin: 6px 0;"><strong>📅 Date:</strong> ${date}</p>
          <p style="margin: 6px 0;"><strong>⏰ Time:</strong> ${timeSlot}</p>
          ${notes ? `<p style="margin: 6px 0;"><strong>📝 Notes:</strong> ${notes}</p>` : ""}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tailoring+Turba+Visit&details=Tailoring+consultation+appointment+for+${encodeURIComponent(customerName)}.&location=Tailoring+Turba+Showroom" style="display: inline-block; padding: 12px 24px; font-size: 15px; font-weight: bold; background-color: #4285F4; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Add to Google Calendar
          </a>
        </div>
        <p>If you need to reschedule or have any questions, please reply to this email or reach us on WhatsApp.</p>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #6b6b65; text-align: center;">
          <p>Tailoring Turba | Custom B2B Apparel Manufacturer</p>
          <p>📧 tailoringturba@gmail.com</p>
        </div>
      </div>
    </div>
  `;
  return sendMail({ to: customerEmail, subject, html });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  orderId: string,
  isSplit: boolean,
  amountPaid: number,
  pdfBuffer: Buffer,
  orderNumber?: number
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Your Order is Confirmed — Tailoring Turba #${displayNo}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #435b43; margin-top: 0;">Order Confirmed! ✓</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for your order! We have received your payment of <strong>₹${amountPaid.toLocaleString('en-IN')}</strong> and our workshop is starting production immediately.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #435b43;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b6b65; text-transform: uppercase; letter-spacing: 1px;">Order Summary</p>
          <p style="margin: 6px 0;"><strong>📦 Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
          <p style="margin: 6px 0;"><strong>💰 Payment Type:</strong> ${isSplit ? "60% Split Payment (Bulk Order)" : "100% Full Payment"}</p>
          <p style="margin: 6px 0;"><strong>💳 Paid Amount:</strong> ₹${amountPaid.toLocaleString('en-IN')}</p>
          ${isSplit ? `<p style="margin: 6px 0; color: #d97706;"><strong>⏳ Balance Remaining:</strong> 40% (Due on dispatch)</p>` : ""}
        </div>

        <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 20px 0;">
          <strong>Important Cancellation Policy Reminder:</strong><br/>
          If you cancel this order within <strong>24 hours</strong> of placement, you will receive a <strong>75% refund</strong> of the paid amount (25% fee will be deducted for administrative costs). After 24 hours, no refund will be provided because customization and fabric-cutting will have already begun.
        </p>

        <p>Your official tax invoice PDF has been attached to this email.</p>
        <p>Best regards,<br/>The Tailoring Turba Team</p>
      </div>
    </div>
  `;

  return sendMail({
    to: email,
    subject,
    html,
    attachments: [
      {
        filename: `Invoice_Order_${displayNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

export const sendBalancePaymentRequestEmail = async (
  email: string,
  name: string,
  orderId: string,
  balanceAmount: number,
  paymentLink: string,
  orderNumber?: number
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Action Required: Pay remaining 40% balance for Order #${displayNo}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #d97706; margin-top: 0;">Your Order is Ready to Ship! 🚚</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Great news! Your custom order <strong>#${orderId.slice(-8).toUpperCase()}</strong> is fully produced and ready to leave the warehouse.</p>
        <p>As per the bulk split-payment agreement, the remaining 40% balance of <strong>₹${balanceAmount.toLocaleString('en-IN')}</strong> is now due before dispatch.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: bold; background-color: #435b43; color: #ffffff; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px;">
            Pay Remaining Balance (₹${balanceAmount.toLocaleString('en-IN')})
          </a>
        </div>

        <p style="font-size: 13px; color: #6b6b65; line-height: 1.5;">
          If the button above does not work, please copy and paste the following URL into your browser:<br/>
          <a href="${paymentLink}" style="color: #2563eb;">${paymentLink}</a>
        </p>

        <p>Once the payment is completed, we will immediately hand over your package to the shipping courier and send your tracking details.</p>
        <p>Best regards,<br/>The Tailoring Turba Team</p>
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, html });
};

export const sendOrderCancellationEmail = async (
  email: string,
  name: string,
  orderId: string,
  amountPaid: number,
  refundedAmount: number,
  feeDeducted: number,
  within24h: boolean,
  orderNumber?: number
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Order Cancelled — Tailoring Turba #${displayNo}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #dc2626; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #dc2626; margin-top: 0;">Order Cancellation Confirmation</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been successfully cancelled.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #991b1b; text-transform: uppercase; letter-spacing: 1px;">Refund Details</p>
          <p style="margin: 6px 0;"><strong>💰 Amount Paid:</strong> ₹${amountPaid.toLocaleString('en-IN')}</p>
          <p style="margin: 6px 0;"><strong>🕒 Cancelled Within 24h:</strong> ${within24h ? "Yes" : "No"}</p>
          <p style="margin: 6px 0;"><strong>✂️ Cancellation Fee (25%):</strong> ₹${feeDeducted.toLocaleString('en-IN')}</p>
          <p style="margin: 6px 0; font-weight: bold; color: #16a34a;"><strong>💵 Refund Amount (75%):</strong> ₹${refundedAmount.toLocaleString('en-IN')}</p>
        </div>

        ${within24h 
          ? `<p>The refund amount of <strong>₹${refundedAmount.toLocaleString('en-IN')}</strong> will be processed back to your original payment method via Razorpay within 5-7 business days.</p>` 
          : `<p>As the order was cancelled after 24 hours of placement, fabric customization and cutting had already begun. Therefore, no refund can be issued, and the cancellation fee equals the amount paid.</p>`
        }
        
        <p>If you have any questions, please feel free to reach out to our customer support team.</p>
        <p>Best regards,<br/>The Tailoring Turba Team</p>
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, html });
};
