import fs from 'fs';

const filePath = 'd:/Tailoring Tourba/Tailoring Turba/src/lib/pdf.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix Rupee Symbol
content = content.replace(/₹\$\{/g, 'Rs. ${');

// 2. Fix Payment Status in Header
content = content.replace(
  /\.text\(`Payment Status: \$\{order\.isSplitPayment \? \(order\.remainingAmount === 0 \|\| order\.amountPaid >= order\.totalAmount \? 'Fully Paid' : 'Partially Paid \(60\%\)'\) : 'Paid \(100\%\)'\}`, 350, 185\);/,
  ".text(order.type === 'PRO FORMA INVOICE' ? 'Status: Estimate / Unpaid' : `Payment Status: ${order.isSplitPayment ? (order.remainingAmount === 0 || order.amountPaid >= order.totalAmount ? 'Fully Paid' : 'Partially Paid (60%)') : 'Paid (100%)'}`, 350, 185);"
);

// 3. Fix Split Payment Details
const splitPaymentOld = `      if (order.isSplitPayment) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor)
           .text('Split Payment Schedule (Bulk Order 60/40):', 250, y, { width: 295, align: 'right' });
        
        y += 15;
        doc.font('Helvetica').fillColor(textDark)
           .text(\`Paid to Date (60%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${order.amountPaid.toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        const balDue = order.remainingAmount;
        doc.text(\`Balance Due (40%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${balDue.toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        doc.font('Helvetica-Bold')
           .text(\`Balance Status:\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(balDue === 0 || order.amountPaid >= order.totalAmount ? 'Fully Paid' : 'Due on Dispatch', rightColValX, y, { width: colWidth, align: 'right', color: balDue === 0 ? primaryColor : secondaryColor });
      } else {
        doc.fontSize(9).font('Helvetica').fillColor(textDark)
           .text(\`Amount Paid (100%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${order.amountPaid.toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
      }`;

const splitPaymentNew = `      if (order.type === 'PRO FORMA INVOICE') {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor)
           .text('Payment Schedule (60% Advance / 40% On Dispatch):', 200, y, { width: 345, align: 'right' });
        
        y += 15;
        doc.font('Helvetica').fillColor(textDark)
           .text(\`Advance Required (60%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${Math.round(order.totalAmount * 0.6).toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        doc.text(\`Balance Due (40%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${Math.round(order.totalAmount * 0.4).toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
      } else if (order.isSplitPayment) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor)
           .text('Split Payment Schedule (Bulk Order 60/40):', 250, y, { width: 295, align: 'right' });
        
        y += 15;
        doc.font('Helvetica').fillColor(textDark)
           .text(\`Paid to Date (60%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${order.amountPaid.toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        const balDue = order.remainingAmount;
        doc.text(\`Balance Due (40%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${balDue.toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
        
        y += 15;
        doc.font('Helvetica-Bold')
           .text(\`Balance Status:\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(balDue === 0 || order.amountPaid >= order.totalAmount ? 'Fully Paid' : 'Due on Dispatch', rightColValX, y, { width: colWidth, align: 'right', color: balDue === 0 ? primaryColor : secondaryColor });
      } else {
        doc.fontSize(9).font('Helvetica').fillColor(textDark)
           .text(\`Amount Paid (100%):\`, rightColLabelX, y, { width: 110, align: 'right' })
           .text(\`Rs. \${order.amountPaid.toLocaleString('en-IN')}\`, rightColValX, y, { width: colWidth, align: 'right' });
      }`;

content = content.replace(splitPaymentOld, splitPaymentNew);


// 4. Fix Footer Policy
const footerOld = `      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('CANCELLATION & REFUND POLICY', 50, footerY);

      doc.fillColor(textMuted)
         .font('Helvetica')
         .fontSize(7.5)
         .text('Orders cancelled within 24 hours of placement will receive a 75% refund of the paid amount (25% fee deducted). Cancellations requested after 24 hours from order placement are non-refundable, as customization and raw material processing begins immediately.', 50, footerY + 12, { width: 495, align: 'justify', lineGap: 2 });`;

const footerNew = `      if (order.type === 'PRO FORMA INVOICE') {
        doc.fillColor(secondaryColor)
           .font('Helvetica-Bold')
           .fontSize(8)
           .text('TERMS & CONDITIONS', 50, footerY);

        doc.fillColor(textMuted)
           .font('Helvetica')
           .fontSize(7.5)
           .text('This is a Pro Forma Invoice (Estimate). Production will begin only after the advance payment is received. Prices are valid for 15 days from the date of issue. Customization and fabric cutting starts immediately upon confirmation.', 50, footerY + 12, { width: 495, align: 'justify', lineGap: 2 });
      } else {
        doc.fillColor(secondaryColor)
           .font('Helvetica-Bold')
           .fontSize(8)
           .text('CANCELLATION & REFUND POLICY', 50, footerY);

        doc.fillColor(textMuted)
           .font('Helvetica')
           .fontSize(7.5)
           .text('Orders cancelled within 24 hours of placement will receive a 75% refund of the paid amount (25% fee deducted). Cancellations requested after 24 hours from order placement are non-refundable, as customization and raw material processing begins immediately.', 50, footerY + 12, { width: 495, align: 'justify', lineGap: 2 });
      }`;

content = content.replace(footerOld, footerNew);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated pdf.ts");
