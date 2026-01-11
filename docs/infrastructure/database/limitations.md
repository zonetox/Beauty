# Database Limitations and Constraints

**Last Updated:** 2025-01-11  
**Source:** Supabase Database (read via MCP)  
**Note:** This document explicitly lists what does NOT exist in the database, structural constraints, and limitations visible from the schema.

---

## Missing Foreign Key Relations

The following tables have columns that could reference other tables but DO NOT have foreign key constraints:

### Tables with NO Foreign Keys

- `admin_activity_logs` - No foreign keys (could reference `admin_users` but does not)
- `admin_users` - No foreign keys
- `announcements` - No foreign keys
- `app_settings` - No foreign keys
- `blog_categories` - No foreign keys
- `blog_posts` - No foreign keys (category column is text, not FK to blog_categories)
- `blog_comments` - Has FK to `blog_posts.id` ✅
- `business_blog_posts` - Has FK to `businesses.id` ✅
- `email_notifications_log` - No foreign keys (does not reference users or businesses)
- `membership_packages` - No foreign keys (not referenced by orders table via FK)
- `page_content` - No foreign keys
- `registration_requests` - No foreign keys (does not reference businesses or users)

**Note:** `orders.package_id` is text, NOT a foreign key to `membership_packages.id`

---

## Missing Relations (Potential but Not Implemented)

### `blog_posts.category` → `blog_categories`

- **Current:** `blog_posts.category` is `text` type
- **Could be:** Foreign key to `blog_categories.id`
- **Status:** NOT PRESENT - Category is stored as text, not FK

### `orders.package_id` → `membership_packages`

- **Current:** `orders.package_id` is `text` type
- **Could be:** Foreign key to `membership_packages.id`
- **Status:** NOT PRESENT - Package ID is stored as text, not FK

### `admin_activity_logs.admin_username` → `admin_users`

- **Current:** `admin_activity_logs.admin_username` is `text` type
- **Could be:** Foreign key to `admin_users.username` (or join via email)
- **Status:** NOT PRESENT - Admin username is stored as text, not FK

---

## Unused Enum Types

### `staff_member_role`

- **Enum Values:** `Admin`, `Editor`
- **Status:** NOT USED - Enum type exists in database but no columns use it
- **Location:** Enum type is defined but not referenced by any table column

---

## Missing Triggers in Public Schema

**Status:** NO TRIGGERS PRESENT in public schema tables

**Functions that return `trigger` type exist:**
- `handle_new_user` - trigger function (used on `auth.users`, not public schema)
- `update_business_ratings` - trigger function (NOT attached to any table in public schema)

**Conclusion:** No triggers are attached to tables in the public schema.

---

## Structural Constraints

### CHECK Constraints

#### `reviews.rating`
- **Constraint:** `rating >= 1 AND rating <= 5`
- **Status:** PRESENT

#### `registration_requests.status`
- **Constraint:** `status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text])`
- **Status:** PRESENT
- **Note:** Status is `text` type with CHECK constraint, NOT an enum type

---

## Missing RLS Policies

The following tables have RLS enabled but are MISSING policies for certain operations:

### Tables with Missing INSERT Policies

- `admin_users` - No INSERT policy
- `announcements` - No INSERT policy
- `app_settings` - No INSERT policy
- `blog_categories` - No INSERT policy
- `blog_posts` - No INSERT policy
- `business_blog_posts` - No INSERT policy
- `deals` - No INSERT policy
- `membership_packages` - No INSERT policy
- `page_content` - No INSERT policy
- `profiles` - Has INSERT policy ✅
- `support_tickets` - No INSERT policy
- `team_members` - No INSERT policy

### Tables with Missing UPDATE Policies

- `admin_users` - No UPDATE policy
- `announcements` - No UPDATE policy
- `app_settings` - No UPDATE policy
- `blog_categories` - No UPDATE policy
- `blog_comments` - No UPDATE policy
- `blog_posts` - No UPDATE policy
- `business_blog_posts` - No UPDATE policy
- `deals` - No UPDATE policy
- `membership_packages` - No UPDATE policy
- `orders` - No UPDATE policy
- `page_content` - No UPDATE policy
- `reviews` - No UPDATE policy
- `support_tickets` - No UPDATE policy
- `team_members` - No UPDATE policy

### Tables with Missing DELETE Policies

- `admin_users` - No DELETE policy
- `announcements` - No DELETE policy
- `app_settings` - No DELETE policy
- `appointments` - No DELETE policy
- `blog_categories` - No DELETE policy
- `blog_comments` - No DELETE policy
- `blog_posts` - No DELETE policy
- `business_blog_posts` - No DELETE policy
- `businesses` - No DELETE policy
- `deals` - No DELETE policy
- `membership_packages` - No DELETE policy
- `notifications` - No DELETE policy
- `orders` - No DELETE policy
- `page_content` - No DELETE policy
- `profiles` - No DELETE policy
- `registration_requests` - No DELETE policy
- `reviews` - No DELETE policy
- `support_tickets` - No DELETE policy
- `team_members` - No DELETE policy

---

## Array Columns Without Constraints

### `businesses.categories`
- **Type:** `ARRAY (business_category)`
- **Constraint:** NOT NULL (array must exist)
- **Limitation:** No validation of array length or uniqueness of values

### `businesses.tags`
- **Type:** `ARRAY (text)`
- **Constraint:** NULL allowed
- **Limitation:** No validation of array length or uniqueness of values

### `membership_packages.features`
- **Type:** `ARRAY (text)`
- **Constraint:** NULL allowed
- **Limitation:** No validation of array length or uniqueness of values

### `profiles.favorites`
- **Type:** `ARRAY (bigint)`
- **Constraint:** NULL allowed
- **Limitation:** No foreign key validation (no FK constraint on array elements)

---

## JSONB Columns Without Schema Validation

The following columns are JSONB type without JSON schema validation:

- `businesses.working_hours` (NOT NULL)
- `businesses.socials` (nullable)
- `businesses.seo` (nullable)
- `businesses.notification_settings` (nullable)
- `businesses.hero_slides` (nullable)
- `businesses.staff` (nullable, default: `'[]'::jsonb`)
- `business_blog_posts.seo` (nullable)
- `deals` - No JSONB columns
- `email_notifications_log` - No JSONB columns
- `media_items` - No JSONB columns
- `membership_packages.permissions` (nullable)
- `notifications` - No JSONB columns
- `orders` - No JSONB columns
- `page_content.content_data` (nullable)
- `reviews.reply` (nullable)
- `support_tickets.replies` (nullable)

**Limitation:** JSONB columns have no schema validation - structure is not enforced by database.

---

## No Derived Tables or Views

**Status:** NO VIEWS PRESENT in public schema

**Note:** System views exist (v_index_usage, v_slow_queries, v_unused_indexes) but these are PostgreSQL system views, not user-created views.

---

## Primary Key Constraints

All tables have primary keys. See `schema.md` for details.

**Special Cases:**
- `page_content` - Primary key is `page_name` (text), NOT `id`
- `membership_packages` - Primary key is `id` (text), not numeric

---

## Unique Constraints

The following columns have UNIQUE constraints (in addition to primary keys):

- `admin_users.username` - Unique
- `admin_users.email` - Unique
- `blog_categories.name` - Unique
- `businesses.slug` - Unique
- `blog_posts.slug` - Unique

---

## Summary

**Missing Foreign Keys:** 3 potential relations not implemented (blog_posts.category, orders.package_id, admin_activity_logs.admin_username)

**Unused Enum Types:** 1 (`staff_member_role`)

**Triggers in Public Schema:** NOT PRESENT

**RLS Policies:** Many tables missing INSERT/UPDATE/DELETE policies (see list above)

**Views:** NOT PRESENT in public schema

**JSONB Schema Validation:** NOT PRESENT (all JSONB columns have no schema validation)

**Array Constraints:** NOT PRESENT (no length limits or uniqueness checks)

---

**END OF LIMITATIONS DOCUMENTATION**
