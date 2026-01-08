# Security Fixes - 2025-01-08
## Tuân thủ Master Plan v1.1

### ✅ Đã Fix

#### 1. Views - Removed SECURITY DEFINER
- ✅ `v_slow_queries` - Changed to `security_invoker=true`
- ✅ `v_index_usage` - Changed to `security_invoker=true`
- ✅ `v_unused_indexes` - Changed to `security_invoker=true`

#### 2. Functions - Added search_path
Đã thêm `SET search_path = public, pg_temp` cho tất cả functions:
- ✅ `increment_business_view_count`
- ✅ `get_user_email`
- ✅ `increment_blog_view_count`
- ✅ `increment_business_blog_view_count`
- ✅ `is_admin`
- ✅ `is_business_owner`
- ✅ `extract_business_id_from_path`
- ✅ `extract_user_id_from_path`
- ✅ `search_businesses`
- ✅ `search_blog_posts`
- ✅ `get_business_count`
- ✅ `handle_new_user`

#### 3. RLS Policies - Fixed Permissive Policies
Đã thay thế `WITH CHECK (true)` bằng validation logic:
- ✅ `appointments_insert_public_or_admin` - Now checks business is_active
- ✅ `Update notifications` - Now checks user_id = auth.uid()
- ✅ `Public/Users create orders` - Now checks business is_active
- ✅ `orders_insert_public_or_admin` - Now checks business is_active
- ✅ `Public can create registration requests` - Now validates email format, business_name, phone
- ✅ `registration_requests_insert_public` - Now validates email format, business_name, phone

### ⚠️ Cần Manual Setup

#### 4. Auth - Leaked Password Protection
**Status:** Disabled (cần enable manual)

**Cách enable:**
1. Vào Supabase Dashboard: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq
2. Settings → Authentication → Password
3. Enable "Leaked password protection"
4. This will check passwords against HaveIBeenPwned.org database

**Link:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Migration File
- `database/migrations/20250108000001_fix_security_warnings.sql`

## Verification
Sau khi apply migration, chạy:
```sql
-- Verify views
SELECT viewname, viewowner 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_slow_queries', 'v_index_usage', 'v_unused_indexes');

-- Verify functions have search_path
SELECT proname, proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('is_admin', 'is_business_owner', 'get_user_email')
AND proconfig IS NOT NULL;

-- Verify RLS policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('appointments', 'notifications', 'orders', 'registration_requests')
ORDER BY tablename, policyname;
```
