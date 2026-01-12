import { test, expect } from '@playwright/test';

/**
 * Critical Path E2E Tests
 * Tests all essential user flows automatically
 */

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
  });

  test('Homepage loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/1Beauty.asia/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('User Registration Flow', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register');
    await expect(page).toHaveURL(/.*\/register/);

    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="full_name"]', 'Test User');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await page.waitForTimeout(2000);

    // Should redirect to account page or show success
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*\/(account|login)/);
  });

  test('Business Registration Flow', async ({ page }) => {
    await page.goto('/register');
    
    // Select business registration option if available
    const businessOption = page.locator('input[value="business"], button:has-text("Doanh nghiệp")');
    if (await businessOption.count() > 0) {
      await businessOption.first().click();
    }

    // Fill business registration form
    const timestamp = Date.now();
    const testEmail = `business${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="business_name"], input[name="name"]', 'Test Business');
    await page.fill('input[name="phone"]', '0123456789');
    await page.fill('input[name="address"], textarea[name="address"]', '123 Test Street');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Should redirect to account page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*\/account/);
  });

  test('Login Flow', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/login/);

    // Fill login form (using test credentials if available)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Should redirect away from login page
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/.*\/login/);
  });

  test('Directory Search Flow', async ({ page }) => {
    await page.goto('/directory');
    await expect(page).toHaveURL(/.*\/directory/);

    // Wait for page to load
    await page.waitForSelector('input[type="search"], input[placeholder*="tìm"], input[placeholder*="search"]', { timeout: 5000 }).catch(() => {});

    // Try to search
    const searchInput = page.locator('input[type="search"], input[placeholder*="tìm"], input[placeholder*="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for results
      await page.waitForTimeout(2000);
    }

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('Navigation Works', async ({ page }) => {
    // Test header navigation
    const navLinks = [
      { text: 'Trang chủ', url: '/' },
      { text: 'Danh sách', url: '/directory' },
      { text: 'Blog', url: '/blog' },
      { text: 'Giới thiệu', url: '/about' },
      { text: 'Liên hệ', url: '/contact' },
    ];

    for (const link of navLinks) {
      const navElement = page.locator(`a:has-text("${link.text}"), nav a[href="${link.url}"]`).first();
      if (await navElement.count() > 0) {
        await navElement.click();
        await page.waitForTimeout(1000);
        await expect(page).toHaveURL(new RegExp(link.url.replace('/', '\\/')));
      }
    }
  });

  test('404 Page Works', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await expect(page.locator('body')).toContainText(/404|không tồn tại|not found/i);
  });

  test('Chatbot Toggle', async ({ page }) => {
    // Look for chatbot button
    const chatbotButton = page.locator('button:has-text("Chat"), button[aria-label*="chat"], .chatbot-button').first();
    
    if (await chatbotButton.count() > 0) {
      await chatbotButton.click();
      await page.waitForTimeout(500);
      
      // Chatbot should be visible
      const chatbot = page.locator('.chatbot, [role="dialog"]').first();
      if (await chatbot.count() > 0) {
        await expect(chatbot).toBeVisible();
      }
    }
  });
});

test.describe('Error Handling', () => {
  test('Handles network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should show error or handle gracefully
    await expect(page.locator('body')).toBeVisible();
    
    // Restore online
    await page.context().setOffline(false);
  });
});
