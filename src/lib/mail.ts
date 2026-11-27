import nodemailer from "nodemailer";
import { Resend } from "resend";

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
  const from = process.env.EMAIL_FROM || '"Tailoring Turba" <no-reply@tailoringturba.com>';

  // Check if Resend API Key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      if (error) {
        console.error("Error sending email via Resend: ", error);
        return { success: false, error };
      }

      console.log("Email sent via Resend: ", data?.id);
      return { success: true, messageId: data?.id };
    } catch (resendError) {
      console.error("Error invoking Resend SDK: ", resendError);
      return { success: false, error: resendError };
    }
  }

  // Fallback to standard Nodemailer SMTP configuration
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
    from,
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

export const sendOperationsBookingAlert = async (bookingId: string, bookingDetailsUrl: string, customerName: string, date: string, timeSlot: string, customerEmail?: string | null, customerPhone?: string | null) => {
  const subject = `[NEW BOOKING] Studio Visit Requested — ${date} at ${timeSlot}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #435b43; margin-top: 0;">📅 New Studio Visit Booked</h2>
        <p>Hello,</p>
        <p>A new studio visit has been scheduled. Here are the details:</p>
        <div style="background-color: #f4ebd0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #435b43;">
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b6b65; text-transform: uppercase; letter-spacing: 1px;">Appointment Details</p>
          <p style="margin: 8px 0;"><strong>👤 Client Name:</strong> ${customerName}</p>
          <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${date}</p>
          <p style="margin: 8px 0;"><strong>⏰ Time Slot:</strong> ${timeSlot}</p>
          ${customerEmail ? `<p style="margin: 8px 0;"><strong>📧 Email:</strong> <a href="mailto:${customerEmail}" style="color: #435b43;">${customerEmail}</a></p>` : ""}
          ${customerPhone ? `<p style="margin: 8px 0;"><strong>📞 Phone:</strong> <a href="tel:${customerPhone}" style="color: #435b43;">${customerPhone}</a></p>` : ""}
        </div>
        <p>Please confirm the appointment with the client and ensure the studio is prepared.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingDetailsUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; background-color: #435b43; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View All Bookings in Admin
          </a>
        </div>
        <p style="font-size: 13px; color: #6b6b65;">This is an automated notification from the Tailoring Turba booking system.</p>
      </div>
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
  orderNumber?: number,
  estimatedDeliveryRange?: string
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
          ${estimatedDeliveryRange ? `<p style="margin: 6px 0; color: #435b43;"><strong>🚚 Estimated Delivery:</strong> ${estimatedDeliveryRange}</p>` : ""}
        </div>

        <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 20px 0;">
          <strong>Important Cancellation Policy Reminder:</strong><br/>
          If you cancel this order within <strong>24 hours</strong> of placement, you will receive a <strong>75% refund</strong> of the paid amount (25% fee will be deducted for administrative costs). After 24 hours, no refund will be provided because customization and fabric-cutting will have already begun.
          <br/><br/>
          <em>*Please note: Delivery dates may vary slightly depending on exact manufacturing requirements and courier transit times.</em>
        </p>

        <p>Your <strong>Pro Forma Invoice</strong> has been attached to this email. Your official Tax Invoice will be sent when your order is dispatched.</p>
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
        filename: `ProForma_Invoice_${displayNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

export const sendTaxInvoiceEmail = async (
  email: string,
  name: string,
  orderId: string,
  pdfBuffer: Buffer,
  orderNumber?: number
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Your Tax Invoice — Tailoring Turba Order #${displayNo}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #435b43; margin-top: 0;">Your Order Has Been Dispatched! 🚚</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Great news! Your order <strong>#${displayNo}</strong> has been dispatched and is on its way to you.</p>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; text-transform: uppercase; letter-spacing: 1px;">What's Next?</p>
          <p style="margin: 6px 0;">📄 Your official <strong>Tax Invoice</strong> is attached to this email.</p>
          <p style="margin: 6px 0;">📦 Your package is on its way — tracking details will be shared shortly.</p>
        </div>

        <p>Please keep this Tax Invoice for your GST records. If you have any questions, feel free to reach out to us.</p>
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
        filename: `Tax_Invoice_${displayNo}.pdf`,
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
  orderNumber?: number,
  // true only when Razorpay actually confirmed the refund; must stay false if the
  // automatic refund attempt threw (see src/app/api/orders/[id]/route.ts) so we never
  // tell a customer a refund is on its way when it never left the ground.
  refundSucceeded: boolean = true
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Order Cancelled — Tailoring Turba #${displayNo}`;
  const refundIsPending = within24h && !refundSucceeded;
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

        ${refundIsPending
          ? `<p>Your order qualifies for a <strong>₹${refundedAmount.toLocaleString('en-IN')}</strong> refund, but we were not able to process it automatically. Our team has been notified and will initiate your refund manually — please allow a little longer than our usual 5-7 business days, and reach out if you don't hear from us within 2 business days.</p>`
          : within24h
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

export const sendOrderDeliveredEmail = async (
  email: string,
  name: string,
  orderId: string,
  orderNumber?: number
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Your Order has been Delivered! 🎉 — Tailoring Turba #${displayNo}`;
  const feedbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/feedback/${orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #435b43; margin-top: 0;">Order Delivered Successfully! 📦</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your order <strong>#${displayNo}</strong> has been marked as Delivered!</p>
        <p>We hope you are thrilled with your custom apparel. It was a pleasure crafting this order for you.</p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${feedbackUrl}" style="background-color: #435b43; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Share Your Feedback</a>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; text-transform: uppercase; letter-spacing: 1px;">What's Next?</p>
          <p style="margin: 6px 0;">If you have any feedback or concerns regarding your order, please reach out to us within 48 hours.</p>
          <p style="margin: 6px 0;">Looking to place a reorder? Simply log in to your account and go to your Orders section.</p>
        </div>

        <p>Thank you for choosing Tailoring Turba!</p>
        <p>Best regards,<br/>The Tailoring Turba Team</p>
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, html });
};

export const sendVerificationEmail = async (email: string, token: string, name?: string | null) => {
  const firstName = (name || "Customer").trim().split(" ")[0];
  const subject = "Verify your Tailoring Turba account";
  const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px; color: #1a1a1a; line-height: 1.6;">
        <p>Hi ${firstName},</p>
        <p>Thanks for creating your Tailoring Turba account.</p>
        <p>Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; background-color: #435b43; color: #ffffff; text-decoration: none; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
            Verify My Email
          </a>
        </div>
        <p>This verification link expires in 24 hours.</p>
        <p>If you did not create this account, you can safely ignore this email.</p>
        <p>Best regards,<br/>The Tailoring Turba Team</p>
      </div>
  `;

  return sendMail({ to: email, subject, html });
};

export const sendOutForDeliveryEmail = async (
  email: string,
  name: string,
  orderId: string,
  orderNumber?: number,
  awbNumber?: string,
  courierName?: string,
  balanceDuePaise: number = 0
) => {
  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();
  const subject = `Your Order is Out for Delivery! 🚚 — Tailoring Turba #${displayNo}`;
  const isPaidInFull = balanceDuePaise === 0;
  const payUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/checkout/pay-balance?orderId=${orderId}`;
  const trackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/orders`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #435b43; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA</h1>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #435b43; margin-top: 0;">Your Order is Out for Delivery Today! 🚚</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Great news! Your tailored apparel order <strong>#${displayNo}</strong> is on the delivery vehicle and heading your way today.</p>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Delivery Details</p>
          <p style="margin: 6px 0;">📦 <strong>Courier:</strong> ${courierName || "Carrier Partner"}</p>
          ${awbNumber ? `<p style="margin: 6px 0;">🏷️ <strong>Tracking No (AWB):</strong> ${awbNumber}</p>` : ""}
          <p style="margin: 6px 0;">💰 <strong>Payment Status:</strong> ${
            isPaidInFull
              ? '<span style="color: #16a34a; font-weight: bold;">Paid in Full ✓</span>'
              : `<span style="color: #d97706; font-weight: bold;">Balance Due: ₹${(balanceDuePaise / 100).toFixed(2)}</span>`
          }</p>
        </div>

        ${
          !isPaidInFull
            ? `
          <div style="text-align: center; margin: 28px 0;">
            <a href="${payUrl}" style="background-color: #d97706; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
              Pay Remaining Balance (₹${(balanceDuePaise / 100).toFixed(2)})
            </a>
          </div>
        `
            : `
          <div style="text-align: center; margin: 28px 0;">
            <a href="${trackUrl}" style="background-color: #435b43; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
              Track in Your Account
            </a>
          </div>
        `
        }

        <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 24px;">
          Please ensure someone is available at your shipping address to receive the package.
        </p>

        <p>Best regards,<br/>The Tailoring Turba Team</p>
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, html });
};

