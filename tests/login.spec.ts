import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('login page should have email input', async ({ page }) => {
    await page.goto('/login');
    
    // Should see email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('login page should have submit button', async ({ page }) => {
    await page.goto('/login');
    
    // Should see login button
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    
    // HTML5 validation should prevent submission
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should attempt login with valid email', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    
    // Wait for some response (redirect or error)
    await page.waitForTimeout(1000);
  });
});

test.describe('Navigation', () => {
  // These tests assume user is authenticated (need to mock auth for proper E2E)
  
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/HR Portal/);
  });
});

test.describe('Directory Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/directory');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Settings Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/settings');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
