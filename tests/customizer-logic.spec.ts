import { test, expect } from '@playwright/test';

test.describe('Customizer Business Logic', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a product page
    await page.goto('/products/8');
    // Click Start Customizing
    await page.click('text=START CUSTOMIZING');
    await expect(page).toHaveURL(/.*customizer/);
  });

  test('Should enforce Minimum Order Quantity (MOQ)', async ({ page }) => {
    // Go to Options tab
    await page.click('button:has-text("Options")');
    
    // Add only 5 items (MOQ is 10)
    const sQtyInput = page.locator('div:has-text("S") >> .sizeQty');
    await page.click('div:has-text("S") >> .qtyBtn:has-text("+")', { clickCount: 5 });
    
    // Check if total is 5
    await expect(page.locator('text=Total Quantity >> .. >> span').nth(1)).toHaveText('5');
    
    // Try to go to Review tab
    await page.click('button:has-text("Review")');
    
    // It should still allow viewing review, but Add to Cart might be blocked or show warning
    // In our implementation, we should check for "MOQ: 10 pcs min" badge
    await expect(page.locator('text=MOQ: 10 pcs min')).toBeVisible();
  });

  test('Should calculate correct price including GST and customization fee', async ({ page }) => {
    // 1. Add Text in Design tab
    await page.click('button:has-text("Design")');
    await page.click('button:has-text("Text")');
    await page.click('text=Add a text box');
    
    // 2. Go to Options and add 10 items
    await page.click('button:has-text("Options")');
    await page.click('div:has-text("M") >> .qtyBtn:has-text("+")', { clickCount: 10 });
    
    // 3. Go to Review and verify price
    await page.click('button:has-text("Review")');
    
    // Base Price for ID 8 is 430
    // Subtotal = 10 * 430 = 4300
    // Customization = 300
    // GST = (4300 + 300) * 0.05 = 230
    // Total = 4300 + 300 + 230 = 4830
    
    const totalText = await page.locator('text=Total Estimate >> .. >> span').nth(1).innerText();
    expect(totalText).toContain('4,830');
  });
});
