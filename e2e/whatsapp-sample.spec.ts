import { test, expect } from '@playwright/test';

const TIMEOUT = 15000;

test.describe('📱 WhatsApp Sample Request Flows', () => {

  test('Catalog Page: SAMPLE button has correct WhatsApp link and is tapable on mobile viewports', async ({ page }) => {
    // Navigate to products catalog page
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    
    // Select the first product card
    const firstCard = page.locator('div[class*="productCard"]').first();
    await expect(firstCard).toBeVisible({ timeout: TIMEOUT });

    // Retrieve name and ID from catalog card or mockups
    const productNameElement = firstCard.locator('h3[class*="productName"]');
    await expect(productNameElement).toBeVisible({ timeout: TIMEOUT });
    const productName = await productNameElement.innerText();

    // Inspect the SAMPLE button (anchor link)
    const sampleLink = firstCard.locator('a[class*="actionBtnSecondary"]');
    await expect(sampleLink).toBeAttached({ timeout: TIMEOUT });
    
    const href = await sampleLink.getAttribute('href');
    expect(href).not.toBeNull();
    expect(href).toContain('https://wa.me/919022553346');
    expect(href).toContain(encodeURIComponent(productName));

    // Verify mobile viewport visibility
    await page.setViewportSize({ width: 375, height: 667 });
    // In mobile viewports, the action bar is always visible
    const hoverActionBar = firstCard.locator('div[class*="hoverActionBar"]');
    await expect(hoverActionBar).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: TIMEOUT }); // translated 0
    await expect(sampleLink).toBeVisible({ timeout: TIMEOUT });
  });

  test('Details Page: Request Sample and Request Sample Pack buttons open correct WhatsApp contact and update with selected size/qty', async ({ page }) => {
    // Navigate to a product details page (using product ID 3 from database seed/data)
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });

    // Verify main components are loaded
    const productTitle = page.locator('h1').first();
    await expect(productTitle).toBeVisible({ timeout: TIMEOUT });
    const name = await productTitle.innerText();

    // Check size selection button (e.g. size M)
    const sizeButton = page.locator('button:has-text("M")').first();
    await expect(sizeButton).toBeVisible({ timeout: TIMEOUT });
    await sizeButton.click();

    // Verify the 'Request Sample' button updates href
    const requestSampleBtn = page.locator('a[class*="btnSample"]').first();
    await expect(requestSampleBtn).toBeVisible({ timeout: TIMEOUT });

    let href = await requestSampleBtn.getAttribute('href');
    expect(href).not.toBeNull();
    expect(href).toContain('https://wa.me/919022553346');
    expect(href).toContain(encodeURIComponent(name));
    expect(href).toContain(encodeURIComponent('Size: M'));
    expect(href).toContain(encodeURIComponent('Requested Quantity: 10'));

    // Check sample pack button has the same href
    const samplePackBtn = page.locator('a[class*="btnSampleMinimal"]').first();
    if (await samplePackBtn.count() > 0) {
      const packHref = await samplePackBtn.getAttribute('href');
      expect(packHref).toBe(href);
    }

    // Verify 'Request Bulk Quote' button points to contact page
    const bulkQuoteBtn = page.locator('a[class*="btnInquire"]').first();
    await expect(bulkQuoteBtn).toBeVisible({ timeout: TIMEOUT });
    const quoteHref = await bulkQuoteBtn.getAttribute('href');
    expect(quoteHref).not.toBeNull();
    expect(quoteHref).toContain('/contact?product=');
    expect(quoteHref).not.toContain('wa.me');
  });

});
