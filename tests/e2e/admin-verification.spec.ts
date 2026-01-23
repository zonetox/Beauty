
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars for Service Role Key
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Admin tests requiring Service Role Key might fail setup if keys are missing.');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

test.describe('Admin Verification Flow', () => {
    // Generate unique credentials for this run
    const timestamp = Date.now();
    const adminEmail = `admin_verify_${timestamp}@example.com`;
    const adminPassword = 'AdminPassword123!';

    test('Should allow Admin specific workflows', async ({ page }) => {
        test.setTimeout(120000); // Allow time for registration + promotion + widget load

        // 1. Register a new user (Standard Flow)
        await page.goto('/register/user');
        await expect(page.locator('form')).toBeVisible({ timeout: 15000 });

        await page.fill('#full_name', 'Admin Candidate');
        await page.fill('#email', adminEmail);
        await page.fill('#phone', '0999888777');
        await page.fill('#password', adminPassword);
        await page.fill('#confirmPassword', adminPassword);
        await page.click('button[type="submit"]');

        // Wait for redirection to dashboard
        await expect(page).toHaveURL(/.*\/account/, { timeout: 30000 });

        // User is now logged in as "User" role.
        // 2. Promote to Admin (Backend Action)
        if (!supabaseAdmin) {
            test.skip(true, 'Skipping Admin promotion due to missing env vars');
            return;
        }

        // Fetch the user ID
        // We can't easily get it from UI. We fetch from DB by email.
        // Retry functionality for eventual consistency
        let userId = null;
        for (let i = 0; i < 10; i++) {
            const { data } = await supabaseAdmin.from('profiles').select('id').eq('email', adminEmail).single();
            if (data) {
                userId = data.id;
                break;
            }
            await page.waitForTimeout(1000);
        }

        expect(userId).toBeTruthy();

        console.log(`Promoting User ${userId} (${adminEmail}) to Admin via admin_users...`);

        // Insert into admin_users table
        const { error: insertError } = await supabaseAdmin
            .from('admin_users')
            .insert({
                email: adminEmail,
                username: `admin_${timestamp}`,
                role: 'Admin',
                is_locked: false
            });

        if (insertError) {
            console.error('Admin promotion failed:', insertError);
        }
        expect(insertError).toBeNull();
        console.log('User added to admin_users.');

        // 3. User needs to refresh session or re-login to get new claims?
        // Usually Supabase session update requires re-login or token refresh.
        // Fastest way: Logout and Login.

        // Logout
        await page.goto('/account');
        await page.click('button:has-text("Đăng xuất"), p:has-text("Đăng xuất")'); // Adjust selector as needed
        await page.waitForTimeout(3000);

        // Login logic
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*\/account|.*\/admin/); // Redirect might vary based on role logic

        // 4. Access Admin Dashboard
        await page.goto('/admin');
        await expect(page).toHaveURL(/.*\/admin/);

        // 5. Verify Admin Widgets
        // Check for "Overview"
        await expect(page.locator('h1:has-text("Tổng quan"), h2:has-text("Dashboard")')).toBeVisible();

        // Check for "Users" stats card
        await expect(page.locator('text=Người dùng mới')).toBeVisible();

        // Check for "Logs" or specific admin tables
        await expect(page.locator('table')).toBeVisible(); // Assuming logs or user lists use tables

        console.log('Admin Dashboard Verification Passed');
    });
});
