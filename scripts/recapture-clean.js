const { chromium } = require('@playwright/test');
if (!process.env.OPS_SCREENSHOT_PASSWORD) { console.error("Set OPS_SCREENSHOT_PASSWORD (the Ops login password for the screenshot account) before running this script."); process.exit(1); }

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 850 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/ops/login', { waitUntil: 'networkidle' });
  await page.locator('input[placeholder*="User ID"]').fill('TT001');
  await page.locator('input[type="password"]').fill(process.env.OPS_SCREENSHOT_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/ops');
  await page.waitForLoadState('networkidle');

  // Ensure cookie consent is accepted
  await page.evaluate(() => {
    localStorage.setItem('tt_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true }));
  });

  // Re-capture vendors
  console.log('Capturing /ops/vendors...');
  await page.goto('http://localhost:3000/ops/vendors', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('div[role="dialog"], [class*="CookieConsent"], [class*="banner"]');
    dialogs.forEach(d => {
      if (d.textContent && d.textContent.includes('cookie')) {
        d.remove();
      }
    });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/manual-assets/09-ops-vendor-management.png' });

  // Re-capture planning
  console.log('Capturing /ops/planning...');
  await page.goto('http://localhost:3000/ops/planning', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('div[role="dialog"], [class*="CookieConsent"], [class*="banner"]');
    dialogs.forEach(d => {
      if (d.textContent && d.textContent.includes('cookie')) {
        d.remove();
      }
    });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/manual-assets/08-ops-material-planning.png' });

  // Re-capture tasks
  console.log('Capturing /ops/tasks...');
  await page.goto('http://localhost:3000/ops/tasks', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('div[role="dialog"], [class*="CookieConsent"], [class*="banner"]');
    dialogs.forEach(d => {
      if (d.textContent && d.textContent.includes('cookie')) {
        d.remove();
      }
    });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/manual-assets/10-ops-floor-tasks.png' });

  // Re-capture chat
  console.log('Capturing /ops/chat...');
  await page.goto('http://localhost:3000/ops/chat', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('div[role="dialog"], [class*="CookieConsent"], [class*="banner"]');
    dialogs.forEach(d => {
      if (d.textContent && d.textContent.includes('cookie')) {
        d.remove();
      }
    });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/manual-assets/11-ops-team-chat.png' });

  console.log('All 4 target screenshots cleanly re-captured without cookie banners!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
