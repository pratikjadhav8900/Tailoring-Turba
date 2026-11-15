const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'manual-assets');

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Launching Chrome for clean Ops Portal Manual screenshots (no cookies)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 1.5,
  });

  // Pre-seed cookie consent so banner never pops up
  await context.addInitScript(() => {
    try {
      localStorage.setItem('tt_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true }));
    } catch {}
  });

  const page = await context.newPage();

  try {
    // 1. Login Page
    console.log('📸 1. Capturing Ops Login Page...');
    await page.goto('http://localhost:3000/ops/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-ops-login.png'), fullPage: false });

    // Authenticate
    console.log('🔑 Authenticating as TT001 (Founder Neeraj Shingavi)...');
    await page.locator('input[placeholder*="User ID"]').fill('TT001');
    await page.locator('input[type="password"]').fill('turba@neeraj123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/ops');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 2. Dashboard
    console.log('📸 2. Capturing Ops Dashboard...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-ops-dashboard.png'), fullPage: false });

    // Open notifications drawer
    try {
      console.log('📸 2b. Capturing Notification Drawer...');
      const bellButton = page.locator('button:has(svg.lucide-bell)').first();
      if (await bellButton.isVisible()) {
        await bellButton.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '02b-ops-notifications.png'), fullPage: false });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    } catch (e) {}

    // 3. Orders Directory (List View)
    console.log('📸 3. Capturing Orders Directory (List View)...');
    await page.goto('http://localhost:3000/ops/orders?view=list', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-ops-orders-list.png'), fullPage: false });

    // 4. Orders Directory (Kanban View)
    console.log('📸 4. Capturing Orders Directory (Kanban View)...');
    await page.goto('http://localhost:3000/ops/orders?view=kanban', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-ops-orders-kanban.png'), fullPage: false });

    // 5. Order Detail Page
    console.log('📸 5. Capturing Single Source of Truth Order Detail...');
    await page.goto('http://localhost:3000/ops/orders/cmvgvsg370005bsvu6zeh87vi', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-ops-order-detail.png'), fullPage: false });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05b-ops-order-detail-full.png'), fullPage: true });

    // 6. Stage Progression modal
    try {
      console.log('📸 6. Testing Stage Progression modal...');
      const advanceBtn = page.locator('button:has-text("Advance Stage"), button:has-text("Progress Stage"), button:has-text("Complete Stage")').first();
      if (await advanceBtn.isVisible()) {
        await advanceBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '06-ops-stage-progression.png') });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    } catch (e) {}

    // 8. Raw Material Planning
    console.log('📸 8. Capturing Raw Material & Fabric Planning (/ops/planning)...');
    await page.goto('http://localhost:3000/ops/planning', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-ops-material-planning.png'), fullPage: false });

    // 9. Vendor Management
    console.log('📸 9. Capturing Vendor Management (/ops/vendors)...');
    await page.goto('http://localhost:3000/ops/vendors', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-ops-vendor-management.png'), fullPage: false });

    // 10. Floor Tasks
    console.log('📸 10. Capturing Daily Tasks (/ops/tasks)...');
    await page.goto('http://localhost:3000/ops/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10-ops-floor-tasks.png'), fullPage: false });

    // 11. Team Chat
    console.log('📸 11. Capturing Factory Team Chat (/ops/chat)...');
    await page.goto('http://localhost:3000/ops/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-ops-team-chat.png'), fullPage: false });

    // 12. Account Profile
    console.log('📸 12. Capturing Account Profile (/ops/account)...');
    await page.goto('http://localhost:3000/ops/account', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12-ops-account.png'), fullPage: false });

    // 13. System Settings
    console.log('📸 13. Capturing Settings (/ops/settings)...');
    await page.goto('http://localhost:3000/ops/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13-ops-settings.png'), fullPage: false });

    console.log('✅ ALL SCREENSHOTS RE-CAPTURED PRISTINELY!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
