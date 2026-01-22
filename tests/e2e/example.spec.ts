// Example E2E Test with Playwright
// This is a template for writing end-to-end tests

import { test, expect } from '@playwright/test';

test.describe('Example E2E Flow', () => {
  test('user can navigate to homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/1Beauty.asia/);
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
  });

  test('user can search for businesses', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('input[name="keyword"]');
    await searchInput.fill('Spa');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/.*directory.*keyword=Spa/);

    // Wait for the view toggle to be present to ensure page is interactive
    const listViewButton = page.locator('button:has-text("Danh sách")');
    try {
      await listViewButton.waitFor({ state: 'visible', timeout: 5000 });
      await listViewButton.click();
    } catch (e) {
      // Ignore if not found, might already be in list view or UI changed
      console.log('List view button not found or visible');
    }

    // Disable map filtering to ensure all results are visible
    const mapFilterToggle = page.locator('label:has-text("Lọc theo bản đồ"), .peer-checked\\:bg-primary').first();
    if (await mapFilterToggle.isVisible()) {
      await mapFilterToggle.click();
    }

    // Wait for results to stabilize
    await page.waitForTimeout(3000);

    // Wait for the results to be visible (either cards or empty state)
    // Use .first() to avoid strict mode violation if multiple cards are found
    await expect(page.locator('.business-card, .empty-state').first()).toBeVisible({ timeout: 15000 });
  });

  test('user can view business details', async ({ page }) => {
    await page.goto('/directory');

    // Switch to list view to see cards
    const listViewButton = page.locator('button:has-text("Danh sách")');
    try {
      await listViewButton.waitFor({ state: 'visible', timeout: 5000 });
      await listViewButton.click();
    } catch (e) {
      console.log('List view button not found or visible');
    }

    // Wait for businesses to load
    await page.waitForSelector('.business-card', { timeout: 15000 });

    // Click first business
    await page.locator('.business-card').first().click();

    // Verify business detail page
    await expect(page).toHaveURL(/\/business\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
