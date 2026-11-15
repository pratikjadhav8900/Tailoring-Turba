const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  // 1. Mobile phone viewport (portrait, 390x844 - iPhone 14 / modern Android)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:3000/ops-user-manual.html', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: 'public/manual-assets/mobile-web-preview.png', fullPage: false });
  
  // Scroll to #vendors on mobile
  const mod9Mobile = await mobilePage.$('#vendors');
  if (mod9Mobile) {
    await mod9Mobile.scrollIntoViewIfNeeded();
    await mobilePage.screenshot({ path: 'public/manual-assets/mobile-vendors-preview.png' });
  }

  // 2. Desktop print emulation
  const printPage = await browser.newPage({ viewport: { width: 800, height: 1130 } });
  await printPage.goto('http://localhost:3000/ops-user-manual.html', { waitUntil: 'networkidle' });
  await printPage.emulateMedia({ media: 'print' });
  const mod9Print = await printPage.$('#vendors');
  if (mod9Print) {
    await mod9Print.scrollIntoViewIfNeeded();
    await printPage.screenshot({ path: 'public/manual-assets/print-vendors-preview.png' });
  }

  console.log('Previews captured successfully');
  await browser.close();
})();
