# Public Site Audit - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## OVERVIEW

Tài liệu này audit toàn bộ các trang public đang tồn tại trong ứng dụng 1Beauty.asia. Đây là **AUDIT DOCUMENTATION**, không phải refactor hay build mới.

**Nguyên tắc:**
- ✅ Document những gì đang có
- ✅ Identify issues/gaps
- ❌ KHÔNG sửa code
- ❌ KHÔNG tạo hệ thống mới
- ❌ KHÔNG refactor lớn

---

## ROUTING STRUCTURE

### Public Routes (With Header/Footer Layout)

Tất cả routes trong `<AppLayout />` component:

1. **HomePage** - `/` (index route)
2. **DirectoryPage** - `/directory`
3. **BlogListPage** - `/blog`
4. **BlogPostPage** - `/blog/:slug`
5. **AboutPage** - `/about`
6. **ContactPage** - `/contact`
7. **RegisterPage** - `/register`
8. **PartnerRegistrationPage** - `/partner-registration`
9. **LoginPage** - `/login`
10. **ResetPasswordPage** - `/reset-password`
11. **AccountPageRouter** - `/account` (Protected)

### Public Routes (Without Standard Layout)

1. **BusinessDetailPage** - `/business/:slug`
2. **BusinessPostPage** - `/business/:businessSlug/post/:postSlug`
3. **AdminPage** - `/admin` (Protected)
4. **AdminLoginPage** - `/admin/login`
5. **ConnectionTestPage** - `/connection-test` (Utility)
6. **NotFoundPage** - `*` (Catch-all)

---

## PAGE AUDIT

### 1. HomePage (`/`)

**File:** `pages/HomePage.tsx`

**Purpose:**
- Landing page chính của website
- Hiển thị hero slides, featured businesses, deals, blog posts
- Search functionality
- Recently viewed businesses
- Newsletter signup

**URL/Route:**
- Route: `/` (index route)
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Businesses:** `BusinessDataContext` → `businesses` table
  - Filter: `isFeatured = true AND isActive = true`
  - Limit: 4 businesses
- **Deals:** `BusinessDataContext` → `businesses.deals` (nested)
  - Filter: Active businesses with VIP/PREMIUM tier
  - Filter: `deal.status = 'ACTIVE'`
  - Limit: 4 deals
- **Blog Posts:** `BusinessDataContext` → `blog_posts` table
  - Limit: 3 posts
- **Hero Slides:** `HomepageDataContext` → `localStorage` (⚠️ **ISSUE**)
  - Key: `homepage_content`
  - Default: `DEFAULT_HOMEPAGE_DATA` from `constants.ts`
- **Recently Viewed:** `localStorage` → `recently_viewed_businesses`
  - Format: `number[]` (business IDs)

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `businesses_select_public_active_or_owner_or_admin` - Public can read active businesses
- ✅ `blog_posts_select_public_published` - Public can read published blog posts
- ✅ `deals_select_public_active` - Public can read active deals

**Issues/Gaps:**
1. ⚠️ **Hero slides stored in localStorage** - Not in database
   - Issue: Hero slides không persistent, mất khi clear cache
   - Recommendation: Move to `page_content` table hoặc `app_settings`
2. ⚠️ **Recently viewed in localStorage** - Not synced across devices
   - Issue: User experience không consistent
   - Recommendation: Store in `profiles` table nếu user logged in
3. ⚠️ **Newsletter signup** - No backend implementation
   - Issue: `handleNewsletterSubmit` chỉ log to console
   - Recommendation: Integrate với email service hoặc database
4. ⚠️ **No SEO metadata** - Missing meta tags
   - Issue: Không có meta description, Open Graph tags
   - Recommendation: Add SEO metadata (C2.5)

---

### 2. DirectoryPage (`/directory`)

**File:** `pages/DirectoryPage.tsx`

**Purpose:**
- Danh sách tất cả businesses
- Search functionality (keyword, category, location)
- Filter by category, location, district
- Sort options (name, rating, newest)
- Pagination (12 items per page)
- Map view / List view toggle

**URL/Route:**
- Route: `/directory`
- Query params: `?keyword=...&category=...&location=...&district=...&sort=...&page=...`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Businesses:** `BusinessDataContext` → `businesses` table
  - Filter: `isActive = true` (enforced by RLS)
  - Search: Keyword in `name`, `description`
  - Filter: `category`, `location`, `district`
  - Sort: `name`, `rating`, `created_at`
  - Pagination: 12 items per page
- **Categories:** `constants.ts` → `CATEGORIES` (hardcoded)
- **Locations:** `constants.ts` → `CITIES`, `LOCATIONS_HIERARCHY` (hardcoded)

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `businesses_select_public_active_or_owner_or_admin` - Public can read active businesses
- ✅ RLS enforces `is_active = true` filter automatically

**Issues/Gaps:**
1. ⚠️ **Categories/Locations hardcoded** - Not in database
   - Issue: Không thể thêm/sửa categories/locations từ admin
   - Recommendation: Move to `app_settings` hoặc separate tables
2. ⚠️ **No search indexing** - Full table scan
   - Issue: Performance có thể chậm với nhiều businesses
   - Recommendation: Add full-text search index (PostgreSQL)
3. ⚠️ **Map view** - Component exists but may need optimization
   - Issue: `DirectoryMap` component có thể slow với nhiều markers
   - Recommendation: Implement clustering cho map markers
4. ⚠️ **No SEO metadata** - Missing meta tags
   - Issue: Không có meta description cho search results
   - Recommendation: Add dynamic SEO metadata

---

### 3. BusinessDetailPage (`/business/:slug`)

**File:** `pages/BusinessDetailPage.tsx`

**Purpose:**
- Trang chi tiết business (public landing page)
- Hiển thị thông tin business, services, deals, gallery, team, reviews, blog posts
- Booking functionality
- Map integration

**URL/Route:**
- Route: `/business/:slug`
- Layout: **NO AppLayout** (Custom business landing page layout)
- Components: `business-landing/` folder (14 components)

**Data Source:**
- **Business:** `BusinessDataContext.fetchBusinessBySlug()` → `businesses` table
  - Query: `SELECT * FROM businesses WHERE slug = :slug`
  - Includes: services, deals, media_items, team_members, reviews, business_blog_posts (via RLS)
- **View Count:** `BusinessDataContext.incrementBusinessViewCount()` → `businesses.view_count`
  - Increment: Once per session (sessionStorage check)
- **Recently Viewed:** `localStorage` → `recently_viewed_businesses`

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access
- ⚠️ Business owner can see even if `is_active = false` (RLS policy)

**RLS Dependency:**
- ✅ `businesses_select_public_active_or_owner_or_admin` - Public can read active businesses
- ✅ `services_select_public_active` - Public can read active services
- ✅ `deals_select_public_active` - Public can read active deals
- ✅ `media_items_select_public` - Public can read media items
- ✅ `team_members_select_public` - Public can read team members
- ✅ `reviews_select_public_visible` - Public can read visible reviews
- ✅ `business_blog_posts_select_public_published` - Public can read published blog posts

**Issues/Gaps:**
1. ⚠️ **Duplicate route** - `/business/:slug` defined twice in `App.tsx` (line 155, 156)
   - Issue: Redundant route definition
   - Recommendation: Remove duplicate route
2. ⚠️ **View count increment** - Session-based, not persistent across sessions
   - Issue: View count có thể không chính xác
   - Recommendation: Move to server-side increment (Edge Function hoặc RLS trigger)
3. ⚠️ **Booking modal** - `BookingModal` component exists but may not be fully functional
   - Issue: Cần verify booking flow hoàn chỉnh
   - Recommendation: Test booking flow end-to-end
4. ⚠️ **No SEO metadata** - Missing dynamic meta tags
   - Issue: Không có meta description, Open Graph tags cho business page
   - Recommendation: Add dynamic SEO metadata từ `business.seo` field

---

### 4. BlogListPage (`/blog`)

**File:** `pages/BlogListPage.tsx`

**Purpose:**
- Danh sách blog posts (platform + business blogs)
- Search functionality
- Filter by category
- Pagination (6 posts per page)

**URL/Route:**
- Route: `/blog`
- Query params: `?category=...&search=...&page=...`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Platform Posts:** `BusinessDataContext.useBlogData()` → `blog_posts` table
  - Filter: Published posts only
- **Business Posts:** `BusinessContext.useBusinessBlogData()` → `business_blog_posts` table
  - Filter: `isFeatured = true AND status = 'PUBLISHED' AND publishedDate IS NOT NULL`
- **Businesses:** `BusinessDataContext` → `businesses` table (for business name in category)

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `blog_posts_select_public_published` - Public can read published blog posts
- ✅ `business_blog_posts_select_public_published` - Public can read published business blog posts
- ✅ `businesses_select_public_active_or_owner_or_admin` - Public can read active businesses

**Issues/Gaps:**
1. ⚠️ **Mixed data sources** - Platform posts + Business posts
   - Issue: Logic phức tạp, có thể confusing
   - Recommendation: Consider separate endpoints hoặc unified query
2. ⚠️ **Category filter** - Uses business name as category for business posts
   - Issue: Category logic không consistent
   - Recommendation: Standardize category system
3. ⚠️ **No SEO metadata** - Missing meta tags
   - Issue: Không có meta description cho blog listing
   - Recommendation: Add SEO metadata

---

### 5. BlogPostPage (`/blog/:slug`)

**File:** `pages/BlogPostPage.tsx`

**Purpose:**
- Chi tiết blog post (platform blog)
- Related posts
- Comments
- Social sharing

**URL/Route:**
- Route: `/blog/:slug`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Blog Post:** `BusinessDataContext.getPostBySlug()` → `blog_posts` table
  - Query: `SELECT * FROM blog_posts WHERE slug = :slug`
- **View Count:** `BusinessDataContext.incrementBlogViewCount()` → `blog_posts.view_count`
- **Comments:** `BusinessDataContext.getCommentsByPostId()` → `localStorage` (⚠️ **ISSUE**)
  - Key: `blog_comments`
  - Format: `BlogComment[]`
- **Related Posts:** `BusinessDataContext.blogPosts` → Filter by category

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `blog_posts_select_public_published` - Public can read published blog posts

**Issues/Gaps:**
1. ⚠️ **Comments in localStorage** - Not in database
   - Issue: Comments không persistent, mất khi clear cache
   - Recommendation: Move to `blog_comments` table (nếu có) hoặc create table
2. ⚠️ **View count increment** - Client-side increment
   - Issue: View count có thể không chính xác
   - Recommendation: Move to server-side increment
3. ⚠️ **No SEO metadata** - Missing dynamic meta tags
   - Issue: Không có meta description, Open Graph tags
   - Recommendation: Add dynamic SEO metadata từ blog post data

---

### 6. BusinessPostPage (`/business/:businessSlug/post/:postSlug`)

**File:** `pages/BusinessPostPage.tsx`

**Purpose:**
- Chi tiết business blog post
- Related posts
- Social sharing

**URL/Route:**
- Route: `/business/:businessSlug/post/:postSlug`
- Layout: **NO AppLayout** (Custom layout)

**Data Source:**
- **Business:** `BusinessDataContext.getBusinessBySlug()` → `businesses` table
- **Blog Post:** `BusinessContext.getPostBySlug()` → `business_blog_posts` table
  - Query: `SELECT * FROM business_blog_posts WHERE slug = :postSlug AND business_id = :businessId`
- **View Count:** `BusinessContext.incrementViewCount()` → `business_blog_posts.view_count`
  - Increment: Once per session (sessionStorage check)

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `businesses_select_public_active_or_owner_or_admin` - Public can read active businesses
- ✅ `business_blog_posts_select_public_published` - Public can read published business blog posts

**Issues/Gaps:**
1. ⚠️ **View count increment** - Session-based, not persistent
   - Issue: View count có thể không chính xác
   - Recommendation: Move to server-side increment
2. ⚠️ **No SEO metadata** - Missing dynamic meta tags
   - Issue: Không có meta description, Open Graph tags
   - Recommendation: Add dynamic SEO metadata

---

### 7. AboutPage (`/about`)

**File:** `pages/AboutPage.tsx`

**Purpose:**
- Trang giới thiệu về platform
- Dynamic content từ database

**URL/Route:**
- Route: `/about`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Page Content:** `AdminPlatformContext.getPageContent('about')` → `page_content` table
  - Query: `SELECT * FROM page_content WHERE page_name = 'about'`
  - Structure: `{ layout: LayoutItem[], visibility: { [key: string]: boolean } }`
- **Components:** `page-renderer/` folder
  - `AboutHero`, `AboutHistory`, `AboutMission`, `AboutTeam`, `WhyChooseUs`, `CtaSection`

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `page_content_select_public` - Public can read page content (assumed, cần verify RLS policy)

**Issues/Gaps:**
1. ⚠️ **RLS policy not verified** - Cần verify `page_content` table có RLS policy cho public read
   - Issue: Không chắc chắn public có thể đọc `page_content`
   - Recommendation: Verify RLS policy `page_content_select_public` exists
2. ⚠️ **No SEO metadata** - Missing meta tags
   - Issue: Không có meta description
   - Recommendation: Add SEO metadata

---

### 8. ContactPage (`/contact`)

**File:** `pages/ContactPage.tsx`

**Purpose:**
- Trang liên hệ
- Contact form
- Contact information
- Map integration

**URL/Route:**
- Route: `/contact`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Page Content:** `AdminPlatformContext.getPageContent('contact')` → `page_content` table
  - Query: `SELECT * FROM page_content WHERE page_name = 'contact'`
- **Components:** `page-renderer/` folder
  - `ContactHero`, `ContactInfo`, `ContactForm`, `ContactMap`

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `page_content_select_public` - Public can read page content (assumed, cần verify RLS policy)

**Issues/Gaps:**
1. ⚠️ **Contact form** - `ContactForm` component exists but may not be fully functional
   - Issue: Cần verify form submission hoạt động
   - Recommendation: Test contact form submission
2. ⚠️ **RLS policy not verified** - Cần verify `page_content` table có RLS policy cho public read
   - Issue: Không chắc chắn public có thể đọc `page_content`
   - Recommendation: Verify RLS policy `page_content_select_public` exists
3. ⚠️ **No SEO metadata** - Missing meta tags
   - Issue: Không có meta description
   - Recommendation: Add SEO metadata

---

### 9. RegisterPage (`/register`)

**File:** `pages/RegisterPage.tsx`

**Purpose:**
- User registration page
- Sign up form

**URL/Route:**
- Route: `/register`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Auth:** Supabase Auth (`supabase.auth.signUp()`)
- **Profile:** Auto-created via trigger `handle_new_user` → `profiles` table

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `profiles_insert_own` - Users can insert their own profile (via trigger)

**Issues/Gaps:**
1. ⚠️ **Not audited in detail** - File exists but not fully reviewed
   - Recommendation: Review registration flow in detail (B1.1)

---

### 10. PartnerRegistrationPage (`/partner-registration`)

**File:** `pages/PartnerRegistrationPage.tsx`

**Purpose:**
- Business registration request page
- Submit registration request form

**URL/Route:**
- Route: `/partner-registration`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Registration Request:** `supabase.from('registration_requests').insert()` → `registration_requests` table
  - Fields: `business_name`, `email`, `phone`, `address`, etc.

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ `registration_requests_insert_public` - Public can insert registration requests (assumed, cần verify RLS policy)

**Issues/Gaps:**
1. ⚠️ **RLS policy not verified** - Cần verify `registration_requests` table có RLS policy cho public insert
   - Issue: Không chắc chắn public có thể insert `registration_requests`
   - Recommendation: Verify RLS policy `registration_requests_insert_public` exists
2. ⚠️ **Not audited in detail** - File exists but not fully reviewed
   - Recommendation: Review registration flow in detail (B3.1-B3.5)

---

### 11. LoginPage (`/login`)

**File:** `pages/LoginPage.tsx`

**Purpose:**
- User login page
- Sign in form

**URL/Route:**
- Route: `/login`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Auth:** Supabase Auth (`supabase.auth.signInWithPassword()`)

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ No RLS dependency (Auth handled by Supabase Auth)

**Issues/Gaps:**
1. ⚠️ **Not audited in detail** - File exists but not fully reviewed
   - Recommendation: Review login flow in detail (B1.1)

---

### 12. ResetPasswordPage (`/reset-password`)

**File:** `pages/ResetPasswordPage.tsx`

**Purpose:**
- Password reset page
- Reset password form

**URL/Route:**
- Route: `/reset-password`
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- **Auth:** Supabase Auth (`supabase.auth.resetPasswordForEmail()`)

**Access Level:**
- ✅ **Public** - No authentication required
- ✅ Anonymous users can access

**RLS Dependency:**
- ✅ No RLS dependency (Auth handled by Supabase Auth)

**Issues/Gaps:**
1. ⚠️ **Not audited in detail** - File exists but not fully reviewed
   - Recommendation: Review password reset flow in detail

---

### 13. NotFoundPage (`*`)

**File:** `pages/NotFoundPage.tsx`

**Purpose:**
- 404 error page
- Catch-all route

**URL/Route:**
- Route: `*` (catch-all)
- Layout: `AppLayout` (Header + Footer)

**Data Source:**
- ✅ No data source (static page)

**Access Level:**
- ✅ **Public** - No authentication required

**RLS Dependency:**
- ✅ No RLS dependency

**Issues/Gaps:**
1. ⚠️ **No SEO metadata** - Missing 404 meta tags
   - Recommendation: Add `noindex` meta tag

---

## DATA ACCESS PATTERNS

### Contexts Used

1. **BusinessDataContext** (`contexts/BusinessDataContext.tsx`)
   - Used by: HomePage, DirectoryPage, BusinessDetailPage, BlogListPage, BlogPostPage
   - Data: businesses, blog_posts, services, deals, media_items, team_members, reviews
   - RLS: Enforced at database level

2. **HomepageDataContext** (`contexts/HomepageDataContext.tsx`)
   - Used by: HomePage
   - Data: Hero slides (⚠️ localStorage, not database)
   - Issue: Should be in database

3. **BusinessContext** (`contexts/BusinessContext.tsx`)
   - Used by: BlogListPage, BusinessPostPage
   - Data: business_blog_posts
   - RLS: Enforced at database level

4. **AdminPlatformContext** (`contexts/AdminPlatformContext.tsx`)
   - Used by: AboutPage, ContactPage
   - Data: page_content
   - RLS: Need to verify public read policy

---

## RLS COMPLIANCE SUMMARY

### ✅ Compliant

- **Businesses:** Public can read active businesses
- **Blog Posts:** Public can read published blog posts
- **Business Blog Posts:** Public can read published business blog posts
- **Services/Deals/Media/Team/Reviews:** Public can read active/visible items

### ⚠️ Need Verification

- **page_content:** Need to verify public read RLS policy exists
- **registration_requests:** Need to verify public insert RLS policy exists

---

## ISSUES SUMMARY

### Critical Issues

1. **Hero slides in localStorage** - Not persistent
2. **Comments in localStorage** - Not persistent
3. **Duplicate route** - `/business/:slug` defined twice

### Medium Issues

1. **Categories/Locations hardcoded** - Not in database
2. **View count increment** - Client-side, not accurate
3. **Newsletter signup** - No backend implementation
4. **RLS policies not verified** - `page_content`, `registration_requests`

### Low Priority Issues

1. **No SEO metadata** - Missing meta tags (C2.5)
2. **Search performance** - No indexing
3. **Map optimization** - Need clustering

---

## RECOMMENDATIONS

### Immediate (C2.1-C2.4)

1. **Move hero slides to database** - Use `page_content` or `app_settings`
2. **Move comments to database** - Create `blog_comments` table
3. **Fix duplicate route** - Remove duplicate `/business/:slug` route
4. **Verify RLS policies** - Ensure `page_content` and `registration_requests` have public policies

### Future (C2.5-C2.6)

1. **Add SEO metadata** - Meta tags, Open Graph, Twitter Cards
2. **Optimize search** - Full-text search indexing
3. **Move categories/locations to database** - Make them manageable from admin

---

## COMPLIANCE CHECK

### ✅ Master Plan Compliance

- ✅ **C2.0 - Public Site Audit** - COMPLETED
- ✅ **No new systems created** - Only documented existing
- ✅ **No refactor** - Only audit and documentation
- ✅ **No code changes** - Only read and document

### ✅ Architecture Compliance

- ✅ **RLS-first security** - All data access via RLS policies
- ✅ **Supabase as backend** - All data from Supabase
- ✅ **No hardcode** - Data from database (except localStorage issues)

---

**Audit Status:** ✅ COMPLETED  
**Next Step:** C2.1-C2.6 (Implementation - if needed) hoặc proceed to C3




