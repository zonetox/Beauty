# Row Level Security (RLS) Policies

**Last Updated:** 2025-01-11  
**Source:** Supabase Database (read via MCP `pg_policies`)  
**Note:** This document lists RLS policies EXACTLY as they exist in the database. All tables have RLS enabled.

---

## Policy Matrix

For each table, policies are listed by operation type: SELECT, INSERT, UPDATE, DELETE.

**Abbreviations:**
- `anon` = Anonymous users (public)
- `authenticated` = Authenticated users (logged in)
- `admin` = Admin users (via `is_admin()` function)
- `owner` = Business owner (via profile business_id)

---

## Table: `admin_activity_logs`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `admin_activity_logs_select_admin` | public | `is_admin()` |
| INSERT | `admin_activity_logs_insert_admin` | public | `is_admin()` (WITH CHECK) |
| UPDATE | `admin_activity_logs_update_admin` | public | `is_admin()` (USING + WITH CHECK) |
| DELETE | `admin_activity_logs_delete_admin` | public | `is_admin()` |

**Summary:** Admin only - all operations require `is_admin()`

---

## Table: `admin_users`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Admin users view` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `announcements`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `announcements_select_public` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `app_settings`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `app_settings_select_public` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `appointments`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `View appointments` | public | `true OR (business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()))` |
| INSERT | `appointments_insert_public_or_admin` | public | `(EXISTS (SELECT 1 FROM businesses WHERE businesses.id = appointments.business_id AND businesses.is_active = true)) OR is_admin()` |
| UPDATE | `Update appointments` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT, INSERT for active businesses or admin. UPDATE for business owners. No DELETE.

---

## Table: `blog_categories`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Blog categories are publicly viewable.` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `blog_comments`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `blog_comments_select_public` | public | `true` (public read) |
| INSERT | `blog_comments_insert_authenticated` | public | `auth.uid() IS NOT NULL` (authenticated only) |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT, authenticated INSERT only. No UPDATE/DELETE policies.

---

## Table: `blog_posts`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `blog_posts_select_public` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `business_blog_posts`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Public can read published business blog posts` | public | `status = 'Published'::business_blog_post_status` |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT for published posts only. No INSERT/UPDATE/DELETE policies.

---

## Table: `businesses`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `View businesses` | public | `is_active = true OR (id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()))` |
| INSERT | `businesses_insert_owner` | public | `auth.uid() IS NOT NULL AND owner_id = auth.uid()` |
| UPDATE | `Users can update own business` | public | `id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT for active businesses or own business. INSERT for authenticated users (owner_id = auth.uid()). UPDATE for business owners. No DELETE.

---

## Table: `deals`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Public can read active deals` | public | `status = 'Active'::deal_status` |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT for active deals only. No INSERT/UPDATE/DELETE policies.

---

## Table: `email_notifications_log`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `email_notifications_log_select_admin` | public | `is_admin()` |
| INSERT | `email_notifications_log_insert_service` | public | `true` (public INSERT) |
| UPDATE | `email_notifications_log_update_admin` | public | `is_admin()` (USING + WITH CHECK) |
| DELETE | `email_notifications_log_delete_admin` | public | `is_admin()` |

**Summary:** Admin SELECT/UPDATE/DELETE. Public INSERT (service role).

---

## Table: `media_items`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `View media items` | public | `true` (public read) |
| INSERT | `Insert media items` | authenticated | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| UPDATE | `Update media items` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| DELETE | `Delete media items` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |

**Summary:** Public SELECT. Authenticated INSERT, UPDATE, DELETE for business owners.

---

## Table: `membership_packages`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Membership packages are publicly viewable.` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `notifications`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `View notifications` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | `Update notifications` | public | `user_id = auth.uid()` (USING + WITH CHECK) |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT. UPDATE for own notifications only. No INSERT/DELETE policies.

---

## Table: `orders`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Business owners view orders` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| INSERT | `orders_insert_public_or_admin` | public | `(EXISTS (SELECT 1 FROM businesses WHERE businesses.id = orders.business_id AND businesses.is_active = true)) OR is_admin()` |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** SELECT for business owners. INSERT for public (active businesses) or admin. No UPDATE/DELETE policies.

---

## Table: `page_content`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `page_content_select_public` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `profiles`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Users can view own profile` | public | `id = auth.uid()` |
| INSERT | `profiles_insert_own` | public | `id = auth.uid()` (WITH CHECK) |
| UPDATE | `Users can update own profile` | public | `id = auth.uid()` (USING + WITH CHECK) |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** SELECT/INSERT/UPDATE for own profile only. No DELETE policy.

---

## Table: `registration_requests`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Admins can view registration requests` | public | `auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)` |
| INSERT | `registration_requests_insert_public` | public | `(email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$') AND (business_name IS NOT NULL) AND (business_name <> '') AND (phone IS NOT NULL) AND (phone <> '')` |
| UPDATE | `Admins can update registration requests` | public | `auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)` |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** SELECT/UPDATE for admins only. Public INSERT with validation. No DELETE policy.

---

## Table: `reviews`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Reviews are viewable by everyone` | public | `true` (public read) |
| INSERT | `Authenticated users can create reviews` | authenticated | `user_id = auth.uid()` (WITH CHECK) |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT. Authenticated INSERT (own reviews). No UPDATE/DELETE policies.

---

## Table: `services`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Services are viewable by everyone` | public | `true` (public read) |
| INSERT | `Owners can insert services` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| UPDATE | `Owners can update services` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| DELETE | `Owners can delete services` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |

**Summary:** Public SELECT. INSERT/UPDATE/DELETE for business owners.

---

## Table: `support_tickets`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Authenticated users can read own tickets` | authenticated | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Authenticated SELECT for business owners. No INSERT/UPDATE/DELETE policies.

---

## Table: `team_members`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Public can read team members` | public | `true` (public read) |
| INSERT | NOT PRESENT | - | No INSERT policy |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** Public SELECT only. No INSERT/UPDATE/DELETE policies.

---

## Table: `business_staff`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `business_staff_select_owner_or_staff` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()) OR user_id = auth.uid()` |
| INSERT | `business_staff_insert_owner` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| UPDATE | `business_staff_update_owner` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |
| DELETE | `business_staff_delete_owner` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())` |

**Summary:** SELECT for business owners and staff members. INSERT/UPDATE/DELETE for business owners only.

---

## Table: `abuse_reports`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `abuse_reports_select_own_or_admin` | public | `reporter_id = auth.uid() OR auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)` |
| INSERT | `abuse_reports_insert_authenticated` | authenticated | `auth.uid() IS NOT NULL` |
| UPDATE | `abuse_reports_update_admin` | public | `auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)` |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** SELECT for reporters and admins. INSERT for authenticated users. UPDATE for admins only. No DELETE.

---

## Table: `page_views`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `page_views_select_admin_or_owner` | public | `auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false) OR (page_type = 'business' AND page_id IN (SELECT slug FROM businesses WHERE id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())))` |
| INSERT | `page_views_insert_public` | public | `true` (public INSERT) |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** SELECT for admins and business owners (own business views). Public INSERT (tracking). No UPDATE/DELETE.

---

## Table: `conversions`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `conversions_select_owner_or_admin` | public | `business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()) OR auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)` |
| INSERT | `conversions_insert_public` | public | `true` (public INSERT) |
| UPDATE | NOT PRESENT | - | No UPDATE policy |
| DELETE | NOT PRESENT | - | No DELETE policy |

**Summary:** SELECT for business owners and admins. Public INSERT (tracking). No UPDATE/DELETE.

---

## Notes

- All tables have RLS enabled
- Policies listed here are EXACTLY as they exist in the database
- `is_admin()` is a function that checks if user email exists in `admin_users` table with `is_locked = false`
- `auth.uid()` is a Supabase Auth function that returns the current user's UUID
- `auth.email()` is a Supabase Auth function that returns the current user's email
- If an operation (INSERT/UPDATE/DELETE) is not listed, NO POLICY exists for that operation (operation will be blocked)
- Public SELECT policies with `true` condition allow anyone (including anonymous users) to read

---

**END OF RLS DOCUMENTATION**
