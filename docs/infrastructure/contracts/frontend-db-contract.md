# Frontend ↔ Database Contract

**Last Updated:** 2025-01-11  
**Source:** Frontend code analysis aligned with `/docs/infrastructure/database/` documentation  
**Purpose:** Document what frontend code is allowed to read/write from the database

---

## 📋 EXECUTIVE SUMMARY

This document specifies the exact contract between frontend code and the Supabase database. All frontend queries must comply with this contract.

**Total Tables Used by Frontend:** 18  
**Total RPC Functions Called:** 2  
**Status:** ✅ Aligned with database schema

---

## 🔍 TABLES USED BY FRONTEND

### Table: `admin_activity_logs`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - INSERT, SELECT, UPDATE, DELETE

**Columns Used:**
- `id`, `admin_username`, `action`, `details`, `timestamp`, `created_at`

**Operations:**
- SELECT: Admin only (RLS)
- INSERT: Admin only (RLS)
- UPDATE: Admin only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `admin_users`

**Frontend Usage:**
- `contexts/AdminContext.tsx` - SELECT
- `contexts/AuthContext.tsx` - SELECT

**Columns Used:**
- `id`, `username`, `email`, `password`, `role`, `permissions`, `last_login`, `is_locked`

**Operations:**
- SELECT: Public read (RLS allows all)

---

### Table: `announcements`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - SELECT, INSERT, DELETE
- `contexts/AdminContext.tsx` - SELECT

**Columns Used:**
- `id`, `title`, `content`, `type`, `created_at`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Admin only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `app_settings`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - SELECT, UPDATE
- `contexts/AdminContext.tsx` - SELECT, UPDATE

**Columns Used:**
- `id` (always = 1), `settings_data`

**Operations:**
- SELECT: Public read (RLS allows all)
- UPDATE: Admin only (RLS)

---

### Table: `appointments`

**Frontend Usage:**
- `contexts/BusinessContext.tsx` - SELECT, INSERT, UPDATE

**Columns Used:**
- `id`, `business_id`, `service_id`, `service_name`, `staff_member_id`, `customer_name`, `customer_email`, `customer_phone`, `date`, `time_slot`, `status`, `notes`, `created_at`

**Operations:**
- SELECT: Public OR business owner (RLS)
- INSERT: Public (active businesses only) OR admin (RLS)
- UPDATE: Business owner only (RLS)

---

### Table: `blog_categories`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT
- `contexts/BlogDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `name`, `created_at`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Admin only (RLS)
- UPDATE: Admin only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `blog_comments`

**Frontend Usage:**
- `contexts/BlogDataContext.tsx` - SELECT, INSERT
- `contexts/BusinessDataContext.tsx` - SELECT

**Columns Used:**
- `id`, `post_id`, `author_name`, `content`, `date`, `created_at`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Authenticated users only (RLS)

---

### Table: `blog_posts`

**Frontend Usage:**
- `contexts/BlogDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE
- `contexts/BusinessDataContext.tsx` - SELECT

**Columns Used:**
- `id`, `slug`, `title`, `image_url`, `excerpt`, `author`, `date`, `category`, `content`, `view_count`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Admin only (RLS)
- UPDATE: Admin only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `business_blog_posts`

**Frontend Usage:**
- `contexts/BusinessContext.tsx` - SELECT, INSERT, UPDATE, DELETE
- `contexts/BusinessBlogDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `business_id`, `slug`, `title`, `excerpt`, `image_url`, `content`, `author`, `created_date`, `published_date`, `status`, `view_count`, `is_featured`, `seo`

**Operations:**
- SELECT: Public (published only) OR business owner OR admin (RLS)
- INSERT: Business owner OR admin (RLS)
- UPDATE: Business owner OR admin (RLS)
- DELETE: Business owner OR admin (RLS)

---

### Table: `businesses`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE
- `contexts/BusinessContext.tsx` - SELECT
- All contexts - Used extensively

**Columns Used:**
- All 33 columns (see `schema.md` for full list)

**Operations:**
- SELECT: Public (active only) OR business owner (RLS)
- INSERT: Authenticated users (owner_id = auth.uid()) (RLS)
- UPDATE: Business owner only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `deals`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `business_id`, `title`, `description`, `image_url`, `start_date`, `end_date`, `discount_percentage`, `original_price`, `deal_price`, `status`

**Operations:**
- SELECT: Public (active only) OR business owner OR admin (RLS)
- INSERT: Business owner OR admin (RLS)
- UPDATE: Business owner OR admin (RLS)
- DELETE: Business owner OR admin (RLS)

---

### Table: `email_notifications_log`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - SELECT, INSERT, UPDATE, DELETE
- `lib/emailService.ts` - INSERT

**Columns Used:**
- `id`, `recipient_email`, `subject`, `body`, `sent_at`, `read`, `read_at`, `created_at`

**Operations:**
- SELECT: Admin only (RLS)
- INSERT: Public (service role) (RLS)
- UPDATE: Admin only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `media_items`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `business_id`, `url`, `type`, `category`, `title`, `description`, `position`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Authenticated (business owner) (RLS)
- UPDATE: Business owner only (RLS)
- DELETE: Business owner only (RLS)

---

### Table: `membership_packages`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `name`, `price`, `duration_months`, `description`, `features`, `is_active`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Admin only (RLS)
- UPDATE: Admin only (RLS)
- DELETE: Admin only (RLS)

---

### Table: `notifications`

**Frontend Usage:**
- Not directly queried by frontend (trigger-based)

**Columns:**
- `id`, `user_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`

**Operations:**
- SELECT: Public read (RLS allows all)
- UPDATE: Own notifications only (RLS)

---

### Table: `orders`

**Frontend Usage:**
- `contexts/BusinessContext.tsx` - SELECT, INSERT, UPDATE
- `contexts/BusinessBlogDataContext.tsx` - SELECT, INSERT, UPDATE
- `contexts/OrderDataContext.tsx` - SELECT, INSERT, UPDATE

**Columns Used:**
- ✅ `id`, `business_id`, `business_name`, `package_id`, `package_name`, `amount`, `status`, `payment_method`, `submitted_at`, `confirmed_at`, `notes`

**Columns NOT Used (removed from frontend):**
- ❌ `total_amount` (removed - does not exist in DB)
- ❌ `customer_name` (removed - does not exist in DB)
- ❌ `customer_email` (removed - does not exist in DB)
- ❌ `customer_phone` (removed - does not exist in DB)

**Operations:**
- SELECT: Business owner only (RLS)
- INSERT: Public (active businesses) OR admin (RLS)
- UPDATE: Business owner OR admin (RLS)

---

### Table: `page_content`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - SELECT, UPDATE
- `contexts/AdminContext.tsx` - SELECT, UPDATE
- `contexts/HomepageDataContext.tsx` - SELECT
- `contexts/PublicPageContentContext.tsx` - SELECT

**Columns Used:**
- ✅ `page_name` (PRIMARY KEY), `content_data`

**Columns NOT Used (removed from frontend):**
- ❌ `id` (removed - does not exist in DB, primary key is `page_name`)

**Operations:**
- SELECT: Public read (RLS allows all)
- UPDATE: Admin only (RLS)

---

### Table: `profiles`

**Frontend Usage:**
- `contexts/UserSessionContext.tsx` - SELECT, INSERT, UPDATE
- `contexts/UserDataContext.tsx` - SELECT, UPDATE

**Columns Used:**
- `id`, `updated_at`, `full_name`, `avatar_url`, `email`, `business_id`, `favorites`

**Operations:**
- SELECT: Own profile only (RLS)
- INSERT: Own profile only (RLS)
- UPDATE: Own profile only (RLS)

---

### Table: `registration_requests`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - SELECT, UPDATE
- `contexts/AdminContext.tsx` - SELECT, UPDATE
- `pages/PartnerRegistrationPage.tsx` - INSERT

**Columns Used:**
- ✅ `id`, `business_name`, `email`, `phone`, `address`, `category` (singular), `tier`, `submitted_at`, `status`

**Columns NOT Used (removed from frontend):**
- ❌ `city` (removed - does not exist in DB)
- ❌ `district` (removed - does not exist in DB)
- ❌ `categories` (removed - does not exist, use `category` singular)
- ❌ `notes` (removed - does not exist in DB)

**Operations:**
- SELECT: Admin only (RLS)
- INSERT: Public (with validation) (RLS)
- UPDATE: Admin only (RLS)

---

### Table: `reviews`

**Frontend Usage:**
- `contexts/BusinessContext.tsx` - SELECT, INSERT, UPDATE
- `contexts/BusinessBlogDataContext.tsx` - SELECT, INSERT, UPDATE
- `contexts/BusinessDataContext.tsx` - SELECT

**Columns Used:**
- `id`, `user_id`, `business_id`, `user_name`, `user_avatar_url`, `rating`, `comment`, `submitted_date`, `status`, `reply`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Authenticated users only (RLS)

---

### Table: `services`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `business_id`, `name`, `price`, `description`, `image_url`, `duration_minutes`, `position`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Business owner only (RLS)
- UPDATE: Business owner only (RLS)
- DELETE: Business owner only (RLS)

---

### Table: `support_tickets`

**Frontend Usage:**
- `contexts/AdminPlatformContext.tsx` - SELECT, INSERT, UPDATE
- `contexts/AdminContext.tsx` - SELECT

**Columns Used:**
- `id`, `business_id`, `business_name`, `subject`, `message`, `status`, `created_at`, `last_reply_at`, `replies`

**Operations:**
- SELECT: Authenticated (business owner) (RLS)
- INSERT: Business owner OR admin (RLS)
- UPDATE: Business owner OR admin (RLS)

---

### Table: `team_members`

**Frontend Usage:**
- `contexts/BusinessDataContext.tsx` - SELECT, INSERT, UPDATE, DELETE

**Columns Used:**
- `id`, `business_id`, `name`, `role`, `image_url`

**Operations:**
- SELECT: Public read (RLS allows all)
- INSERT: Business owner OR admin (RLS)
- UPDATE: Business owner OR admin (RLS)
- DELETE: Business owner OR admin (RLS)

---

## 🔧 RPC FUNCTIONS CALLED BY FRONTEND

### `search_businesses`

**Location:** `contexts/BusinessDataContext.tsx:120`

**Parameters:**
- `p_search_text` (text, nullable)
- `p_category` (business_category, nullable)
- `p_city` (text, nullable)
- `p_district` (text, nullable)
- `p_tags` (text array, nullable)
- `p_limit` (integer)
- `p_offset` (integer)

**Return Type:** `record` (query result with multiple columns)

**Description:** Full-text search for businesses with filtering options.

---

### `increment_business_blog_view_count`

**Location:** `contexts/BusinessBlogDataContext.tsx:155`

**Parameters:**
- `p_post_id` (uuid)

**Return Type:** `void`

**Description:** Increments view_count for a business blog post.

---

## ❌ FRONTEND ASSUMPTIONS REMOVED

### 1. `orders` Table

**Removed Fields:**
- ❌ `total_amount` → ✅ Use `amount` instead
- ❌ `customer_name` → ✅ NOT in orders table (exists in appointments table)
- ❌ `customer_email` → ✅ NOT in orders table (exists in appointments table)
- ❌ `customer_phone` → ✅ NOT in orders table (exists in appointments table)

**Fixed Files:**
- `contexts/BusinessContext.tsx:121`
- `contexts/BusinessBlogDataContext.tsx:85`

---

### 2. `registration_requests` Table

**Removed Fields:**
- ❌ `city` → ✅ NOT in database
- ❌ `district` → ✅ NOT in database
- ❌ `categories` (plural) → ✅ Use `category` (singular) instead
- ❌ `notes` → ✅ NOT in database

**Fixed Files:**
- `contexts/AdminPlatformContext.tsx:79`
- `contexts/AdminContext.tsx:328`

---

### 3. `page_content` Table

**Removed Fields:**
- ❌ `id` → ✅ Primary key is `page_name` (text), NOT `id`

**Fixed Files:**
- `contexts/AdminPlatformContext.tsx:83`
- `contexts/AdminContext.tsx:332`

**Note:** `contexts/HomepageDataContext.tsx` and `contexts/PublicPageContentContext.tsx` already use correct columns.

---

## ⚠️ FEATURES BLOCKED DUE TO MISSING DB SUPPORT

### NOT PRESENT IN DATABASE

**No blocked features identified.** All frontend features can be implemented using existing database schema.

**Notes:**
- `orders` table does NOT store customer contact info (customer_name, customer_email, customer_phone) - these exist in `appointments` table, not `orders`
- `registration_requests` does NOT store location details (city, district) - only address (text)
- `page_content` does NOT have numeric `id` - primary key is `page_name` (text)

---

## 🔐 RLS COMPLIANCE

All frontend queries comply with RLS policies. No RLS bypasses are used.

**RLS Policies:** See `/docs/infrastructure/database/rls.md` for complete policy matrix.

**Key RLS Constraints:**
- `orders` SELECT: Business owner only (no public read)
- `registration_requests` SELECT: Admin only
- `admin_activity_logs`: Admin only (all operations)
- `page_content`: Public read, admin update
- `profiles`: Own profile only

---

## 📝 DATA TRANSFORMATION

### camelCase ↔ snake_case

**Frontend Code:** Uses camelCase (e.g., `businessId`, `packageName`)

**Database:** Uses snake_case (e.g., `business_id`, `package_name`)

**Transformation:**
- **Fetch (SELECT):** `snakeToCamel()` converts database snake_case to frontend camelCase
- **Insert/Update:** `toSnakeCase()` converts frontend camelCase to database snake_case

**Implementation:**
- `snakeToCamel()` from `lib/utils.ts` (used when fetching data)
- `toSnakeCase()` defined locally in contexts (used when inserting/updating)

---

## ✅ VERIFICATION

**Query Compliance:**
- ✅ All `.select()` statements use only existing columns
- ✅ All `.insert()` statements use only existing columns
- ✅ All `.update()` statements use only existing columns
- ✅ All RPC function calls use correct parameters

**Type Safety:**
- ✅ TypeScript interfaces match database schema
- ✅ `Order` interface uses `amount` (not `total_amount`)
- ✅ `Order` interface does NOT have customer fields
- ✅ `RegistrationRequest` interface uses `category` (singular, not `categories`)
- ✅ `RegistrationRequest` interface does NOT have `city`, `district`, `notes`

**RLS Compliance:**
- ✅ No RLS bypasses
- ✅ All queries respect RLS policies
- ✅ Admin operations use admin authentication
- ✅ Owner operations check business ownership

---

## 📊 SUMMARY STATISTICS

**Tables Used:** 18 of 23 tables  
**Tables NOT Used:**
- `blog_categories` (used indirectly via blog_posts.category)
- `notifications` (trigger-based, not directly queried)

**RPC Functions Used:** 2 of 15 functions
- `search_businesses`
- `increment_business_blog_view_count`

**RPC Functions NOT Used:**
- `get_business_count`
- `increment_blog_view_count`
- `increment_business_view_count`
- `increment_view_count`
- `search_blog_posts`

---

---

## 🎯 BUSINESS LIFECYCLE & TRIAL MANAGEMENT

### Registration Flows

**User Registration (`/register` - User Type):**
1. User selects "Người dùng" (User) option
2. User signs up via `supabase.auth.signUp()` (NO email verification)
3. Profile created automatically via `handle_new_user` trigger
   - `business_id = NULL` (regular user, not business owner)
4. User redirected to homepage (`/`)
5. Can browse businesses, create reviews, make appointments
6. Cannot access business dashboard

**Business Registration (`/register` - Business Type):**
1. User selects "Doanh nghiệp" (Business) option
2. User signs up via `supabase.auth.signUp()` (NO email verification)
3. Profile created automatically via `handle_new_user` trigger
4. Business created immediately via `createBusinessWithTrial()` utility
5. Trial initialized: `membership_tier = 'Premium'`, `membership_expiry_date = now() + 30 days`
6. Profile updated with `business_id` linking to created business
7. User redirected to `/account` (Business Dashboard)

**Registration Request Flow (`approve-registration` Edge Function):**
1. Admin approves registration request
2. Business created with trial (Premium, 30 days) - **ignores requested tier**
3. User invited via email
4. Profile linked to business

**Centralized Functions:**
- `lib/businessUtils.ts::createBusinessWithTrial()` - Creates business with trial
- `lib/businessUtils.ts::initializeTrial()` - Initializes trial for existing business
- `lib/businessUtils.ts::checkAndHandleTrialExpiry()` - Checks and downgrades expired trials
- `lib/businessUtils.ts::activateBusinessFromOrder()` - Activates business when paid order completes

### Trial Rules

**Trial Initialization:**
- All new businesses start with `membership_tier = 'Premium'`
- Trial duration: **30 days** from creation date
- `membership_expiry_date` set to `now() + 30 days`
- `is_active = true` (business is immediately active)

**Trial Expiry Handling:**
- Checked on dashboard access (lazy check in `UserBusinessDashboardPage`)
- If `membership_tier = 'Premium'` AND `membership_expiry_date < now()`:
  - Downgrade to `membership_tier = 'Free'`
  - Set `membership_expiry_date = null`
  - **Do NOT** set `is_active = false` (business remains active)
  - **Do NOT** block login or access

**Paid Package Activation:**
- When order status changes to `COMPLETED`:
  - Business activated via `activateBusinessFromOrder()`
  - `membership_tier` set to package tier
  - `membership_expiry_date` set to `now() + package.durationMonths`
  - `is_active = true`

### Email Verification

**Status:** ❌ **DISABLED**
- Direct registration skips email verification entirely
- Users go directly to dashboard after signup
- No confirmation email sent

### Payment Flow

**Status:** Manual payment only
- No payment gateway integration
- Orders created with status `Pending` or `Awaiting Confirmation`
- Admin manually confirms payment → order status → `Completed`
- Business activated when order is `Completed`

---

**END OF FRONTEND-DB CONTRACT DOCUMENTATION**
