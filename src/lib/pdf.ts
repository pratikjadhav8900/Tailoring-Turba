import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import converter from 'number-to-words';
import fs from 'fs';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

function getHsnForProductName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trouser") || n.includes("pant")) return "6203";
  if (n.includes("shirt") && !n.includes("t-shirt") && !n.includes("polo") && !n.includes("tee") && !n.includes("sweatshirt")) return "6205";
  if (n.includes("hoodie") || n.includes("sweatshirt") || n.includes("jacket")) return "6110";
  if (n.includes("lab coat") || n.includes("apron")) return "6211";
  if (n.includes("bag") || n.includes("duffel")) return "4202";
  if (n.includes("pen") || n.includes("keychain")) return "7326";
  if (n.includes("bottle") || n.includes("flask") || n.includes("mug")) return "3922";
  return "6109"; // Default: T-shirts, Polos (knitted)
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
  type?: 'INVOICE' | 'PRO FORMA INVOICE';
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, color = '#3b82f6') {
  doc.moveTo(x1, y1).lineTo(x2, y2).strokeColor(color).lineWidth(1).stroke();
}

function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill = false, color = '#3b82f6') {
  doc.rect(x, y, w, h).strokeColor(color).lineWidth(1).stroke();
}

export function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const brandColor = '#3b82f6'; // Blue borders
      const headerColor = '#e0f2fe'; // Light blue backgrounds
      
      const pageWidth = 595.28;
      const margin = 30;
      const rightMargin = pageWidth - margin;
      
      let y = 30;

      // 1. HEADER (Logo + Company Info)
      if (fs.existsSync(process.cwd() + '/public/logo_hd.png')) {
        doc.image(process.cwd() + '/public/logo_hd.png', margin, y - 10, { fit: [150, 60] });
      } else {
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(16).text('Tailoring Turba LLP', margin, y);
      }
      
      doc.font('Helvetica').fontSize(8)
         .text('321/a1, Sanjay Departments, Jawaharlal Nehru Marg', margin + 160, y)
         .text('New Timber Market', margin + 160, y + 10)
         .text('Pune, Maharashtra - 411002', margin + 160, y + 20);

      doc.font('Helvetica-Bold').fontSize(8)
         .text('Name : ', 400, y)
         .text('Phone : ', 400, y + 15)
         .text('Email : ', 400, y + 30);
         
      doc.font('Helvetica').fontSize(8)
         .text('Tailoring Turba LLP', 440, y)
         .text('9423704971', 440, y + 15)
         .text('tailoringturba@gmail.com', 440, y + 30);

      y = 90;
      drawLine(doc, margin, y, rightMargin, y, brandColor);
      
      // 2. GSTIN & INVOICE TYPE ROW
      const isProForma = order.type === 'PRO FORMA INVOICE';
      const docTypeLabel = isProForma ? 'Pro Forma Invoice' : 'Tax Invoice';
      const docNoLabel   = isProForma ? 'Proforma No.'     : 'Invoice No.';
      const docDateLabel = isProForma ? 'Proforma Date'    : 'Invoice Date';
      y += 5;
      doc.font('Helvetica-Bold').fontSize(10).text('GSTIN : 27AASFT6101D1Z7', margin + 5, y);
      doc.fillColor(brandColor).fontSize(14).text(docTypeLabel, 0, y, { align: 'center', width: pageWidth });
      doc.fillColor('#000000').font('Helvetica').fontSize(8).text('ORIGINAL FOR RECIPIENT', 0, y + 2, { align: 'right', width: rightMargin - 5 });

      y += 15;
      drawLine(doc, margin, y, rightMargin, y, brandColor);
      
      // 3. CUSTOMER DETAILS GRID
      const gridStartY = y;
      const customerBoxH = 70;
      drawRect(doc, margin, y, rightMargin - margin, customerBoxH, false, brandColor);
      
      // Vertical line splitting customer and invoice details
      const midX = 250;
      drawLine(doc, midX, y, midX, y + customerBoxH, brandColor);
      
      // Customer Details Header
      doc.font('Helvetica-Bold').fontSize(8).text('Customer Detail', margin, y + 3, { width: midX - margin, align: 'center' });
      drawLine(doc, margin, y + 15, midX, y + 15, brandColor);
      
      const displayOrderNo = order.orderNumber ? String(order.orderNumber) : order.id.slice(-8).toUpperCase();
      const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      
      // Right side Grid details
      doc.font('Helvetica').fontSize(8)
         .text(docNoLabel,   midX + 5,   y + 3)
         .text(displayOrderNo, midX + 70, y + 3)
         .text(docDateLabel, midX + 160, y + 3)
         .text(invoiceDate,  midX + 220, y + 3);
         
      drawLine(doc, midX, y + 15, rightMargin, y + 15, brandColor);
      doc.text('Completion Date', midX + 5, y + 18).text(invoiceDate, midX + 70, y + 18); // Default to invoice date for now
      
      // Customer Info mapping
      doc.font('Helvetica-Bold').fontSize(8)
         .text('M/S', margin + 5, y + 18)
         .text('Address', margin + 5, y + 28)
         .text('Phone', margin + 5, y + 48)
         .text('Place of Supply', margin + 5, y + 58);
         
      const customerName = order.user.name || 'Walk-in Customer';
      const addressString = order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}` : 'N/A';
      
      doc.font('Helvetica').fontSize(8)
         .text(customerName, margin + 60, y + 18)
         .text(addressString, margin + 60, y + 28, { width: midX - margin - 65, height: 20 })
         .text(order.user.phone || 'N/A', margin + 60, y + 48)
         .text(order.shippingAddress?.state || 'Maharashtra (27)', margin + 60, y + 58);

      y += customerBoxH + 5;
      
      // 4. MAIN ITEMS TABLE HEADER
      const tableHeaderY = y;
      const tableHeaderH = 25;
      
      // Draw Table Header Background
      doc.rect(margin, y, rightMargin - margin, tableHeaderH).fillAndStroke(headerColor, brandColor);
      
      // Define Columns (x coords)
      const cols = [
        margin,            // Sr No
        margin + 25,       // Name
        margin + 160,      // HSN
        margin + 195,      // Qty
        margin + 230,      // Rate
        margin + 280,      // Taxable Value
        margin + 335,      // CGST
        margin + 400,      // SGST
        margin + 465,      // Total
        rightMargin
      ];
      
      // Draw Vertical Lines for Header
      cols.forEach(x => {
        drawLine(doc, x, y, x, y + tableHeaderH, brandColor);
      });
      
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7);
      doc.text('Sr.\nNo.', cols[0], y + 5, { width: cols[1] - cols[0], align: 'center' });
      doc.text('Name of Product / Service', cols[1], y + 10, { width: cols[2] - cols[1], align: 'center' });
      doc.text('HSN / SAC', cols[2], y + 10, { width: cols[3] - cols[2], align: 'center' });
      doc.text('Qty', cols[3], y + 10, { width: cols[4] - cols[3], align: 'center' });
      doc.text('Rate', cols[4], y + 10, { width: cols[5] - cols[4], align: 'center' });
      doc.text('Taxable Value', cols[5], y + 10, { width: cols[6] - cols[5], align: 'center' });
      
      // Split CGST/SGST headers
      doc.text('CGST', cols[6], y + 3, { width: cols[7] - cols[6], align: 'center' });
      doc.text('SGST', cols[7], y + 3, { width: cols[8] - cols[7], align: 'center' });
      
      drawLine(doc, cols[6], y + 13, cols[8], y + 13, brandColor);
      drawLine(doc, cols[6] + 20, y + 13, cols[6] + 20, y + 25, brandColor);
      drawLine(doc, cols[7] + 20, y + 13, cols[7] + 20, y + 25, brandColor);
      
      doc.text('%', cols[6], y + 15, { width: 20, align: 'center' });
      doc.text('Amount', cols[6] + 20, y + 15, { width: cols[7] - cols[6] - 20, align: 'center' });
      doc.text('%', cols[7], y + 15, { width: 20, align: 'center' });
      doc.text('Amount', cols[7] + 20, y + 15, { width: cols[8] - cols[7] - 20, align: 'center' });
      
      doc.text('Total', cols[8], y + 10, { width: rightMargin - cols[8], align: 'center' });
      
      y += tableHeaderH;
      
      // 5. TABLE ROWS
      doc.font('Helvetica').fontSize(8);
      let subtotalQty = 0;
      let subtotalTaxable = 0;
      let subtotalCGST = 0;
      let subtotalSGST = 0;
      let grandTotal = 0;
      
      // Fixed row height for content block
      const rowsStartY = y;
      const rowsH = 200; // Fixed block to make table look like the image
      
      // Draw Table Vertical Lines down to the bottom of the table
      cols.forEach(x => {
        drawLine(doc, x, y, x, y + rowsH, brandColor);
      });
      drawLine(doc, cols[6] + 20, y, cols[6] + 20, y + rowsH, brandColor);
      drawLine(doc, cols[7] + 20, y, cols[7] + 20, y + rowsH, brandColor);
      
      let itemY = y + 5;
      
      order.items.forEach((item, idx) => {
        const taxable = item.price * item.quantity;
        const cgstRate = 2.5;
        const sgstRate = 2.5;
        const cgstAmt = taxable * (cgstRate / 100);
        const sgstAmt = taxable * (sgstRate / 100);
        const total = taxable + cgstAmt + sgstAmt;
        
        subtotalQty += item.quantity;
        subtotalTaxable += taxable;
        subtotalCGST += cgstAmt;
        subtotalSGST += sgstAmt;
        grandTotal += total;
        
        doc.font('Helvetica').text((idx + 1).toString(), cols[0], itemY, { width: cols[1] - cols[0], align: 'center', lineBreak: false });
        doc.font('Helvetica-Bold').text(item.product.name, cols[1] + 5, itemY, { width: cols[2] - cols[1] - 10 });
        doc.font('Helvetica').text(getHsnForProductName(item.product.name), cols[2], itemY, { width: cols[3] - cols[2], align: 'center', lineBreak: false });
        doc.text(item.quantity.toString() + ' SET', cols[3], itemY, { width: cols[4] - cols[3], align: 'center', lineBreak: false });
        doc.text(item.price.toFixed(2), cols[4] - 2, itemY, { width: cols[5] - cols[4], align: 'right', lineBreak: false });
        doc.text(taxable.toFixed(2), cols[5] - 2, itemY, { width: cols[6] - cols[5], align: 'right', lineBreak: false });
        doc.text(cgstRate.toFixed(2), cols[6], itemY, { width: 20, align: 'center', lineBreak: false });
        doc.text(cgstAmt.toFixed(2), cols[6] + 18, itemY, { width: cols[7] - cols[6] - 20, align: 'right', lineBreak: false });
        doc.text(sgstRate.toFixed(2), cols[7], itemY, { width: 20, align: 'center', lineBreak: false });
        doc.text(sgstAmt.toFixed(2), cols[7] + 18, itemY, { width: cols[8] - cols[7] - 20, align: 'right', lineBreak: false });
        doc.text(total.toFixed(2), cols[8] - 2, itemY, { width: rightMargin - cols[8], align: 'right', lineBreak: false });
        
        // Advance y for next item
        itemY += doc.heightOfString(item.product.name, { width: cols[2] - cols[1] - 10 }) + 5;
      });
      
      // Design/Setup charges (dynamically calculated)
      const expectedTotal = order.totalAmount;
      const discrepancy = expectedTotal - grandTotal;
      if (Math.abs(discrepancy) > 1) {
        // Assume difference is setup/design charge without GST for simplicity, or reverse calculate
        const designCharge = Math.max(0, discrepancy);
        subtotalTaxable += designCharge;
        grandTotal += designCharge;
        
        doc.font('Helvetica-Bold').text('Designing Charge', cols[1] + 5, itemY, { width: cols[2] - cols[1] - 10 });
        doc.font('Helvetica').text('-', cols[2], itemY, { width: cols[3] - cols[2], align: 'center', lineBreak: false });
        doc.text('-', cols[3], itemY, { width: cols[4] - cols[3], align: 'center', lineBreak: false });
        doc.text(designCharge.toFixed(2), cols[4] - 2, itemY, { width: cols[5] - cols[4], align: 'right', lineBreak: false });
        doc.text(designCharge.toFixed(2), cols[5] - 2, itemY, { width: cols[6] - cols[5], align: 'right', lineBreak: false });
        doc.text('0', cols[6], itemY, { width: 20, align: 'center', lineBreak: false });
        doc.text('0', cols[6] + 18, itemY, { width: cols[7] - cols[6] - 20, align: 'right', lineBreak: false });
        doc.text('0', cols[7], itemY, { width: 20, align: 'center', lineBreak: false });
        doc.text('0', cols[7] + 18, itemY, { width: cols[8] - cols[7] - 20, align: 'right', lineBreak: false });
        doc.text(designCharge.toFixed(2), cols[8] - 2, itemY, { width: rightMargin - cols[8], align: 'right', lineBreak: false });
      }

      y += rowsH;
      
      // 6. TOTAL ROW
      const totalRowH = 15;
      doc.rect(margin, y, rightMargin - margin, totalRowH).fillAndStroke(headerColor, brandColor);
      doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text('Total', cols[1], y + 4, { width: cols[3] - cols[1] - 5, align: 'right' });
      doc.text(subtotalQty.toFixed(2), cols[3], y + 4, { width: cols[4] - cols[3], align: 'center' });
      doc.text(subtotalTaxable.toFixed(2), cols[5] - 2, y + 4, { width: cols[6] - cols[5], align: 'right' });
      doc.text(subtotalCGST.toFixed(2), cols[6] + 18, y + 4, { width: cols[7] - cols[6] - 20, align: 'right' });
      doc.text(subtotalSGST.toFixed(2), cols[7] + 18, y + 4, { width: cols[8] - cols[7] - 20, align: 'right' });
      doc.text(grandTotal.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
      
      // Draw Total Row lines
      [cols[0], cols[3], cols[4], cols[5], cols[6], cols[7], cols[8], rightMargin].forEach(x => {
        drawLine(doc, x, y, x, y + totalRowH, brandColor);
      });
      y += totalRowH;

      // 7. SUMMARY & TAX BREAKDOWN BLOCK
      const wordsToAmount = converter.toWords(Math.round(grandTotal)).toUpperCase();
      const taxBoxY = y;
      
      // Total in words
      doc.rect(margin, y, cols[6] - margin, 15).fillAndStroke(headerColor, brandColor);
      doc.fillColor('#000000').text('Total in words', margin, y + 4, { width: cols[6] - margin, align: 'center' });
      drawLine(doc, margin, y + 15, cols[6], y + 15, brandColor);
      doc.font('Helvetica').fontSize(8).text(wordsToAmount + ' RUPEES ONLY', margin + 5, y + 20, { width: cols[6] - margin - 10, align: 'center' });
      
      // Bank Details Title
      y += 35;
      doc.rect(margin, y, cols[6] - margin, 15).fillAndStroke(headerColor, brandColor);
      doc.fillColor('#000000').font('Helvetica-Bold').text('Bank Details', margin, y + 4, { width: cols[6] - margin, align: 'center' });
      
      // Tax Breakdown on the Right Side
      y = taxBoxY;
      const taxBoxW = rightMargin - cols[6];
      doc.font('Helvetica-Bold').fontSize(8);
      
      const taxesInfo = [
        { label: 'Taxable Amount', val: subtotalTaxable.toFixed(2) },
        { label: 'Add : CGST', val: subtotalCGST.toFixed(2) },
        { label: 'Add : SGST', val: subtotalSGST.toFixed(2) },
        { label: 'Total Tax', val: (subtotalCGST + subtotalSGST).toFixed(2) }
      ];
      
      taxesInfo.forEach(t => {
        doc.text(t.label, cols[6] + 5, y + 4);
        doc.text(t.val, cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
        y += 15;
        drawLine(doc, cols[6], y, rightMargin, y, brandColor);
      });
      
      // Total Amount After Tax
      doc.rect(cols[6], y, taxBoxW, 15).fillAndStroke(headerColor, brandColor);
      doc.fillColor('#000000').text('Total Amount After Tax', cols[6] + 5, y + 4);
      doc.text('Rs. ' + grandTotal.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
      y += 15;
      drawLine(doc, cols[6], y, rightMargin, y, brandColor);
      
      // Payment Split Breakdown
      doc.font('Helvetica-Bold').fontSize(8);
      let advPaid = order.amountPaid || 0;
      let balDue = order.remainingAmount || 0;
      let qrAmount = grandTotal;
      
      if (order.type === 'PRO FORMA INVOICE') {
        advPaid = Math.round(grandTotal * 0.6);
        balDue = Math.round(grandTotal * 0.4);
        qrAmount = advPaid;
        doc.text('Required Advance (60%)', cols[6] + 5, y + 4);
        doc.text('Rs. ' + advPaid.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
        y += 15;
        drawLine(doc, cols[6], y, rightMargin, y, brandColor);
        doc.text('Balance Due (40%)', cols[6] + 5, y + 4);
        doc.text('Rs. ' + balDue.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
        y += 15;
        drawLine(doc, cols[6], y, rightMargin, y, brandColor);
      } else if (order.isSplitPayment) {
        qrAmount = balDue > 0 ? balDue : 0;
        doc.text('Advance Paid (60%)', cols[6] + 5, y + 4);
        doc.text('Rs. ' + advPaid.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
        y += 15;
        drawLine(doc, cols[6], y, rightMargin, y, brandColor);
        doc.text('Balance Due (40%)', cols[6] + 5, y + 4);
        doc.text('Rs. ' + balDue.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
        y += 15;
        drawLine(doc, cols[6], y, rightMargin, y, brandColor);
      } else {
        qrAmount = grandTotal;
        doc.text('Amount Paid (100%)', cols[6] + 5, y + 4);
        doc.text('Rs. ' + advPaid.toFixed(2), cols[8] - 2, y + 4, { width: rightMargin - cols[8], align: 'right' });
        y += 15;
        drawLine(doc, cols[6], y, rightMargin, y, brandColor);
      }
      
      // Right border for Tax box
      drawLine(doc, cols[6], taxBoxY, cols[6], y, brandColor);
      drawLine(doc, rightMargin, taxBoxY, rightMargin, y, brandColor);
      
      // 8. BANK DETAILS INFO (Left Side) & QR
      const bankDetailsY = taxBoxY + 52; // small top padding so text clears the header border
      doc.font('Helvetica').fontSize(8);
      const bLeft = margin + 8;
      const bRight = margin + 68;
      const rowH = 13; // compact row height
      doc.text('Name',       bLeft, bankDetailsY);          doc.text('AU Small Finance Bank',          bRight, bankDetailsY);
      doc.text('Branch',     bLeft, bankDetailsY + rowH);   doc.text('FC ROAD',                        bRight, bankDetailsY + rowH);
      doc.text('Acc. Name',  bLeft, bankDetailsY + rowH*2); doc.text('Tailoring Turba LLP',            bRight, bankDetailsY + rowH*2);
      doc.text('Acc. Number',bLeft, bankDetailsY + rowH*3); doc.text('2221235438774438',                bRight, bankDetailsY + rowH*3);
      doc.text('IFSC',       bLeft, bankDetailsY + rowH*4); doc.text('AUBL0002354',                    bRight, bankDetailsY + rowH*4);
      doc.text('UPI ID',     bLeft, bankDetailsY + rowH*5); doc.text('merchant581768.augp@aubank',     bRight, bankDetailsY + rowH*5);
      
      // Generate UPI QR Code
      const upiString = 'upi://pay?pa=merchant581768.augp@aubank&pn=TailoringTurba&am=' + qrAmount.toFixed(2);
      const qrDataUrl = await QRCode.toDataURL(upiString, { width: 90, margin: 2 });
      const qrX = margin + 215;
      const qrSize = 75;
      doc.image(qrDataUrl, qrX, bankDetailsY, { width: qrSize });
      doc.font('Helvetica-Bold').fontSize(7).text('Pay using UPI', qrX, bankDetailsY + qrSize + 3, { width: qrSize, align: 'center' });

      // Draw bottom border of Bank details — small bottom padding
      const termsStartY = bankDetailsY + rowH*5 + 12;
      drawLine(doc, margin, termsStartY, cols[6], termsStartY, brandColor);
      // Left border of Bank Details
      drawLine(doc, margin, taxBoxY, margin, termsStartY, brandColor);
      
      // 9. TERMS AND CONDITIONS
      const drawTermBox = (title: string, lines: string[], currentY: number) => {
        doc.rect(margin, currentY, cols[6] - margin, 12).fillAndStroke(headerColor, brandColor);
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7).text(title, margin, currentY + 3, { width: cols[6] - margin, align: 'center' });
        currentY += 12;
        doc.font('Helvetica').fontSize(7);
        let contentY = currentY + 2;
        lines.forEach(line => {
          doc.text('• ' + line, margin + 2, contentY, { width: cols[6] - margin - 4 });
          contentY += doc.heightOfString('• ' + line, { width: cols[6] - margin - 4 }) + 1;
        });
        currentY = contentY + 2;
        drawLine(doc, margin, currentY, cols[6], currentY, brandColor);
        return currentY;
      };

      let tY = termsStartY;
      tY = drawTermBox('Products', [
        'Goods once sold will not be taken back. Order cancellation will be charged by 15%.',
        'Finished good delivered will be as per physical confirmation only.'
      ], tY);
      tY = drawTermBox('Delivery', [
        'Shipping charges extra as per weight & location. Delivery time variable as per confirmations of samples and availability of fabric.',
        'Our responsibility lies until providing customer with tracking ID.',
        'We are also not responsible for any delay/damage for any courier issues.'
      ], tY);
      tY = drawTermBox('Payments Terms & Mode', [
        'Order will be processed only against 60% advance and 40% before order dispatch from warehouse.',
        '100% Payment before Dispatch.',
        'We also do not provide COD. If any issues you can pickup from our warehouse.',
        'No dispatch of goods without payment advice.',
        'Bank Transfer, Cash, UPI, RTGS, NEFT only.'
      ], tY);
      tY = drawTermBox('Manufacturing', [
        'Manufacturing is an intensive process that includes a huge plethora of factors Its is mostly a labour and human dependent process.',
        'We are not responsible for delays in production/dispatch of goods.',
        'However we always try to dispatch goods on time as per deadline.'
      ], tY);
      tY = drawTermBox('Design Details', [
        'Company Logo to be provided in CDR/DST/EMB File only for print and embroidery respectively.',
        'If not design charges would be applicable at actuals.'
      ], tY);
      
      // Draw left border for Terms
      drawLine(doc, margin, termsStartY, margin, tY, brandColor);
      
      // 10. SIGNATURE BOX (Right side bottom)
      const sigTopY = y; // from after tax box
      doc.font('Helvetica-Bold').fontSize(6).text('Certified that the particulars given above are true and correct.', cols[6], sigTopY + 5, { width: taxBoxW, align: 'center' });
      doc.fontSize(8).text('For Tailoring Turba LLP', cols[6], sigTopY + 15, { width: taxBoxW, align: 'center' });
      
      // Optional signature image — positioned just above "Authorised Signatory"
      if (fs.existsSync(process.cwd() + '/public/signature.png')) {
        const sigBoxH = tY - sigTopY;
        const sigImgH = Math.min(180, sigBoxH - 50); // 2x bigger, capped to fit
        const sigImgY = tY - sigImgH - 14; // sit just above Authorised Signatory text
        doc.image(process.cwd() + '/public/signature.png', cols[6] + 5, sigImgY, { fit: [taxBoxW - 10, sigImgH], align: 'center' });
      }
      
      doc.fontSize(6).text('Authorised Signatory', cols[6], tY - 10, { width: taxBoxW, align: 'center' });

      // ── DRAW ALL COMPLETE BORDERS AFTER tY IS KNOWN ──────────────────────
      // Outer box: entire bottom section (bank + terms on left, tax + signature on right)
      doc.rect(margin, taxBoxY, rightMargin - margin, tY - taxBoxY)
         .strokeColor(brandColor).lineWidth(1).stroke();

      // Full vertical divider separating left (bank/terms) from right (tax/signature)
      drawLine(doc, cols[6], taxBoxY, cols[6], tY, brandColor);

      // Horizontal line separating tax rows area from signature area (bottom of tax box)
      drawLine(doc, cols[6], sigTopY, rightMargin, sigTopY, brandColor);

      // Bottom border of signature box (= bottom of entire section)
      drawLine(doc, cols[6], tY, rightMargin, tY, brandColor);
      
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
