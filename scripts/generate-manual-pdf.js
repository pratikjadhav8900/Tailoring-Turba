const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');

async function generatePDF() {
  console.log('📄 Starting automated PDF generation for Turba Ops User Manual...');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  // ==========================================
  // 1. GENERATE A4 HIGH-RES PRINT BOOKLET
  // ==========================================
  console.log('🖨️ 1. Rendering pixel-perfect A4 booklet (Turba_Ops_Employee_Manual.pdf)...');
  const a4Page = await browser.newPage({
    viewport: { width: 1280, height: 960 },
  });

  await a4Page.goto('http://localhost:3000/ops-user-manual.html', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await a4Page.waitForTimeout(1500);

  const a4PdfPath = path.resolve(__dirname, '..', 'public', 'Turba_Ops_Employee_Manual.pdf');

  await a4Page.pdf({
    path: a4PdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '8mm',
      right: '8mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7.5pt; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; color: #64748b; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 8mm; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; font-weight: 500;">
        <span style="color: #00A86B; font-weight: 700;">TAILORING TURBA</span>
        <span>Operations Standard Operating Procedure (SOP)</span>
        <span>FACTORY INTERNAL • CONFIDENTIAL</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7.5pt; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; color: #64748b; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 8mm; border-top: 1px solid #e2e8f0; padding-top: 3px;">
        <span>Turba Ops ERP • erp.tailoringturba.com</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await a4Page.close();

  // ==========================================
  // 2. GENERATE DEDICATED MOBILE-OPTIMIZED PDF
  // (Phone screen ratio: 125mm x 250mm, 100% width)
  // ==========================================
  console.log('📱 2. Rendering mobile-optimized phone booklet (Turba_Ops_Mobile_Manual.pdf)...');
  const mobilePage = await browser.newPage({
    viewport: { width: 440, height: 920 },
    deviceScaleFactor: 2,
  });

  await mobilePage.goto('http://localhost:3000/ops-user-manual.html', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await mobilePage.waitForTimeout(1500);

  const mobilePdfPath = path.resolve(__dirname, '..', 'public', 'Turba_Ops_Mobile_Manual.pdf');

  await mobilePage.pdf({
    path: mobilePdfPath,
    width: '130mm',
    height: '260mm',
    printBackground: true,
    margin: {
      top: '6mm',
      bottom: '6mm',
      left: '5mm',
      right: '5mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #64748b; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 5mm; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
        <span style="color: #00A86B; font-weight: 800;">TT OPS SOP</span>
        <span>Mobile Employee Guide</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #64748b; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 5mm; border-top: 1px solid #e2e8f0; padding-top: 2px;">
        <span>Tailoring Turba</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await mobilePage.close();
  await browser.close();

  // Validate files
  const a4Buffer = fs.readFileSync(a4PdfPath);
  const a4Data = await pdf(a4Buffer);

  const mobileBuffer = fs.readFileSync(mobilePdfPath);
  const mobileData = await pdf(mobileBuffer);

  console.log(`\n=================== PDF INSPECTION ===================`);
  console.log(`[A4 Printable Booklet] Pages: ${a4Data.numpages} | Size: ${(a4Buffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[Mobile Phone Booklet] Pages: ${mobileData.numpages} | Size: ${(mobileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`======================================================\n`);

  console.log('✅ BOTH PDFs successfully generated and verified!');
}

generatePDF().catch(err => {
  console.error('❌ PDF generation failed:', err);
  process.exit(1);
});
