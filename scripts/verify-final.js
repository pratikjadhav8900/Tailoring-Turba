const { chromium } = require('@playwright/test');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Mobile Phone Viewport (iPhone 14 / Pixel 7: 390x844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000/ops-user-manual.html', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Screenshot mobile top header & hero
  await mobilePage.screenshot({ path: 'public/manual-assets/mobile-final-header.png' });

  // Scroll to Module 09 (Vendor Management)
  const mod9 = await mobilePage.$('#vendors');
  if (mod9) {
    await mod9.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: 'public/manual-assets/mobile-final-vendors.png' });
  }

  // 2. Print Emulation for Module 09
  const printPage = await browser.newPage({ viewport: { width: 800, height: 1100 } });
  await printPage.goto('http://localhost:3000/ops-user-manual.html', { waitUntil: 'networkidle' });
  await printPage.emulateMedia({ media: 'print' });
  await printPage.waitForTimeout(1000);
  const printMod9 = await printPage.$('#vendors');
  if (printMod9) {
    await printMod9.scrollIntoViewIfNeeded();
    await printPage.waitForTimeout(500);
    await printPage.screenshot({ path: 'public/manual-assets/print-final-vendors.png' });
  }

  console.log('Final verification screenshots captured!');
  await browser.close();
}

main().catch(console.error);
