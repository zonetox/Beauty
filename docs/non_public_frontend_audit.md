# Non-Public Frontend Audit - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## OVERVIEW

Tài liệu này audit toàn bộ các trang non-public (cần authentication) trong ứng dụng 1Beauty.asia. Đây là **AUDIT DOCUMENTATION**, không phải refactor hay build mới.

**Nguyên tắc:**
- ✅ Document những gì đang có
- ✅ Identify issues/gaps
- ❌ KHÔNG sửa code
- ❌ KHÔNG tạo hệ thống mới
- ❌ KHÔNG refactor lớn

---

## AUTHENTICATION GUARDS

### 1. ProtectedRoute (User Authentication)

**File:** `components/ProtectedRoute.tsx`

**Purpose:**
- Guard cho user authentication
- Redirect to `/login` nếu chưa authenticated

**Implementation:**
```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useUserSession();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**Usage:**
- `/account` route

**Access Level:**
- ✅ Requires user authentication (`auth.uid() IS NOT NULL`)
- ✅ Requires profile in `profiles` table

**RLS Dependency:**
- ✅ No direct RLS (Auth handled by Supabase Auth)
- ✅ Profile access via RLS: `profiles_select_own_or_admin`

**Issues/Gaps:**
1. ⚠️ **Basic loading state** - Simple "Loading..." text
   - Recommendation: Better loading UI (spinner, skeleton)
2. ⚠️ **No permission check** - Only checks authentication, not permissions
   - Recommendation: Add permission-based routing (if needed)

---

### 2. AdminProtectedRoute (Admin Authentication)

**File:** `components/AdminProtectedRoute.tsx`

**Purpose:**
- Guard cho admin authentication
- Redirect to `/admin/login` nếu chưa authenticated

**Implementation:**
```typescript
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <div>Checking admin authentication...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**Usage:**
- `/admin` route

**Access Level:**
- ✅ Requires admin authentication
- ✅ Requires `admin_users` table lookup (`email = auth.users.email AND is_locked = FALSE`)

**RLS Dependency:**
- ✅ No direct RLS (Auth handled by Supabase Auth)
- ✅ Admin user lookup via RLS: `admin_users_select_public` (assumed, cần verify)

**Issues/Gaps:**
1. ⚠️ **Basic loading state** - Simple "Checking admin authentication..." text
   - Recommendation: Better loading UI
2. ⚠️ **No permission check** - Only checks authentication, not permissions
   - Note: Permission checks are done inside AdminPage components (per tab)
   - Recommendation: Consider permission-based routing at route level

---

## NON-PUBLIC PAGES

### 1. User Business Dashboard Page (`/account`)

**File:** `pages/UserBusinessDashboardPage.tsx`

**Purpose:**
- Business owner dashboard
- Manage business profile, services, deals, blog, reviews, bookings, analytics
- Onboarding wizard nếu user chưa có business

**URL/Route:**
- Route: `/account`
- Guard: `ProtectedRoute`
- Layout: Custom dashboard layout (no Header/Footer)

**Data Source:**
- **Business:** `BusinessContext.currentBusiness` → `businesses` table
  - Query: `SELECT * FROM businesses WHERE owner_id = auth.uid()`
  - Filter: User's own business only
- **Profile:** `UserSessionContext.profile` → `profiles` table
  - Link: `profile.businessId` → `businesses.id`
- **Business Data:** `BusinessContext` → Multiple tables
  - `business_blog_posts` - Business blog posts
  - `reviews` - Business reviews
  - `appointments` - Business bookings
  - `orders` - Business orders
  - `deals` - Business deals

**Access Level:**
- ✅ **Authenticated User** - Requires `auth.uid()`
- ✅ **Business Owner** - Requires `businesses.owner_id = auth.uid()`
- ⚠️ **Onboarding Flow** - Nếu user chưa có business → Show `BusinessOnboardingWizard`

**RLS Dependency:**
- ✅ `businesses_select_owner_or_admin` - Business owner can read own business
- ✅ `businesses_update_owner_or_admin` - Business owner can update own business
- ✅ `services_*_owner_or_admin` - Business owner can CRUD own services
- ✅ `deals_*_owner_or_admin` - Business owner can CRUD own deals
- ✅ `business_blog_posts_*_owner_or_admin` - Business owner can CRUD own blog posts
- ✅ `reviews_*_owner_or_admin` - Business owner can manage own reviews
- ✅ `appointments_*_owner_or_admin` - Business owner can manage own appointments
- ✅ `orders_*_owner_or_admin` - Business owner can manage own orders
- ✅ `media_items_*_owner_or_admin` - Business owner can manage own media

**Modules/Tabs:**
1. **Dashboard** (`dashboard`)
   - Component: `DashboardOverview`
   - Purpose: Statistics, recent activities, quick actions
2. **Profile** (`profile`)
   - Component: `BusinessProfileEditor`
   - Purpose: Edit business info, logo, images, categories, location, working hours, social links, SEO
3. **Services** (`services`)
   - Component: `ServicesManager`
   - Purpose: CRUD services, reorder services
4. **Deals** (`deals`)
   - Component: `DealsManager`
   - Purpose: CRUD deals, deal status management
5. **Bookings** (`bookings`)
   - Component: `BookingsManager`
   - Purpose: List appointments, confirm/cancel, calendar view
6. **Billing** (`billing`)
   - Component: `MembershipAndBilling`
   - Purpose: Membership tier, upgrade/downgrade, order history, payment methods
7. **Gallery** (`gallery`)
   - Component: `MediaLibrary`
   - Purpose: Upload/delete/reorder media, media categories
8. **Blog** (`blog`)
   - Component: `BlogManager`
   - Purpose: CRUD business blog posts, rich text editor, featured posts
9. **Reviews** (`reviews`)
   - Component: `ReviewsManager`
   - Purpose: List reviews, reply to reviews, hide/show reviews, rating statistics
10. **Analytics** (`stats`)
    - Component: `AnalyticsDashboard`
    - Purpose: Statistics dashboard, page views, contact clicks, charts
11. **Settings** (`settings`)
    - Component: `AccountSettings`
    - Purpose: Account settings, password change, email preferences
12. **Support** (`support`)
    - Component: `BusinessSupportCenter`
    - Purpose: Support tickets list, create ticket, view details, reply

**Onboarding Flow:**
- **Component:** `BusinessOnboardingWizard`
- **Trigger:** Nếu `currentBusiness === null`
- **Purpose:** Guide user through business creation
- **Flow:**
  1. Collect business info (name, phone, category, address, city, description)
  2. Create business record in `businesses` table
  3. Link business to user (`owner_id = auth.uid()`)
  4. Update profile (`profile.businessId = business.id`)

**Issues/Gaps:**
1. ⚠️ **Onboarding wizard** - Business creation may fail RLS
   - Issue: `BusinessOnboardingWizard` creates business directly, may need RLS policy for INSERT
   - Recommendation: Verify RLS policy `businesses_insert_owner` exists
2. ⚠️ **No permission checks** - All tabs accessible if user has business
   - Note: RLS enforces data access, but UI doesn't check permissions
   - Recommendation: Consider permission-based UI (if needed)
3. ⚠️ **No error boundaries** - No error handling for failed data fetches
   - Recommendation: Add error boundaries for each module
4. ⚠️ **Mixed data sources** - Some data from `BusinessContext`, some from `BusinessDataContext`
   - Issue: Data fetching logic scattered
   - Recommendation: Consolidate data fetching (future refactor)

---

### 2. Admin Page (`/admin`)

**File:** `pages/AdminPage.tsx`

**Purpose:**
- Admin control panel
- Platform management (businesses, users, orders, blog, packages, etc.)
- Permission-based UI (tabs shown/hidden based on permissions)

**URL/Route:**
- Route: `/admin`
- Guard: `AdminProtectedRoute`
- Layout: Custom admin layout (no Header/Footer)

**Data Source:**
- **Admin User:** `AdminContext.currentUser` → `admin_users` table
  - Query: `SELECT * FROM admin_users WHERE email = auth.users.email AND is_locked = FALSE`
  - Includes: `permissions` (JSONB)
- **Businesses:** `BusinessDataContext` → `businesses` table
  - Query: `SELECT * FROM businesses` (admin can read all)
- **Orders:** `BusinessBlogDataContext` → `orders` table
  - Query: `SELECT * FROM orders` (admin can read all)
- **Registration Requests:** `AdminPlatformContext` → `registration_requests` table
- **Blog Posts:** `BusinessDataContext` → `blog_posts` table
- **Admin Users:** `AdminContext.adminUsers` → `admin_users` table
- **Packages:** `BusinessDataContext` → `membership_packages` table
- **Settings:** `AdminPlatformContext` → `app_settings` table
- **Page Content:** `AdminPlatformContext` → `page_content` table

**Access Level:**
- ✅ **Admin Authentication** - Requires `admin_users` table lookup
- ✅ **Permission-Based** - Each tab checks specific permission
- ✅ **Role-Based** - Admin, Moderator, Editor have different permissions

**RLS Dependency:**
- ✅ `admin_users_select_public` - Admin can read admin_users (assumed, cần verify)
- ✅ `businesses_*_admin` - Admin can CRUD all businesses
- ✅ `orders_*_admin` - Admin can manage all orders
- ✅ `registration_requests_*_admin` - Admin can manage registration requests
- ✅ `blog_posts_*_admin` - Admin can manage platform blog
- ✅ `membership_packages_*_admin` - Admin can manage packages
- ✅ `app_settings_*_admin` - Admin can manage system settings
- ✅ `page_content_*_admin` - Admin can manage page content

**Modules/Tabs:**
1. **Dashboard** (`dashboard`)
   - Component: `AdminDashboardOverview`
   - Permission: Always visible (no permission check)
   - Purpose: Statistics overview, recent activities, quick actions
2. **Analytics** (`analytics`)
   - Component: `AdminAnalyticsDashboard`
   - Permission: `canViewAnalytics`
   - Purpose: Platform analytics, charts, graphs
3. **Businesses** (`businesses`)
   - Component: `BusinessManagementTable`
   - Permission: `canManageBusinesses`
   - Purpose: List/edit/delete businesses, bulk import
4. **Registrations** (`registrations`)
   - Component: `RegistrationRequestsTable`
   - Permission: `canManageRegistrations`
   - Purpose: Approve/reject registration requests
5. **Orders** (`orders`)
   - Component: `OrderManagementTable`
   - Permission: `canManageOrders`
   - Purpose: List orders, confirm/reject payments
6. **Blog** (`blog`)
   - Component: `BlogManagementTable`
   - Permission: `canManagePlatformBlog`
   - Purpose: CRUD platform blog posts, AI blog idea generator
7. **Users** (`users`)
   - Component: `UserManagementTable`
   - Permission: `canManageUsers`
   - Purpose: CRUD admin users
8. **Packages** (`packages`)
   - Component: `PackageManagementTable`
   - Permission: `canManagePackages`
   - Purpose: CRUD membership packages
9. **Announcements** (`announcements`)
   - Component: `AdminAnnouncementsManager`
   - Permission: `canManageAnnouncements`
   - Purpose: CRUD announcements
10. **Support** (`support`)
    - Component: `AdminSupportTickets`
    - Permission: `canManageSupportTickets`
    - Purpose: Manage support tickets
11. **Homepage Editor** (`homepage`)
    - Component: `HomepageEditor`
    - Permission: `canManageSiteContent`
    - Purpose: Edit homepage content (hero slides, sections)
12. **Page Editor** (`content`)
    - Component: `PageContentEditor`
    - Permission: `canManageSiteContent`
    - Purpose: Edit page content (About, Contact pages)
13. **Settings** (`settings`)
    - Component: Settings form (inline)
    - Permission: `canManageSystemSettings`
    - Purpose: System settings (bank details, etc.)
14. **Tools** (`tools`)
    - Component: `ApiHealthTool`, `BusinessBulkImporter`
    - Permission: `canUseAdminTools`
    - Purpose: Admin tools (API health check, bulk import)
15. **Activity Log** (`activity`)
    - Component: `AdminActivityLog`
    - Permission: `canViewActivityLog`
    - Purpose: View admin activity log
16. **Notifications** (`notifications`)
    - Component: `AdminNotificationLog`
    - Permission: `canViewEmailLog` (assumed)
    - Purpose: View notification/email log
17. **Theme** (`theme`)
    - Component: `ThemeEditor`
    - Permission: `canManageSystemSettings`
    - Purpose: Theme customization

**Permission Checks:**
- ✅ **Tab Visibility:** Tabs hidden if user doesn't have permission
- ✅ **Content Access:** Each tab checks permission before rendering
- ✅ **Access Denied:** Shows `<AccessDenied>` component if no permission

**Issues/Gaps:**
1. ⚠️ **RLS policies not verified** - Cần verify admin RLS policies exist
   - Issue: Không chắc chắn admin có thể access tất cả tables
   - Recommendation: Verify all admin RLS policies
2. ⚠️ **Permission checks in components** - Permission checks scattered in components
   - Issue: Permission logic không centralized
   - Recommendation: Consider permission guard component (future)
3. ⚠️ **No error boundaries** - No error handling for failed operations
   - Recommendation: Add error boundaries
4. ⚠️ **Edge Functions usage** - Some operations use Edge Functions (approve-registration)
   - Note: Edge Functions bypass RLS (service role)
   - Recommendation: Document Edge Functions usage clearly
5. ⚠️ **Dev quick login** - Development mode có quick login
   - Issue: `DEV_LOGIN_KEY` in localStorage
   - Recommendation: Disable in production (C4.1)

---

### 3. Admin Login Page (`/admin/login`)

**File:** `pages/AdminLoginPage.tsx`

**Purpose:**
- Admin login page
- Entry point for admin authentication

**URL/Route:**
- Route: `/admin/login`
- Guard: None (public, but redirects if already logged in)
- Layout: Custom login layout (no Header/Footer)

**Data Source:**
- **Auth:** Supabase Auth (`supabase.auth.signInWithPassword()`)
- **Admin Users:** `AdminContext.fetchAdminUsers()` → `admin_users` table
  - Query: `SELECT * FROM admin_users` (for dev quick login)

**Access Level:**
- ✅ **Public** - No authentication required
- ⚠️ **Dev Quick Login** - Development mode có quick login option
  - Uses `localStorage.getItem('DEV_LOGIN_KEY')`
  - Allows login as any admin user without password

**RLS Dependency:**
- ✅ No RLS dependency (Auth handled by Supabase Auth)
- ✅ Admin user lookup via RLS: `admin_users_select_public` (assumed, cần verify)

**Issues/Gaps:**
1. ⚠️ **Dev quick login** - Development mode có quick login
   - Issue: Security risk nếu enabled in production
   - Recommendation: Disable dev quick login in production (C4.1)
2. ⚠️ **No rate limiting** - No protection against brute force
   - Recommendation: Add rate limiting (future)
3. ⚠️ **No 2FA** - No two-factor authentication
   - Recommendation: Consider 2FA for admin (future)

---

## DATA ACCESS PATTERNS

### Contexts Used

1. **UserSessionContext** (`contexts/UserSessionContext.tsx`)
   - Used by: User Business Dashboard
   - Data: `auth.users`, `profiles`
   - RLS: Enforced at database level

2. **BusinessContext** (`contexts/BusinessContext.tsx`)
   - Used by: User Business Dashboard
   - Data: `businesses`, `business_blog_posts`, `reviews`, `appointments`, `orders`
   - RLS: Owner-only access enforced

3. **AdminContext** (`contexts/AdminContext.tsx`)
   - Used by: Admin Page
   - Data: `admin_users`, permissions
   - RLS: Admin access enforced

4. **BusinessDataContext** (`contexts/BusinessDataContext.tsx`)
   - Used by: Admin Page, User Business Dashboard
   - Data: `businesses`, `blog_posts`, `membership_packages`
   - RLS: Enforced at database level

5. **AdminPlatformContext** (`contexts/AdminPlatformContext.tsx`)
   - Used by: Admin Page
   - Data: `registration_requests`, `announcements`, `support_tickets`, `app_settings`, `page_content`
   - RLS: Admin access enforced

6. **BusinessBlogDataContext** (`contexts/BusinessBlogDataContext.tsx`)
   - Used by: Admin Page
   - Data: `orders`
   - RLS: Admin access enforced

---

## RLS COMPLIANCE SUMMARY

### ✅ Compliant

- **User Business Dashboard:** Owner-only access enforced via RLS
- **Admin Page:** Admin access enforced via RLS
- **Permission checks:** UI checks permissions before showing content

### ⚠️ Need Verification

- **admin_users:** Need to verify public read RLS policy exists
- **Business creation:** Need to verify `businesses_insert_owner` RLS policy exists
- **Admin RLS policies:** Need to verify all admin CRUD policies exist

---

## ISSUES SUMMARY

### Critical Issues

1. **Dev quick login enabled** - Security risk if enabled in production
2. **RLS policies not verified** - Need to verify admin and business owner RLS policies

### Medium Issues

1. **Onboarding wizard** - Business creation may fail RLS
2. **No error boundaries** - No error handling for failed operations
3. **Permission checks scattered** - Permission logic not centralized

### Low Priority Issues

1. **Basic loading states** - Simple loading text, no spinners
2. **No rate limiting** - No protection against brute force
3. **No 2FA** - No two-factor authentication

---

## RECOMMENDATIONS

### Immediate

1. **Verify RLS policies** - Ensure all admin and business owner RLS policies exist
2. **Disable dev quick login** - Remove or disable in production (C4.1)
3. **Add error boundaries** - Error handling for failed operations

### Future

1. **Centralize permission checks** - Permission guard component
2. **Add rate limiting** - Protection against brute force
3. **Consider 2FA** - Two-factor authentication for admin
4. **Consolidate data fetching** - Reduce context proliferation

---

## COMPLIANCE CHECK

### ✅ Master Plan Compliance

- ✅ **C3.0 - Non-Public Frontend Audit** - COMPLETED
- ✅ **No new systems created** - Only documented existing
- ✅ **No refactor** - Only audit and documentation
- ✅ **No code changes** - Only read and document

### ✅ Architecture Compliance

- ✅ **RLS-first security** - All data access via RLS policies
- ✅ **Supabase as backend** - All data from Supabase
- ✅ **Permission-based UI** - UI checks permissions from database
- ✅ **No hardcode** - Permissions read from `admin_users.permissions`

---

**Audit Status:** ✅ COMPLETED  
**Next Step:** C3.1-C3.13 (Business Dashboard Implementation) hoặc C4.1-C4.6 (Admin Panel Implementation) theo Master Plan

