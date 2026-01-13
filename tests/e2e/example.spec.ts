// Example E2E Test with Playwright
// This is a template for writing end-to-end tests

import { test, expect } from '@playwright/test';

test.describe('Example E2E Flow', () => {
  test('user can navigate to homepage', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/1Beauty/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('user can search for businesses', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('Spa');
    await searchInput.press('Enter');
    
    await expect(page).toHaveURL(/.*search.*Spa/);
    await expect(page.locator('.business-card')).toHaveCount(1, { timeout: 5000 });
  });

  test('user can view business details', async ({ page }) => {
    await page.goto('/directory');
    
    // Wait for businesses to load
    await page.waitForSelector('.business-card');
    
    // Click first business
    await page.locator('.business-card').first().click();
    
    // Verify business detail page
    await expect(page).toHaveURL(/\/business\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
