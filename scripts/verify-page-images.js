const { chromium } = require('@playwright/test');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 1100 } });
  await page.goto('http://localhost:3000/ops-user-manual.html', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1000);

  // Take screenshot of Module 07 (QC Rework)
  const mod7 = await page.$('#qc-rework');
  if (mod7) {
    await mod7.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'public/manual-assets/verify-mod7-page.png' });
  }

  // Take screenshot of Module 08 (Material Planning)
  const mod8 = await page.$('#material-planning');
  if (mod8) {
    await mod8.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'public/manual-assets/verify-mod8-page.png' });
  }

  console.log('Page verification screenshots captured!');
  await browser.close();
}

main().catch(console.error);
