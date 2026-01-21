# Supabase Migrations Guide (Infrastructure as Code)

This project uses Supabase Migrations to handle database changes safely and reliably.

## Why Migrations?
Instead of editing your database in the dashboard (which is risky), we write SQL files here.
Benefits:
- **Version Control:** All DB changes are in Git.
- **Reproducibility:** You can spin up a new environment in minutes.
- **Safety:** No more "oops, I deleted the wrong column" in production.

## How to Create a Migration

1. **Install Supabase CLI:**
   You need the Supabase CLI installed. If you haven't, run:
   ```bash
   npm install -g supabase
   ```

2. **Login:**
   ```bash
   npx supabase login
   ```

3. **Generate a Migration File:**
   Run this command to create a new migration file:
   ```bash
   npx supabase migration new name_of_your_change
   # Example: npx supabase migration new add_phone_to_profiles
   ```
   This creates a file in `supabase/migrations/<timestamp>_name_of_your_change.sql`.

4. **Write SQL:**
   Open that file and write your SQL.
   
   *Example:*
   ```sql
   ALTER TABLE profiles ADD COLUMN phone_number text;
   ```

5. **Apply to Local (Requires Docker):**
   If you have Docker:
   ```bash
   npx supabase start
   ```

6. **Apply to Production (CI/CD):**
   When you push this file to GitHub, your CI pipeline (via GitHub Actions) can automatically apply it to your Supabase project using:
   ```bash
   npx supabase db push
   ```
   *(Note: You need to set up `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` in GitHub Secrets for this to work automatically)*

## Useful Commands

- `npx supabase db pull`: Pull current schema from remote to local (reverse engineering).
- `npx supabase status`: Check local Supabase status.
