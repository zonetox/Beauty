# NAVIGATION & HEADER STABILIZATION REPORT

**Date:** 2025-01-18  
**Status:** ✅ COMPLETED  
**Goal:** Simplify and stabilize navigation logic based on actual user operational state

---

## EXECUTIVE SUMMARY

Navigation and header behavior have been refactored to depend solely on resolved user role (from database), not URL or page state. Each user type now has clear, predictable entry paths, and header actions reflect actual operational state.

---

## 1. CURRENT NAVIGATION PROBLEMS IDENTIFIED

### 1.1 Header Logic Issues

**Problems:**
- Header used `useUserSession()` (old context) instead of `useAuth()`
- Business owner check: `profile?.businessId` - didn't account for `business_staff`
- Admin check: Used `AdminContext` which may not be available on all pages
- "Register Business" link shown for all non-owners, even if they're staff
- No role resolution - relied on simple boolean checks

**Impact:**
- Inconsistent UI state
- Staff members saw "Register Business" even though they already have access
- Admin link might not show on some pages

---

### 1.2 Navigation Redirect Issues

**Problems:**
- `AuthRedirectHandler` only checked `profile?.businessId`
- Didn't account for `business_staff` role
- Business staff visiting homepage weren't redirected to dashboard

**Impact:**
- Business staff had to manually navigate to `/account`
- Inconsistent user experience

---

### 1.3 Form Access Issues

**Problems:**
- `RegisterPage` didn't check if user already has business access
- Could render form even if user is business owner/staff/admin
- No access check before UI render

**Impact:**
- Users could see forms they shouldn't use
- Confusing UX

---

## 2. CHANGES MADE

### 2.1 Created `useUserRole` Hook

**File:** `hooks/useUserRole.ts`

**Purpose:**
- Centralized role resolution using `resolveUserRole()`
- Provides consistent role state across all components
- Returns: `role`, `isAdmin`, `isBusinessOwner`, `isBusinessStaff`, `businessId`, `isLoading`, `error`

**Benefits:**
- Single source of truth for user role
- Components don't need to call `resolveUserRole()` directly
- Handles loading states automatically

---

### 2.2 Refactored Header Component

**File:** `components/Header.tsx`

**Changes:**
1. **Replaced context:**
   - `useUserSession()` → `useAuth()`
   - Removed `AdminContext` dependency
   - Uses `useUserRole()` hook

2. **Role-based rendering:**
   - Admin link: Shows only if `isAdmin = true` (from role resolution)
   - Account link: Shows "Dashboard Doanh nghiệp" if `hasBusinessAccess` (owner OR staff)
   - Register Business link: Shows only if `role === 'user'` AND `!hasBusinessAccess`

3. **Business access logic:**
   - `hasBusinessAccess = isBusinessOwner || isBusinessStaff`
   - Staff see "Dashboard Doanh nghiệp (Staff)" label

**Result:**
- Header state depends ONLY on:
  - Authentication state (`user` from `useAuth()`)
  - Resolved role (`useUserRole()`)
- No URL dependencies
- No page name dependencies

---

### 2.3 Updated AuthRedirectHandler

**File:** `components/AuthRedirectHandler.tsx`

**Changes:**
1. **Replaced context:**
   - `useUserSession()` → `useAuth()`
   - Uses `useUserRole()` hook

2. **Redirect logic:**
   - Redirects if `isBusinessOwner || isBusinessStaff`
   - Accounts for both owner and staff roles
   - Prevents redirect loop (checks current path)

**Result:**
- Business owners AND staff are redirected to `/account` from homepage
- Regular users and admins stay on homepage

---

### 2.4 Added Access Checks to RegisterPage

**File:** `pages/RegisterPage.tsx`

**Changes:**
1. **Added role check:**
   - Uses `useUserRole()` hook
   - Checks if user already has business access

2. **Blocks access:**
   - Shows loading state while checking
   - Redirects to `/account` if user already has business access
   - Prevents form render if user is owner/staff/admin

**Result:**
- Form only renders for eligible users (regular users without business access)
- Access blocked BEFORE UI render

---

## 3. FINAL NAVIGATION STRUCTURE

### 3.1 Page-to-Role Mapping

| Page | Roles Allowed | Purpose |
|------|---------------|---------|
| `/` (Homepage) | All (anonymous, user, business_owner, business_staff, admin) | Public homepage |
| `/directory` | All | Business directory |
| `/blog` | All | Platform blog |
| `/about` | All | About page |
| `/contact` | All | Contact page |
| `/login` | Anonymous only | Login page |
| `/register` | Anonymous, user (without business access) | Registration page |
| `/account` | Authenticated (user, business_owner, business_staff, admin) | Account page / Business dashboard |
| `/admin` | Admin only | Admin panel |
| `/admin/login` | Anonymous, non-admin | Admin login |

---

### 3.2 Entry Paths by Role

**Anonymous:**
- Entry: Homepage (`/`)
- Can access: Public pages, login, register
- Cannot access: Account, admin

**Regular User:**
- Entry: Homepage (`/`)
- Can access: Public pages, account page
- Can register business: Yes (via `/register`)
- Cannot access: Admin panel

**Business Owner:**
- Entry: Business dashboard (`/account`) - auto-redirected from homepage
- Can access: Public pages, business dashboard
- Cannot access: Admin panel (unless also admin)

**Business Staff:**
- Entry: Business dashboard (`/account`) - auto-redirected from homepage
- Can access: Public pages, business dashboard (limited permissions)
- Cannot access: Admin panel, full business management

**Admin:**
- Entry: Admin panel (`/admin`) OR homepage (`/`)
- Can access: All pages (including admin panel)
- Can also access: Business dashboard (if also business owner)

---

### 3.3 Header State Determination

**Header state depends ONLY on:**
1. **Authentication state:** `user` from `useAuth()`
2. **Resolved role:** `useUserRole()` hook

**Header does NOT depend on:**
- Current URL
- Page name
- Component state
- Other contexts

**Header Actions by Role:**

| Role | Admin Link | Account Link | Register Business Link |
|------|------------|--------------|------------------------|
| Anonymous | ❌ | ❌ | ❌ |
| User | ❌ | ✅ "Tài khoản của tôi" | ✅ |
| Business Owner | ❌ | ✅ "Dashboard Doanh nghiệp" | ❌ |
| Business Staff | ❌ | ✅ "Dashboard Doanh nghiệp (Staff)" | ❌ |
| Admin | ✅ | ✅ "Tài khoản của tôi" or "Dashboard Doanh nghiệp" | ❌ |

---

## 4. ACCESS CONTROL SUMMARY

### 4.1 Form Visibility

**RegisterPage (`/register`):**
- ✅ Shows for: Anonymous users, regular users (without business access)
- ❌ Blocks for: Business owners, business staff, admins
- Access check: BEFORE UI render

**PartnerRegistrationPage (`/partner-registration`):**
- ✅ Shows for: All (public form)
- Purpose: Submit registration request (admin approval required)

**Admin Panel (`/admin`):**
- ✅ Shows for: Admin users only
- Access check: `AdminProtectedRoute` component

---

### 4.2 Redirect Behavior

**Homepage (`/`):**
- Anonymous → Stays on homepage
- User → Stays on homepage
- Business Owner → Redirects to `/account`
- Business Staff → Redirects to `/account`
- Admin → Stays on homepage (can access admin via header link)

**Login (`/login`):**
- Already authenticated → Redirects based on role:
  - Business Owner/Staff → `/account`
  - Admin → `/admin`
  - User → Previous location or homepage

---

## 5. FILES MODIFIED

### New Files:
1. **`hooks/useUserRole.ts`**
   - New hook for role resolution
   - Provides consistent role state

### Modified Files:
2. **`components/Header.tsx`**
   - Refactored to use `useAuth()` and `useUserRole()`
   - Role-based rendering logic
   - Removed `AdminContext` dependency

3. **`components/AuthRedirectHandler.tsx`**
   - Updated to use `useAuth()` and `useUserRole()`
   - Accounts for business_staff role

4. **`pages/RegisterPage.tsx`**
   - Added access check using `useUserRole()`
   - Blocks access if user already has business access

---

## 6. VERIFICATION CHECKLIST

### ✅ Header Logic
- [x] Header uses `useAuth()` (not old context)
- [x] Header uses `useUserRole()` for role resolution
- [x] Admin link shows only for admins
- [x] Account link shows appropriate label based on role
- [x] Register Business link shows only for eligible users
- [x] Header state doesn't depend on URL

### ✅ Navigation Redirects
- [x] Business owners redirected to `/account` from homepage
- [x] Business staff redirected to `/account` from homepage
- [x] Regular users stay on homepage
- [x] Admins stay on homepage (can access admin via link)

### ✅ Form Access
- [x] RegisterPage blocks access for business owners/staff/admins
- [x] Access check happens BEFORE UI render
- [x] Loading state shown while checking access

### ✅ Role Resolution
- [x] All components use `useUserRole()` hook
- [x] Role resolution based on actual database state
- [x] No hardcoded role checks

---

## 7. SUMMARY

### Navigation Problems Solved:
1. ✅ Header now depends only on auth state and resolved role
2. ✅ Business staff properly redirected to dashboard
3. ✅ Register Business link only shows for eligible users
4. ✅ Forms blocked before render if user not eligible
5. ✅ Consistent role resolution across all components

### Key Improvements:
- **Single source of truth:** `useUserRole()` hook
- **Role-aware navigation:** All redirects based on resolved role
- **Access control:** Forms check eligibility before render
- **Consistent UX:** Header state matches actual user state

### Result:
Navigation is now **stable, predictable, and role-aware**. Each user type has a clear entry path, and header actions always reflect actual operational state.

---

**Report Generated:** 2025-01-18  
**Status:** ✅ COMPLETE
