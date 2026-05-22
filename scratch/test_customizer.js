const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log('Navigating to customizer page...');
    await page.goto('http://127.0.0.1:3000/customizer?id=cmojuujrw003b5fp3trjmddgr', { waitUntil: 'load', timeout: 90000 });
    
    console.log('Page loaded. Current url:', page.url());
    
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Wait for the design tab to be visible
    await page.waitForSelector('button:has-text("Options")');

    // Click on the Options tab
    console.log('Clicking Options tab...');
    await page.click('button:has-text("Options")');

    // Wait for the plus button to be visible
    await page.waitForSelector('button:has-text("+")');

    // Click the first "+" button 10 times to meet MOQ
    console.log('Adding 10 items to S...');
    const plusButtons = await page.$$('button:has-text("+")');
    if (plusButtons.length > 0) {
      for (let i = 0; i < 10; i++) {
        await plusButtons[0].click();
      }
    }

    // Click on the Review tab
    console.log('Clicking Review tab...');
    await page.click('button:has-text("Review")');
    
    // Wait for images to load
    console.log('Waiting for network/images...');
    await page.waitForTimeout(4000);
    
    // Take a screenshot of the review-mockup-back container
    const reviewBack = await page.$('#review-mockup-back');
    if (reviewBack) {
      await reviewBack.screenshot({ path: 'scratch/review_back_only.png' });
      console.log('Screenshot of review-mockup-back saved to scratch/review_back_only.png');
    }
    
    await page.screenshot({ path: 'scratch/review_screenshot.png', fullPage: true });
    console.log('Full page screenshot saved to scratch/review_screenshot.png');
    
  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
