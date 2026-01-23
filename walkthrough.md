# Business Registration Redesign - Verification & Deployment Guide

## Overview
We have completely redesigned the business registration flow to be **atomic, single-page, and validated**. This resolves the issues with data inconsistency (missing `use_type`, unlinked businesses) and user logout bugs.

## 1. Database Migration (CRITICAL)
You **MUST** run the SQL migration script to support the new flow.
1.  Open your Supabase SQL Editor.
2.  Copy content from: `database/migrations/20260123_redesign_business_registration.sql`
3.  Run the query.
    *   This creates the `register_business_atomic` RPC function.
    *   Adds `user_type` column to `profiles`.
    *   Updates `handle_new_user` trigger.

## 2. Frontend Changes
*   **New Page**: `pages/RegisterBusinessPage.tsx` - Single-step registration form.
*   **Validation**: `lib/schemas/business.schema.ts` - Zod schemas for strict data validation.
*   **Deprecated**: `pages/BusinessSetupPage.tsx` - Now redirects to `/account`.

## 3. Verification Steps

### Manual Testing
1.  Go to `/register/business`.
2.  Fill in the form (Account + Business info together).
3.  Submit.
    *   **Success**: Should go directly to `/account` (Dashboard).
    *   **Verify**: Check Supabase `businesses` table and `profiles` table. The new user should have `user_type = 'business'` and `business_id` set correctly.

### Automated Checks
Run the schema sync check to verify your DB is ready:
```bash
npx ts-node scripts/check-schema-sync.ts
```
*(Ensure `.env` matches your remote DB credentials for this script)*

## 4. Troubleshooting
*   **"Function not found"**: You forgot to run the migration SQL.
*   **E2E Tests**: If tests fail locally, ensure you are running against a database that has the migration applied.

## Next Steps
Review the failing local E2E tests (4 tests) in `tests/e2e`. Now that registration is fixed, try running them again:
```bash
npx playwright test
```
