# RLS Policies Matrix - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## ROLE DEFINITIONS

### Anonymous
- No authentication (`auth.uid() IS NULL`)
- Public users browsing the site

### User (Authenticated)
- Has `auth.uid()` (logged in via Supabase Auth)
- Has profile in `profiles` table
- Not a business owner (`businesses.owner_id != auth.uid()`)
- Not an admin (email not in `admin_users` table)

### Business Owner
- Has `auth.uid()` (logged in)
- Owns a business (`businesses.owner_id = auth.uid()`)
- Can manage their own business data

### Admin
- Has `auth.uid()` (logged in)
- Email exists in `admin_users` table
- `is_locked = FALSE`
- Has elevated privileges for platform management

---

## RLS POLICIES MATRIX

### Table: profiles

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ❌ No     | ✅ Own only | ✅ Own only | ✅ All |
| INSERT    | ❌ No     | ✅ Own only | ✅ Own only | ✅ All |
| UPDATE    | ❌ No     | ✅ Own only | ✅ Own only | ✅ All |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ All |

**Notes:**
- Users can only access their own profile
- Admins have full access

---

### Table: businesses

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Active only | ✅ Active only | ✅ Own (any status) | ✅ All |
| INSERT    | ❌ No     | ❌ No | ❌ No | ✅ Yes (via Edge Function) |
| UPDATE    | ❌ No     | ❌ No | ✅ Own only | ✅ All |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ All |

**Notes:**
- Public can only see active businesses
- Business owners can see and update their own business (even if inactive)
- Only admins can create/delete businesses

---

### Table: services

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Active businesses | ✅ Active businesses | ✅ Own business | ✅ All |
| INSERT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |

**Notes:**
- Public/users can only see services of active businesses
- Business owners have full CRUD for their business services

---

### Table: deals

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Active businesses | ✅ Active businesses | ✅ Own business | ✅ All |
| INSERT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |

**Notes:**
- Same pattern as services

---

### Table: team_members

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Active businesses | ✅ Active businesses | ✅ Own business | ✅ All |
| INSERT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |

**Notes:**
- Same pattern as services/deals

---

### Table: media_items

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Active businesses | ✅ Active businesses | ✅ Own business | ✅ All |
| INSERT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |

**Notes:**
- Same pattern as services/deals/team_members

---

### Table: reviews

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Visible, active businesses | ✅ Visible, active + own | ✅ Own business + own reviews | ✅ All |
| INSERT    | ❌ No     | ✅ Yes (authenticated) | ✅ Yes | ✅ Yes |
| UPDATE    | ❌ No     | ✅ Own only | ✅ Own business (for replies) | ✅ All |
| DELETE    | ❌ No     | ✅ Own only | ❌ No | ✅ All |

**Notes:**
- Public can only see visible reviews of active businesses
- Users can create reviews and update/delete their own
- Business owners can update reviews of their business (to add replies)
- Business owners cannot delete reviews (only hide via status)

---

### Table: blog_posts (Platform blog)

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ All    | ✅ All | ✅ All | ✅ All |
| INSERT    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |

**Notes:**
- Platform blog is public read, admin-only write

---

### Table: business_blog_posts

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ Published, active businesses | ✅ Published, active | ✅ Own (including drafts) | ✅ All |
| INSERT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |

**Notes:**
- Public can only see published posts of active businesses
- Business owners can see all their posts (including drafts)
- Business owners have full CRUD for their blog posts

---

### Table: admin_users

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ❌ No     | ❌ No (unless admin) | ❌ No (unless admin) | ✅ All + Own |
| INSERT    | ❌ No     | ❌ No | ❌ No | ✅ Yes (via Edge Function) |
| UPDATE    | ❌ No     | ❌ No | ❌ No | ✅ All |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ All |

**Notes:**
- Only admins can access admin_users table
- Admins can read their own record (for profile)
- Admin creation is via Edge Function (service role)

---

### Table: registration_requests

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ❌ No     | ❌ No | ❌ No | ✅ All |
| INSERT    | ✅ Yes    | ✅ Yes | ✅ Yes | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ❌ No | ✅ All |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ All |

**Notes:**
- Anyone can submit registration requests
- Only admins can view/update/delete requests

---

### Table: orders

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| INSERT    | ✅ Yes    | ✅ Yes | ✅ Yes | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ All |

**Notes:**
- Public can create orders (for membership packages)
- Business owners can view/update orders for their business
- Only admins can delete orders

---

### Table: appointments

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| INSERT    | ✅ Yes    | ✅ Yes | ✅ Yes | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |

**Notes:**
- Public can create appointments
- Business owners can view/update/delete appointments for their business
- Customers cannot read appointments (no business_id to check ownership)

---

### Table: support_tickets

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| INSERT    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| UPDATE    | ❌ No     | ❌ No | ✅ Own business | ✅ All |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ All |

**Notes:**
- Only business owners (for their business) and admins can access support tickets

---

### Table: announcements

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ All    | ✅ All | ✅ All | ✅ All |
| INSERT    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |

**Notes:**
- Public read, admin-only write

---

### Table: app_settings

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ All    | ✅ All | ✅ All | ✅ All |
| INSERT    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |

**Notes:**
- Public read (for public configuration), admin-only write

---

### Table: page_content

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT    | ✅ All    | ✅ All | ✅ All | ✅ All |
| INSERT    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| UPDATE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |
| DELETE    | ❌ No     | ❌ No | ❌ No | ✅ Yes |

**Notes:**
- Public read, admin-only write

---

## SECURITY VERIFICATION CASES

### Positive Cases (Should Work)

1. ✅ Anonymous user can read active businesses
2. ✅ Anonymous user can read services/deals/media of active businesses
3. ✅ Anonymous user can read visible reviews of active businesses
4. ✅ Anonymous user can read published blog posts
5. ✅ Authenticated user can create reviews
6. ✅ Authenticated user can create appointments
7. ✅ Business owner can read/update their own business (even if inactive)
8. ✅ Business owner can CRUD services/deals/media for their business
9. ✅ Business owner can update reviews of their business (for replies)
10. ✅ Admin can read/write all data

### Negative Cases (Should NOT Work)

1. ❌ Anonymous user cannot update any data
2. ❌ User cannot update businesses they don't own
3. ❌ User cannot update services/deals/media of businesses they don't own
4. ❌ Business owner cannot update businesses they don't own
5. ❌ Business owner cannot access admin_users table
6. ❌ Business owner cannot access registration_requests (except create)
7. ❌ User cannot delete reviews they didn't create (unless admin)
8. ❌ User cannot read appointments (no business_id to check)
9. ❌ Non-admin cannot create/update/delete blog_posts
10. ❌ Non-admin cannot access system tables (app_settings, page_content, announcements) for write

---

## HELPER FUNCTIONS

### `public.is_admin(user_email TEXT)`
- Checks if email exists in `admin_users` table and `is_locked = FALSE`
- Used in all admin-related policies
- SECURITY DEFINER to access admin_users table

### `public.is_business_owner(user_id UUID, business_id_param BIGINT)`
- Checks if `businesses.owner_id = user_id` for given business_id
- Used in business owner policies
- SECURITY DEFINER to access businesses table

### `public.get_user_email()`
- Returns email from `auth.users` for current `auth.uid()`
- Used to get email for admin checks
- SECURITY DEFINER to access auth.users

---

## NOTES

- All policies use SECURITY DEFINER functions for role checking (no hardcode)
- Policies are testable (clear conditions)
- No `auth.uid() IS NOT NULL` for sensitive data (specific checks instead)
- RLS is enabled on all tables
- Edge Functions can bypass RLS using service role key (only for privileged operations)

---

**RLS Policies Version:** 1.0  
**Status:** READY  
**Next:** A3.3 - Security Verification (Testing)





