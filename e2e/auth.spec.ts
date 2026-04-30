import { test, expect } from '@playwright/test';

const TIMEOUT = 20000;

// ─── BLACK BOX E2E: Authentication Flow ────────────────────────────────────────

test.describe('🔐 Auth Flow — Login Page', () => {

  test('renders split-screen layout with h1 heading', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText('Welcome back', { timeout: TIMEOUT });
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#login-email')).toBeVisible({ timeout: TIMEOUT });
    await expect(page.locator('#login-password')).toBeVisible({ timeout: TIMEOUT });
    await expect(page.locator('#login-submit')).toBeVisible({ timeout: TIMEOUT });
  });

  test('shows Google sign-in button', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const googleBtn = page.getByRole('button', { name: /google/i });
    await expect(googleBtn).toBeVisible({ timeout: TIMEOUT });
  });

  test('shows link to registration page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href="/register"]')).toBeVisible({ timeout: TIMEOUT });
  });

  test('blocks empty form submission — stays on /login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.click('#login-submit');
    await expect(page).toHaveURL(/\/login/, { timeout: TIMEOUT });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('#login-email', 'invalid@test.com');
    await page.fill('#login-password', 'wrongpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 15000 });
  });
});

// ─── BLACK BOX E2E: Registration Page ─────────────────────────────────────────

test.describe('📝 Auth Flow — Register Page', () => {

  test('renders Create Account heading', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText('Create Account', { timeout: TIMEOUT });
  });

  test('shows all required form fields', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#reg-name')).toBeVisible({ timeout: TIMEOUT });
    await expect(page.locator('#reg-email')).toBeVisible({ timeout: TIMEOUT });
    await expect(page.locator('#reg-password')).toBeVisible({ timeout: TIMEOUT });
  });

  /*
  test('B2B section hidden by default, shows after toggle', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    // Company field should not be in DOM initially
    await expect(page.locator('#reg-company')).toHaveCount(0, { timeout: TIMEOUT });
    await page.getByText('Register as B2B Business').click();
    await expect(page.locator('#reg-company')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#reg-gst')).toBeVisible({ timeout: 15000 });
  });
  */

  test('shows link back to login page', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href="/login"]')).toBeVisible({ timeout: TIMEOUT });
  });
});

// ─── BLACK BOX E2E: Landing & Products ─────────────────────────────────────────

test.describe('🏠 Landing & Products', () => {

  test('home page has correct title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Tailoring Turba/i, { timeout: TIMEOUT });
  });

  test('products page loads without 404', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("404")')).not.toBeVisible({ timeout: TIMEOUT });
  });
});
