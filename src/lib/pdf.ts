import PDFDocument from 'pdfkit';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface InvoiceOrder {
  id: string;
  orderNumber: number;
  createdAt: Date;
  totalAmount: number;
  isSplitPayment: boolean;
  amountPaid: number;
  remainingAmount: number;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
}

export function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Color Palette - Sunset Creative / Brand Colors
      const primaryColor = '#435b43'; // Brand Green
      const secondaryColor = '#d97706'; // Accent Orange/Gold
      const textMuted = '#6b7280'; // Gray
      const textDark = '#1f2937'; // Almost black
      const lightBg = '#f9fafb';
      const borderLine = '#e5e7eb';

      // 1. Header (Brand Logo & Invoice Title)
      doc.fillColor(primaryColor)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('TAILORING TURBA', 50, 50);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textMuted)
         .text('Premium Custom Apparel', 50, 75);

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('INVOICE', 400, 50, { align: 'right', width: 145 });

      // Divider Line
      doc.moveTo(50, 105).lineTo(545, 105).strokeColor(borderLine).stroke();

      // 2. Invoice Metadata & Billing Info
      // Left side: Billing & Shipping info
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Billed To:', 50, 125);
      
      const customerName = order.user.name || 'Valued Customer';
      doc.font('Helvetica')
         .fillColor(textDark)
         .text(customerName, 50, 140)
         .text(order.user.email || '', 50, 155)
         .text(order.user.phone || '', 50, 170);

      if (order.shippingAddress) {
        doc.font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('Shipping Address:', 50, 195)
           .font('Helvetica')
           .fillColor(textDark)
           .text(order.shippingAddress.name, 50, 210)
           .text(`${order.shippingAddress.street}`, 50, 225)
           .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 50, 240)
           .text(order.shippingAddress.country, 50, 255);
      }

      // Right side: Order & Invoice details
      doc.font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Invoice Details:', 350, 125);

      const displayOrderNo = order.orderNumber ? String(order.orderNumber) : order.id.slice(-8).toUpperCase();
      doc.font('Helvetica')
         .fillColor(textDark)
         .text(`Invoice No: INV-${displayOrderNo}`, 350, 140)
         .text(`Order ID: #${order.id.slice(-8).toUpperCase()}`, 350, 155)
         .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 350, 170)
         .text(`Payment Status: ${order.isSplitPayment ? (order.remainingAmount === 0 || order.amountPaid >= order.totalAmount ? 'Fully Paid' : 'Partially Paid (60%)') : 'Paid (100%)'}`, 350, 185);

      // Divider Line
      doc.moveTo(50, 280).lineTo(545, 280).strokeColor(borderLine).stroke();

      // 3. Table Header
      let y = 300;
      doc.rect(50, y, 495, 20).fill(lightBg);
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Item Description', 60, y + 6)
         .text('Price (INR)', 280, y + 6, { width: 80, align: 'right' })
         .text('Qty', 380, y + 6, { width: 50, align: 'right' })
         .text('Amount (INR)', 450, y + 6, { width: 85, align: 'right' });

      // Table Rows
      y += 20;
      doc.font('Helvetica').fontSize(9).fillColor(textDark);

      // Calculate totals
      let subtotal = 0;
      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        // Draw row bottom line
        doc.moveTo(50, y + 20).lineTo(545, y + 20).strokeColor(borderLine).stroke();

        doc.text(item.product.name, 60, y + 6, { width: 210, lineBreak: false })
           .text(`₹${item.price.toLocaleString('en-IN')}`, 280, y + 6, { width: 80, align: 'right' })
           .text(String(item.quantity), 380, y + 6, { width: 50, align: 'right' })
           .text(`₹${itemTotal.toLocaleString('en-IN')}`, 450, y + 6, { width: 85, align: 'right' });

        y += 20;
      });

      // 4. Financial Calculations Summary
      y += 10;
      const rightColLabelX = 330;
      const rightColValX = 450;
      const colWidth = 85;

      // Calculate setup & tax matches
      // Since estimatedTotal is subtotal + designCharge + gst, and gst is 5% of subtotal + designCharge
      // Let's deduce design charge or set it based on difference
      // For invoice PDF, we can show subtotal, GST (5%), and total
      const rawGst = Math.round(subtotal * 0.05);
      const totalAmount = order.totalAmount;
      const designCharge = Math.max(0, Math.round(totalAmount - subtotal - rawGst));
      const finalGst = Math.round((subtotal + designCharge) * 0.05);

      // Subtotal
      doc.fontSize(9).font('Helvetica')
         .text('Subtotal:', rightColLabelX, y, { width: 110, align: 'right' })
         .text(`₹${subtotal.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });

      y += 15;
      if (designCharge > 0) {
        doc.text('Design & Setup Charge:', rightColLabelX, y, { width: 110, align: 'right' })
           .text(`₹${designCharge.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });
        y += 15;
      }

      // GST
      doc.text('GST (5%):', rightColLabelX, y, { width: 110, align: 'right' })
         .text(`₹${finalGst.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });

      y += 20;

      // Divider Line before Grand Total
      doc.moveTo(330, y).lineTo(545, y).strokeColor(borderLine).stroke();
      y += 5;

      // Grand Total
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor)
         .text('Grand Total:', rightColLabelX, y, { width: 110, align: 'right' })
         .text(`₹${totalAmount.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });

      y += 25;

      // Split Payment Details (if bulk)
      if (order.isSplitPayment) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor)
           .text('Split Payment Schedule (Bulk Order 60/40):', 250, y, { width: 295, align: 'right' });
        
        y += 15;
        doc.font('Helvetica').fillColor(textDark)
           .text(`Paid to Date (60%):`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(`₹${order.amountPaid.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        const balDue = order.remainingAmount;
        doc.text(`Balance Due (40%):`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(`₹${balDue.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        doc.font('Helvetica-Bold')
           .text(`Balance Status:`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(balDue === 0 || order.amountPaid >= order.totalAmount ? 'Fully Paid' : 'Due on Dispatch', rightColValX, y, { width: colWidth, align: 'right', color: balDue === 0 ? primaryColor : secondaryColor });
      } else {
        doc.fontSize(9).font('Helvetica').fillColor(textDark)
           .text(`Amount Paid (100%):`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(`₹${order.amountPaid.toLocaleString('en-IN')}`, rightColValX, y, { width: colWidth, align: 'right' });
      }

      // 5. Terms & Cancellation Policy footer
      // Pinned to bottom of the A4 page
      const footerY = 700;
      doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).strokeColor(borderLine).stroke();

      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('CANCELLATION & REFUND POLICY', 50, footerY);

      doc.fillColor(textMuted)
         .font('Helvetica')
         .fontSize(7.5)
         .text('Orders cancelled within 24 hours of placement will receive a 75% refund of the paid amount (25% fee deducted). Cancellations requested after 24 hours from order placement are non-refundable, as customization and raw material processing begins immediately.', 50, footerY + 12, { width: 495, align: 'justify', lineGap: 2 });

      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Thank you for choosing Tailoring Turba!', 50, footerY + 50, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
