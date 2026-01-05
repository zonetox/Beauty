# Authentication & Role Flows - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## OVERVIEW

This document defines all authentication and role resolution flows for the 1Beauty.asia platform. All flows comply with ARCHITECTURE.md principles:
- RLS-first security
- No hardcode roles
- Single Source of Truth
- Database-based role checking

---

## B1.1 - USER REGISTRATION FLOW

### Flow Description

Regular user registration for browsing and interacting with the platform (reviews, favorites, appointments).

### Flow Steps

```
1. User submits registration form (/register)
   └─> Input: email, password, full_name (optional)
   
2. Frontend calls: supabase.auth.signUp({ email, password, options: { data: { full_name } } })
   └─> Supabase Auth creates user in auth.users table
   
3. Database Trigger: on_auth_user_created
   └─> Executes: public.handle_new_user() function
   └─> Creates row in public.profiles table:
       - id = auth.users.id
       - full_name = raw_user_meta_data->>'full_name'
       - avatar_url = raw_user_meta_data->>'avatar_url'
       - email = auth.users.email
       - business_id = NULL (not a business owner yet)
   
4. User receives confirmation email
   └─> User clicks confirmation link
   └─> Email confirmed
   
5. User logs in
   └─> Session created
   └─> Frontend fetches profile from public.profiles (RLS: users can read own profile)
   
6. Default Role: "user"
   └─> Determined at runtime:
       - Has auth.uid() ✅
       - Has profile in public.profiles ✅
       - businesses.owner_id != auth.uid() (no business ownership)
       - Email NOT in admin_users table (not admin)
```

### Database Operations

**Table: auth.users**
- Created by: Supabase Auth
- Action: INSERT (via signUp)

**Table: public.profiles**
- Created by: Database trigger `handle_new_user()`
- Action: INSERT (automatic via trigger)
- RLS: Trigger uses SECURITY DEFINER (bypasses RLS)
- Default values:
  - `business_id` = NULL
  - `favorites` = NULL (empty array)

### Role Assignment

**Runtime Role Resolution:**
- Source of Truth: Database queries (no hardcode)
- Checks:
  1. `auth.uid()` exists? → Yes = Authenticated
  2. Profile exists in `public.profiles`? → Yes = User
  3. `businesses.owner_id = auth.uid()`? → No = Regular User
  4. `admin_users.email = auth.users.email AND is_locked = FALSE`? → No = Not Admin

**Result:** `role = "user"`

### RLS Access After Signup

After registration, user can:
- ✅ Read own profile (RLS: `profiles_select_own_or_admin`)
- ✅ Update own profile (RLS: `profiles_update_own_or_admin`)
- ✅ Read active businesses (RLS: `businesses_select_public_active_or_owner_or_admin`)
- ✅ Create reviews (RLS: `reviews_insert_authenticated_or_admin`)
- ✅ Create appointments (RLS: `appointments_insert_public_or_admin`)
- ❌ Cannot access business owner features
- ❌ Cannot access admin features

---

## B1.2 - BUSINESS REGISTRATION FLOW

### Flow Description

Business partner registration requiring admin approval before access.

### Flow Steps

```
1. User submits business registration form (/partner-registration)
   └─> Input: business_name, email, phone, category, address, tier
   
2. Frontend inserts into public.registration_requests
   └─> Action: INSERT into registration_requests table
   └─> Status: 'Pending'
   └─> RLS: Public can insert (registration_requests_insert_public)
   
3. Admin views registration requests (Admin Panel)
   └─> RLS: Only admins can read (registration_requests_select_admin)
   └─> Admin sees pending requests
   
4. Admin approves request
   └─> Frontend calls: supabase.functions.invoke('approve-registration', { requestId })
   └─> Edge Function executes (with service role key - elevated privileges)
   
5. Edge Function: approve-registration
   └─> Step 1: Fetch registration_request (bypass RLS with service role)
   └─> Step 2: Create business record in public.businesses
       - Sets default values (is_active=true, is_verified=false, etc.)
       - Does NOT set owner_id yet (will be set after user creation)
   └─> Step 3: Invite user via Supabase Auth Admin API
       - supabaseAdmin.auth.admin.inviteUserByEmail(request.email)
       - Creates user in auth.users (without password set)
       - Returns user ID and invitation link
   └─> Step 4: Update business.owner_id = new user ID
       - Links business to the new user
       - Establishes ownership relationship (required for RLS policies)
   └─> Step 5: Create profile in public.profiles
       - id = new user ID
       - business_id = new business ID
       - Links profile to business
   └─> Step 6: Send invitation email (via send-templated-email Edge Function)
       - Template: 'invite'
       - Contains: invitation link (user sets password)
   └─> Step 7: Update registration_request.status = 'Approved'
   
6. User receives invitation email
   └─> User clicks invitation link
   └─> User sets password
   └─> User is logged in (first login)
   
7. User logs in for first time
   └─> Session created
   └─> Frontend fetches profile (RLS: users can read own profile)
   └─> Profile has business_id set
   
8. Role Resolution: "business_owner"
   └─> Determined at runtime:
       - Has auth.uid() ✅
       - Has profile with business_id ✅
       - businesses.owner_id = auth.uid() ✅ (business ownership verified)
       - Email NOT in admin_users (not admin)
   
9. User redirected to Business Dashboard
   └─> Can manage business data
   └─> RLS: business owners can CRUD their business data
```

### Database Operations

**Table: public.registration_requests**
- Created by: Frontend (public can insert)
- Action: INSERT
- RLS: `registration_requests_insert_public`

**Table: public.businesses**
- Created by: Edge Function `approve-registration` (service role)
- Action: INSERT
- RLS: Bypassed (Edge Function uses service role key)
- Important: `owner_id` is set after user creation

**Table: auth.users**
- Created by: Edge Function via `supabaseAdmin.auth.admin.inviteUserByEmail()`
- Action: INSERT (bypasses normal signup flow)
- No confirmation email (user sets password via invitation link)

**Table: public.profiles**
- Created by: Edge Function `approve-registration`
- Action: INSERT (service role - bypasses RLS)
- Sets:
  - `id` = new user ID
  - `business_id` = new business ID
  - `full_name` = business_name
  - `email` = request email

### Edge Function Details

**Function:** `supabase/functions/approve-registration/index.ts`

**Privileges:** Service role key (elevated privileges)

**Operations:**
1. ✅ Read registration_requests (bypasses RLS)
2. ✅ Create business (bypasses RLS)
3. ✅ Invite user (Supabase Auth Admin API)
4. ✅ Update business.owner_id (bypasses RLS)
5. ✅ Create profile (bypasses RLS)
6. ✅ Update registration_request (bypasses RLS)
7. ✅ Invoke send-templated-email Edge Function

**Error Handling:**
- Rollback on failure:
  - If user creation fails → Delete business
  - If profile creation fails → Delete business + Delete user
  - If email send fails → Delete business + Delete user

**Compliance:**
- ✅ Uses Edge Function only for operations requiring elevated privileges
- ✅ All operations require admin privilege (cannot be done via RLS)
- ✅ No hardcode logic (all data from database)

### Role Assignment

**Runtime Role Resolution:**
- Source of Truth: Database queries (no hardcode)
- Checks:
  1. `auth.uid()` exists? → Yes = Authenticated
  2. Profile exists in `public.profiles`? → Yes = User
  3. `businesses.owner_id = auth.uid()`? → Yes = Business Owner ✅
  4. `admin_users.email = auth.users.email AND is_locked = FALSE`? → No = Not Admin

**Result:** `role = "business_owner"`

### RLS Access After Approval

After approval and first login, business owner can:
- ✅ Read own profile (RLS: `profiles_select_own_or_admin`)
- ✅ Update own profile (RLS: `profiles_update_own_or_admin`)
- ✅ Read own business (even if inactive) (RLS: `businesses_select_public_active_or_owner_or_admin`)
- ✅ Update own business (RLS: `businesses_update_owner_or_admin`)
- ✅ CRUD services for own business (RLS: `services_*_owner_or_admin`)
- ✅ CRUD deals for own business (RLS: `deals_*_owner_or_admin`)
- ✅ CRUD media items for own business (RLS: `media_items_*_owner_or_admin`)
- ✅ CRUD business blog posts (RLS: `business_blog_posts_*_owner_or_admin`)
- ✅ Update reviews (add replies) (RLS: `reviews_update_own_or_owner_or_admin`)
- ✅ CRUD appointments for own business (RLS: `appointments_*_owner_or_admin`)
- ✅ CRUD support tickets for own business (RLS: `support_tickets_*_owner_or_admin`)
- ❌ Cannot access other businesses' data
- ❌ Cannot access admin features

---

## B1.3 - ROLE RESOLUTION

### Role Determination Logic

Roles are determined at **runtime** via database queries. No role is cached in frontend.

### Role Types

1. **Anonymous**
   - Condition: `auth.uid() IS NULL`
   - Source of Truth: Supabase Auth session
   - No database query needed

2. **User (Authenticated)**
   - Condition:
     - `auth.uid() IS NOT NULL` ✅
     - Profile exists in `public.profiles` ✅
     - `businesses.owner_id != auth.uid()` (no business ownership)
     - `admin_users.email != auth.users.email` (not admin)
   - Source of Truth: Database queries
   - Query: Check `profiles` table, check `businesses.owner_id`, check `admin_users`

3. **Business Owner**
   - Condition:
     - `auth.uid() IS NOT NULL` ✅
     - Profile exists in `public.profiles` ✅
     - `businesses.owner_id = auth.uid()` ✅ (at least one business)
     - `admin_users.email != auth.users.email` (not admin)
   - Source of Truth: Database query
   - Query: `SELECT 1 FROM businesses WHERE owner_id = auth.uid()`

4. **Admin**
   - Condition:
     - `auth.uid() IS NOT NULL` ✅
     - `admin_users.email = auth.users.email` ✅
     - `admin_users.is_locked = FALSE` ✅
   - Source of Truth: `admin_users` table
   - Query: `SELECT * FROM admin_users WHERE email = auth.users.email AND is_locked = FALSE`

### Role Resolution Implementation

**Frontend Implementation:**

```typescript
// Example: Determine if user is business owner
const checkIsBusinessOwner = async (userId: UUID): Promise<boolean> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .single();
  
  return !error && data !== null;
};

// Example: Determine if user is admin
const checkIsAdmin = async (userEmail: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', userEmail)
    .eq('is_locked', false)
    .limit(1)
    .single();
  
  return !error && data !== null;
};
```

**Backend (RLS Policies):**

RLS policies use helper functions:
- `public.is_admin(user_email)` - Checks `admin_users` table
- `public.is_business_owner(user_id, business_id)` - Checks `businesses.owner_id`

These functions are called at query time by RLS policies.

### Role Switching

Roles can change dynamically:

**User → Business Owner:**
- Trigger: Admin approves business registration
- Process: Edge Function sets `businesses.owner_id = auth.uid()`
- Effect: Next role resolution check returns "business_owner"
- Frontend: Must re-fetch role (no cache)

**Business Owner → Admin:**
- Trigger: Admin adds user to `admin_users` table
- Process: INSERT into `admin_users` with user's email
- Effect: Next role resolution check returns "admin"
- Frontend: Must re-fetch role (no cache)

**Admin → Locked:**
- Trigger: Admin sets `admin_users.is_locked = TRUE`
- Process: UPDATE `admin_users` table
- Effect: Next role resolution check returns "user" or "business_owner"
- Frontend: Must re-fetch role (no cache)

### No Role Caching

**Principle:** Roles are determined at runtime, not cached.

**Reasons:**
1. Roles can change (business approval, admin promotion, lock/unlock)
2. Single Source of Truth (database, not frontend state)
3. RLS policies enforce security (no reliance on frontend role checks)

**Implementation:**
- Frontend Contexts fetch role from database on mount
- Frontend Contexts re-fetch role on auth state change
- No localStorage or sessionStorage for roles
- No hardcode role checks

### Role Resolution Flow Diagram

```
┌─────────────────────────────────────────┐
│  User Authentication (Supabase Auth)    │
│  auth.uid() exists?                     │
└──────────────┬──────────────────────────┘
               │
               ├─ NO ────────────────────> Anonymous
               │
               └─ YES
                  │
                  ┌──────────────────────────────┐
                  │  Check admin_users table     │
                  │  email = auth.users.email    │
                  │  AND is_locked = FALSE       │
                  └──────────┬───────────────────┘
                             │
                             ├─ YES ────────────> Admin
                             │
                             └─ NO
                                │
                                ┌──────────────────────────────┐
                                │  Check businesses table      │
                                │  owner_id = auth.uid()       │
                                └──────────┬───────────────────┘
                                           │
                                           ├─ YES ──────────> Business Owner
                                           │
                                           └─ NO ──────────> User (Authenticated)
```

---

## COMPLIANCE WITH ARCHITECTURE.MD

### ✅ RLS-First Security

- All database operations go through RLS policies
- Edge Functions use service role key only for elevated privileges
- No RLS bypass at client level

### ✅ No Hardcode Roles

- All role checks via database queries
- No `if (user.email === 'admin@example.com')` logic
- Frontend fetches role from database

### ✅ Single Source of Truth

- **Authentication:** `auth.users` (Supabase Auth)
- **User Profile:** `public.profiles` table
- **Business Ownership:** `businesses.owner_id` column
- **Admin Status:** `admin_users` table
- **Permissions:** `admin_users.permissions` JSONB column

### ✅ Frontend / Backend Contract

- **Frontend:** Pure client (React)
- **Backend:** Supabase (Database + Edge Functions)
- **Edge Functions:** Only for operations requiring elevated privileges
  - `approve-registration`: Needs service role to create business + user + profile

---

## TESTING REQUIREMENTS

### User Registration Flow

1. ✅ User can register via `/register`
2. ✅ Profile is auto-created via trigger
3. ✅ User can login after email confirmation
4. ✅ User can read/update own profile (RLS verified)
5. ✅ User cannot access business owner features
6. ✅ User cannot access admin features

### Business Registration Flow

1. ✅ User can submit registration request
2. ✅ Admin can view registration requests
3. ✅ Admin can approve request (Edge Function called)
4. ✅ Business is created with correct data
5. ✅ User is invited via email
6. ✅ Profile is created with business_id link
7. ✅ Business.owner_id is set correctly
8. ✅ User can login via invitation link
9. ✅ Business owner role is resolved correctly
10. ✅ Business owner can access business dashboard (RLS verified)

### Role Resolution

1. ✅ Role is determined at runtime (no cache)
2. ✅ Role switching works (user → business_owner → admin)
3. ✅ Admin lock/unlock works (role reverted)
4. ✅ Multiple businesses ownership (business_owner role still valid)
5. ✅ RLS policies match role permissions

---

## NOTES

- Edge Function `approve-registration` must set `businesses.owner_id` after user creation
- Profile trigger `handle_new_user()` only runs for normal signups (not Edge Function invites)
- Role resolution happens at runtime (no caching)
- Frontend contexts must re-fetch role on auth state changes
- All role checks must query database (no hardcode)

---

**Auth & Role Flow Version:** 1.0  
**Status:** READY  
**Next:** B2 - Role & Permission Model (detailed permissions mapping)

