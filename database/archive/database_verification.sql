-- Database Verification & Audit Script
-- Run this in the Supabase SQL Editor to get a report on your database state.

-- 1. Check Table Existence & Row Counts
SELECT 
    schemaname, 
    relname as table_name, 
    n_live_tup as row_count 
FROM pg_stat_user_tables 
ORDER BY relname;

-- 2. Check Row Level Security (RLS) Policies
-- This shows which tables have RLS enabled and what the policies are.
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check for specific Critical Tables (Verification)
-- Returns 'MISSING' if a required table is not found.
SELECT 
    t.table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 'OK' ELSE 'MISSING' END as status
FROM (
    VALUES 
        ('businesses'),
        ('services'),
        ('media_items'),
        ('reviews'),
        ('profiles'),
        ('admin_users')
) as t(table_name);

-- 4. Check Key Triggers
-- Triggers are often used for updated_at timestamps or data validation.
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Foreign Key Integrity Check (Sample)
-- Checks if 'businesses' table has the 'owner_id' column linked to auth.users (if applicable)
-- or if other foreign keys exist as expected.
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
