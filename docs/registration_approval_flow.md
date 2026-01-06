# Registration & Approval Flow - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## OVERVIEW

Tài liệu này định nghĩa toàn bộ luồng đăng ký và duyệt (registration & approval) cho hệ thống 1Beauty.asia. Bao gồm các loại registration, state machine, authority mapping, Edge Functions responsibility, và failure handling.

**Nguyên tắc:**
- ✅ Tất cả registration flows có thể audit
- ✅ Có rollback mechanism khi fail
- ✅ State transitions được enforce bởi RLS và Edge Functions
- ✅ Authority mapping rõ ràng (ai được approve)
- ✅ Edge Functions chỉ dùng khi cần elevated privileges

---

## B3.1 - REGISTRATION TYPES

Hệ thống hỗ trợ **4 loại registration**:

### 1. User Registration (Regular User)

**Mục đích:** Người dùng thông thường đăng ký để sử dụng platform (xem businesses, tạo reviews, đặt appointments).

**Flow:**
```
1. User submits registration form (/register)
   └─> Input: email, password, full_name (optional)
   
2. Frontend calls: supabase.auth.signUp({ email, password, options: { data: { full_name } } })
   └─> Supabase Auth creates user in auth.users
   
3. Database Trigger: on_auth_user_created
   └─> Executes: public.handle_new_user() function
   └─> Auto-creates row in public.profiles table
   
4. User receives confirmation email
   └─> User clicks confirmation link
   └─> Email confirmed
   
5. User logs in
   └─> Session created
   └─> Role: "user" (regular user, not business owner, not admin)
```

**Characteristics:**
- ✅ Không cần approval
- ✅ Tự động tạo profile
- ✅ Role: `user` (default)
- ✅ Có thể upgrade thành business_owner sau (qua business registration)

**RLS Access:**
- Can read/update own profile
- Can read active businesses
- Can create reviews, appointments
- Cannot access business dashboard
- Cannot access admin panel

**Source:** `docs/auth_flows.md` - B1.1

---

### 2. Business Registration (Partner Registration)

**Mục đích:** Business partner đăng ký để trở thành business owner trên platform.

**Flow:**
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
   └─> Edge Function executes (with service role key)
   
5. Edge Function: approve-registration
   └─> Step 1: Fetch registration_request
   └─> Step 2: Create business record
   └─> Step 3: Invite user via Supabase Auth Admin API
   └─> Step 4: Update business.owner_id
   └─> Step 5: Create profile
   └─> Step 6: Send invitation email
   └─> Step 7: Update registration_request.status = 'Approved'
   
6. User receives invitation email
   └─> User clicks invitation link
   └─> User sets password
   └─> User is logged in (first login)
   
7. Role Resolution: "business_owner"
   └─> businesses.owner_id = auth.uid() ✅
```

**Characteristics:**
- ✅ Cần approval (admin/moderator)
- ✅ Tạo business record trước khi user login
- ✅ User được invite (không tự signup)
- ✅ Role: `business_owner` (sau khi approve và login)
- ✅ Business owner có thể quản lý business data

**RLS Access:**
- Can read/update own business (even if inactive)
- Can CRUD services, deals, media, blog posts for own business
- Can reply to reviews
- Can manage appointments for own business
- Cannot access other businesses' data
- Cannot access admin panel

**Source:** `docs/auth_flows.md` - B1.2

---

### 3. Admin-Created Account

**Mục đích:** Admin tạo account cho admin users (admin, moderator, editor).

**Flow:**
```
1. Admin creates admin user (Admin Panel)
   └─> Input: username, email, password, role, permissions
   
2. Frontend calls: supabase.functions.invoke('create-admin-user', { ... })
   └─> Edge Function executes (with service role key)
   
3. Edge Function: create-admin-user
   └─> Step 1: Create user in auth.users (via Supabase Auth Admin API)
   └─> Step 2: Insert row in public.admin_users table
       - username, email, role, permissions (JSONB)
       - is_locked = FALSE (default)
   └─> Step 3: Create profile in public.profiles (optional)
   
4. Admin user can login
   └─> Role: Determined by admin_users.role and admin_users.permissions
```

**Characteristics:**
- ✅ Không cần approval (admin tự tạo)
- ✅ Tạo trong `admin_users` table
- ✅ Role: `admin`, `moderator`, hoặc `editor` (based on admin_users.role)
- ✅ Permissions: Stored in `admin_users.permissions` JSONB
- ✅ Can be locked/unlocked by admin

**RLS Access:**
- Based on `admin_users.role` and `admin_users.permissions`
- Admin: Full access (all `*_admin` RLS policies)
- Moderator: Limited access (same RLS as admin, but permissions control UI)
- Editor: Content only (same RLS as admin, but permissions control UI)

**Edge Function:** `supabase/functions/create-admin-user/index.ts`

**Source:** `docs/roles_permissions.md` - B2.3

---

### 4. Invitation-Based Account

**Mục đích:** User được invite bởi admin (thường là business registration flow).

**Flow:**
```
1. Admin/Edge Function invites user
   └─> supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { ... } })
   
2. Supabase Auth creates user in auth.users
   └─> User has no password yet
   └─> User receives invitation email with action_link
   
3. User clicks invitation link
   └─> User sets password
   └─> User is logged in (first login)
   
4. Database Trigger: on_auth_user_created (if not already created)
   └─> Executes: public.handle_new_user() function
   └─> Auto-creates row in public.profiles table (if not exists)
   
5. Role Resolution
   └─> Based on business ownership, admin_users table, etc.
```

**Characteristics:**
- ✅ User không tự signup
- ✅ User được invite bởi admin/Edge Function
- ✅ User sets password via invitation link
- ✅ Role: Determined after first login (user, business_owner, admin)

**Use Cases:**
- Business registration (user được invite sau khi business được approve)
- Admin-created accounts (optional - có thể invite thay vì tạo trực tiếp)

**Source:** `docs/auth_flows.md` - B1.2 (Business Registration Flow)

---

## B3.2 - APPROVAL STATES

### State Machine for `registration_requests`

**Table:** `public.registration_requests`

**Current Schema:**
```sql
status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected'))
```

**State Definitions:**

| State | Description | Who Can Set | Conditions |
|-------|-------------|-------------|------------|
| **Pending** | Request submitted, waiting for approval | System (default) | Initial state when request is created |
| **Approved** | Request approved, business and user created | Admin, Moderator | After Edge Function `approve-registration` succeeds |
| **Rejected** | Request rejected by admin | Admin, Moderator | Admin manually rejects request |
| **Expired** | Request expired (not implemented yet) | System (future) | Request older than X days without action |
| **Cancelled** | Request cancelled by submitter (not implemented yet) | Submitter (future) | User cancels their own request |

### State Transitions

**Valid Transitions:**

```
Pending → Approved
  └─> Trigger: Admin/Moderator approves via Edge Function
  └─> Condition: Edge Function succeeds (business + user created)
  └─> Event: approve-registration Edge Function completes

Pending → Rejected
  └─> Trigger: Admin/Moderator manually rejects
  └─> Condition: Admin has canManageRegistrations permission
  └─> Event: Admin updates status to 'Rejected' (via RLS)

Pending → Cancelled (Future)
  └─> Trigger: Submitter cancels own request
  └─> Condition: Request is still Pending
  └─> Event: User updates own request (requires RLS policy)

Pending → Expired (Future)
  └─> Trigger: System cron job
  └─> Condition: Request older than 30 days (configurable)
  └─> Event: Scheduled task runs
```

**Invalid Transitions:**
- ❌ Approved → Pending (cannot revert)
- ❌ Approved → Rejected (cannot reject after approval)
- ❌ Rejected → Approved (must create new request)
- ❌ Approved → Cancelled (cannot cancel after approval)

### State Transition Table

| From State | To State | Who | Method | Edge Function | Notes |
|------------|----------|-----|--------|----------------|-------|
| Pending | Approved | Admin, Moderator | Edge Function | `approve-registration` | Creates business + user |
| Pending | Rejected | Admin, Moderator | Direct Update | None | Manual rejection |
| Pending | Cancelled | Submitter | Direct Update | None | Future feature |
| Pending | Expired | System | Cron Job | None | Future feature |

### State Enforcement

**RLS Policies:**
- `registration_requests_select_admin`: Only admins can read
- `registration_requests_insert_public`: Public can create (status = 'Pending')
- `registration_requests_update_admin`: Only admins can update (change status)
- `registration_requests_delete_admin`: Only admins can delete

**Edge Function:**
- `approve-registration`: Sets status to 'Approved' after successful business/user creation
- Uses service role key (bypasses RLS)

**Frontend:**
- Admin Panel: Shows pending requests
- Admin can approve (calls Edge Function) or reject (direct update)
- Moderator can approve/reject (if has `canManageRegistrations` permission)

---

## B3.3 - APPROVAL AUTHORITY

### Authority Matrix

**Who can approve/reject registration requests?**

| Role | Can Approve | Can Reject | Method | Permission Required |
|------|-------------|------------|---------|---------------------|
| **Admin** | ✅ Yes | ✅ Yes | Edge Function (approve) / Direct Update (reject) | `canManageRegistrations = true` |
| **Moderator** | ✅ Yes | ✅ Yes | Edge Function (approve) / Direct Update (reject) | `canManageRegistrations = true` |
| **Editor** | ❌ No | ❌ No | N/A | `canManageRegistrations = false` |
| **Business Owner** | ❌ No | ❌ No | N/A | N/A |
| **User** | ❌ No | ❌ No | N/A | N/A |
| **Anonymous** | ❌ No | ❌ No | N/A | N/A |

### Permission Mapping

**Permission:** `canManageRegistrations` (in `admin_users.permissions` JSONB)

**Default Values (from `constants.ts`):**
```typescript
PERMISSION_PRESETS = {
  [AdminUserRole.ADMIN]: {
    canManageRegistrations: true,  // ✅ Can approve
    // ...
  },
  [AdminUserRole.MODERATOR]: {
    canManageRegistrations: true,   // ✅ Can approve
    // ...
  },
  [AdminUserRole.EDITOR]: {
    canManageRegistrations: false, // ❌ Cannot approve
    // ...
  }
}
```

### Approval Process

**Step 1: Check Permission**
```typescript
// Frontend checks permission before showing approve button
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('permissions')
  .eq('email', currentUser.email)
  .single();

if (adminUser?.permissions?.canManageRegistrations) {
  // Show approve/reject buttons
}
```

**Step 2: Approve (via Edge Function)**
```typescript
// Frontend calls Edge Function
const { data, error } = await supabase.functions.invoke('approve-registration', {
  body: { requestId: registrationRequest.id }
});
```

**Step 3: Reject (Direct Update)**
```typescript
// Frontend directly updates status (RLS enforces admin-only)
const { error } = await supabase
  .from('registration_requests')
  .update({ status: 'Rejected' })
  .eq('id', registrationRequest.id);
```

### RLS Enforcement

**RLS Policy:** `registration_requests_update_admin`
```sql
CREATE POLICY "registration_requests_update_admin"
ON public.registration_requests
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));
```

**Note:** RLS checks `is_admin()` function, which checks `admin_users` table. This means:
- ✅ Admin: Can update (is_admin() = true)
- ✅ Moderator: Can update (is_admin() = true, because email in admin_users)
- ❌ Editor: Can update (is_admin() = true, but should check permission in frontend)
- ❌ Business Owner: Cannot update (is_admin() = false)
- ❌ User: Cannot update (is_admin() = false)

**Frontend Permission Check:**
- Frontend must check `canManageRegistrations` permission before allowing approve/reject
- RLS allows all admins to update, but permissions control UI rendering

---

## B3.4 - EDGE FUNCTIONS RESPONSIBILITY

### Edge Functions Overview

**Edge Functions used in Registration & Approval Flow:**

1. **`approve-registration`** - Approve business registration request
2. **`send-templated-email`** - Send invitation email
3. **`create-admin-user`** - Create admin user account

### Function 1: `approve-registration`

**Location:** `supabase/functions/approve-registration/index.ts`

**Purpose:** Approve business registration request and create business + user.

**Privileges:** Service role key (elevated privileges)

**Operations:**
1. ✅ Read `registration_requests` (bypasses RLS)
2. ✅ Create `businesses` record (bypasses RLS)
3. ✅ Invite user via Supabase Auth Admin API (`auth.admin.inviteUserByEmail`)
4. ✅ Update `businesses.owner_id` (bypasses RLS)
5. ✅ Create `profiles` record (bypasses RLS)
6. ✅ Invoke `send-templated-email` Edge Function
7. ✅ Update `registration_requests.status = 'Approved'` (bypasses RLS)

**Input:**
```typescript
{
  requestId: string  // UUID of registration_requests.id
}
```

**Output:**
```typescript
{
  message: string  // Success message
}
// OR
{
  error: string  // Error message
}
```

**Error Handling:**
- Rollback on failure (delete business, delete user if created)
- Returns error message if any step fails

**Audit Trail:**
- ❌ **Missing:** `created_by`, `approved_by` fields in `registration_requests` table
- ❌ **Missing:** Audit log for approval actions
- ✅ **Present:** Status update to 'Approved' (tracks approval)

**Compliance:**
- ✅ Uses Edge Function only for operations requiring elevated privileges
- ✅ All operations require admin privilege (cannot be done via RLS)
- ✅ No hardcode logic (all data from database)
- ⚠️ **Improvement Needed:** Add `approved_by` field to track who approved

---

### Function 2: `send-templated-email`

**Location:** `supabase/functions/send-templated-email/index.ts`

**Purpose:** Send templated emails via Resend API.

**Privileges:** Service role key (for invoking from other Edge Functions)

**Operations:**
1. ✅ Send email via Resend API
2. ✅ Template: 'invite' (for business registration invitation)

**Input:**
```typescript
{
  to: string,
  templateName: 'invite',
  templateData: {
    name: string,
    action_url: string
  }
}
```

**Output:**
```typescript
{
  message: string  // Success message
}
// OR
{
  error: string  // Error message
}
```

**Dependencies:**
- Resend API key (`RESEND_API_KEY` environment variable)
- Resend API configured in Supabase Edge Functions

**Compliance:**
- ✅ Used only when needed (email sending)
- ✅ No direct database access (pure email service)
- ✅ Error handling present

---

### Function 3: `create-admin-user`

**Location:** `supabase/functions/create-admin-user/index.ts`

**Purpose:** Create admin user account (admin, moderator, editor).

**Privileges:** Service role key (elevated privileges)

**Operations:**
1. ✅ Create user in `auth.users` (via Supabase Auth Admin API)
2. ✅ Insert row in `admin_users` table
3. ✅ Set permissions based on role

**Input:**
```typescript
{
  username: string,
  email: string,
  password: string,
  role: 'Admin' | 'Moderator' | 'Editor',
  permissions?: AdminPermissions  // Optional, defaults to preset
}
```

**Output:**
```typescript
{
  message: string,
  adminUser: AdminUser
}
// OR
{
  error: string
}
```

**Compliance:**
- ✅ Uses Edge Function for elevated privileges (user creation)
- ✅ Sets permissions based on role preset
- ✅ Error handling present

---

### Edge Functions Responsibility Summary

| Function | Used For | Service Role | Database Access | Audit Trail |
|----------|----------|--------------|-----------------|-------------|
| `approve-registration` | Business approval | ✅ Yes | ✅ Bypasses RLS | ⚠️ Partial (status only) |
| `send-templated-email` | Email sending | ✅ Yes | ❌ No | ❌ No |
| `create-admin-user` | Admin creation | ✅ Yes | ✅ Bypasses RLS | ❌ No |

**Recommendations:**
1. ✅ Edge Functions only used when elevated privileges needed
2. ⚠️ Add `approved_by` field to `registration_requests` table
3. ⚠️ Add audit log table for tracking approval actions
4. ✅ No lạm dụng service role (only when necessary)

---

## B3.5 - FAILURE & ROLLBACK

### Failure Scenarios

#### Scenario 1: Approval Fails Mid-Process

**Situation:** Edge Function `approve-registration` fails between steps.

**Current Handling:**
```typescript
// Step 2: Create business
if (businessError) {
  throw new Error(`Failed to create business: ${businessError?.message}`);
  // No rollback needed (business not created)
}

// Step 3: Invite user
if (inviteError) {
  await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
  throw new Error(`Failed to invite user: ${inviteError?.message}`);
  // Rollback: Delete business
}

// Step 4: Update business.owner_id
if (ownerUpdateError) {
  await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
  await supabaseAdmin.auth.admin.deleteUser(newUserId);
  throw new Error(`Failed to set business ownership: ${ownerUpdateError.message}`);
  // Rollback: Delete business + Delete user
}

// Step 5: Create profile
if (profileError) {
  await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
  await supabaseAdmin.auth.admin.deleteUser(newUserId);
  throw new Error(`Failed to create user profile: ${profileError.message}`);
  // Rollback: Delete business + Delete user
}

// Step 6: Send email
if (emailError) {
  await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
  await supabaseAdmin.auth.admin.deleteUser(newUserId);
  throw new Error(`Failed to send templated email: ${emailError.message}`);
  // Rollback: Delete business + Delete user
}
```

**Status:** ✅ **HANDLED** - Rollback logic present for all failure points

**Rollback Order:**
1. Delete business (if created)
2. Delete user (if created)
3. Return error to frontend

---

#### Scenario 2: User Created But Business Creation Fails

**Situation:** User is created but business creation fails.

**Current Handling:**
- ✅ **Prevented:** Business is created BEFORE user is invited
- ✅ **Order:** Business → User → Profile → Email
- ✅ **Rollback:** If user creation fails, business is deleted

**Status:** ✅ **HANDLED** - Order prevents this scenario

---

#### Scenario 3: Email Send Fails

**Situation:** Business and user are created, but email sending fails.

**Current Handling:**
```typescript
if (emailError) {
  // Rollback if email fails
  await supabaseAdmin.from('businesses').delete().eq('id', newBusiness.id);
  await supabaseAdmin.auth.admin.deleteUser(newUserId);
  throw new Error(`Failed to send templated email: ${emailError.message}`);
}
```

**Status:** ✅ **HANDLED** - Full rollback if email fails

**Alternative Approach (Future):**
- ⚠️ **Consider:** Keep business + user, send email later (retry mechanism)
- ⚠️ **Consider:** Queue email for retry instead of full rollback

---

#### Scenario 4: Registration Request Status Update Fails

**Situation:** Business and user are created, but status update fails.

**Current Handling:**
```typescript
// Step 7: Update registration request status
const { error: updateRequestError } = await supabaseAdmin
  .from('registration_requests')
  .update({ status: 'Approved' })
  .eq('id', requestId);

if (updateRequestError) {
  console.error("Failed to update request status, but user and business were created.", updateRequestError);
  // ⚠️ Does NOT rollback - business and user already created
}
```

**Status:** ⚠️ **PARTIAL** - Status update failure is logged but not rolled back

**Issue:**
- Business and user are created, but status remains 'Pending'
- Admin might try to approve again (will fail because business already exists)

**Recommendation:**
- ✅ **Current:** Log error, return success (business + user created)
- ⚠️ **Future:** Add retry mechanism for status update
- ⚠️ **Future:** Check if business already exists before creating (idempotent)

---

### Retry & Cleanup Mechanisms

#### Retry Mechanism

**Current:** ❌ **NOT IMPLEMENTED**

**Recommendations:**
1. **Idempotent Approval:**
   - Check if business already exists (by email or registration_request.id)
   - If exists, skip creation, only update status
   - Prevents duplicate businesses

2. **Email Retry Queue:**
   - If email fails, queue for retry
   - Don't rollback business + user
   - Retry email sending later

3. **Status Update Retry:**
   - If status update fails, retry in background
   - Don't rollback business + user

---

#### Cleanup Mechanism

**Current:** ✅ **PRESENT** - Rollback deletes created resources

**Manual Cleanup (if needed):**

1. **Cleanup Orphaned Businesses:**
   ```sql
   -- Find businesses without owner_id
   SELECT * FROM businesses WHERE owner_id IS NULL;
   
   -- Delete orphaned businesses
   DELETE FROM businesses WHERE owner_id IS NULL;
   ```

2. **Cleanup Orphaned Users:**
   ```sql
   -- Find users without profile
   SELECT u.id, u.email 
   FROM auth.users u
   LEFT JOIN profiles p ON p.id = u.id
   WHERE p.id IS NULL;
   
   -- Delete via Supabase Auth Admin API (not SQL)
   ```

3. **Cleanup Stale Registration Requests:**
   ```sql
   -- Find requests older than 30 days with status 'Pending'
   SELECT * FROM registration_requests
   WHERE status = 'Pending'
   AND submitted_at < NOW() - INTERVAL '30 days';
   
   -- Update to 'Expired' (when implemented)
   UPDATE registration_requests
   SET status = 'Expired'
   WHERE status = 'Pending'
   AND submitted_at < NOW() - INTERVAL '30 days';
   ```

---

### Error Recovery Procedures

#### Procedure 1: Approval Failed But Business Created

**Symptoms:**
- Registration request status = 'Pending'
- Business exists in database
- No user created

**Recovery:**
1. Check if business exists: `SELECT * FROM businesses WHERE email = '<request_email>'`
2. If business exists:
   - Option A: Delete business, retry approval
   - Option B: Manually create user, link to business, update status
3. If business doesn't exist:
   - Retry approval normally

---

#### Procedure 2: Approval Succeeded But Email Not Sent

**Symptoms:**
- Registration request status = 'Approved'
- Business exists
- User exists
- But user didn't receive invitation email

**Recovery:**
1. Check user status: `SELECT * FROM auth.users WHERE email = '<request_email>'`
2. If user exists:
   - Option A: Resend invitation email (via Supabase Auth Admin API)
   - Option B: Manually send invitation link to user
3. If user doesn't exist:
   - Create user manually, link to business

---

#### Procedure 3: Duplicate Approval Attempt

**Symptoms:**
- Admin tries to approve same request twice
- Edge Function returns error: "Request already approved" or "Business already exists"

**Recovery:**
1. Check registration request status: `SELECT status FROM registration_requests WHERE id = '<request_id>'`
2. If status = 'Approved':
   - ✅ Already approved, no action needed
   - Check if user can login (if not, resend invitation)
3. If status = 'Pending' but business exists:
   - Update status to 'Approved' manually
   - Check if user exists, create if missing

---

## STATE TRANSITION TABLE (SUMMARY)

| From State | To State | Who | Method | Edge Function | Rollback On Failure |
|------------|----------|-----|--------|---------------|---------------------|
| Pending | Approved | Admin, Moderator | Edge Function | `approve-registration` | ✅ Yes (delete business + user) |
| Pending | Rejected | Admin, Moderator | Direct Update | None | N/A (no resources created) |
| Pending | Cancelled | Submitter | Direct Update | None | N/A (no resources created) |
| Pending | Expired | System | Cron Job | None | N/A (no resources created) |

---

## AUTHORITY MATRIX (SUMMARY)

| Role | Can Approve | Can Reject | Permission Required |
|------|-------------|------------|---------------------|
| Admin | ✅ Yes | ✅ Yes | `canManageRegistrations = true` |
| Moderator | ✅ Yes | ✅ Yes | `canManageRegistrations = true` |
| Editor | ❌ No | ❌ No | `canManageRegistrations = false` |
| Business Owner | ❌ No | ❌ No | N/A |
| User | ❌ No | ❌ No | N/A |
| Anonymous | ❌ No | ❌ No | N/A |

---

## COMPLIANCE WITH ARCHITECTURE.MD

### ✅ Edge Functions Only When Needed

- `approve-registration`: Uses service role for elevated privileges (user creation, business creation)
- `send-templated-email`: Uses service role for email sending (external API)
- `create-admin-user`: Uses service role for user creation

### ✅ No Hardcode Logic

- All data from database (`registration_requests` table)
- Permissions from `admin_users.permissions` JSONB
- Roles from `admin_users.role`

### ✅ RLS-First Security

- RLS policies enforce who can read/update `registration_requests`
- Edge Functions bypass RLS only when necessary (elevated privileges)
- Frontend checks permissions before allowing actions

### ⚠️ Audit Trail Improvements Needed

- **Missing:** `approved_by` field in `registration_requests` table
- **Missing:** `created_by` field in `registration_requests` table
- **Missing:** Audit log table for tracking approval actions
- **Present:** Status tracking (Pending → Approved/Rejected)

---

## NOTES

- Registration requests can only be created by public (no authentication required)
- Only admins can read/update/delete registration requests (RLS enforced)
- Approval requires Edge Function (cannot be done via RLS alone)
- Rollback is implemented for all failure scenarios
- Email failure triggers full rollback (consider queue for retry in future)
- Status update failure is logged but doesn't rollback (business + user already created)

---

**Registration & Approval Flow Version:** 1.0  
**Status:** READY  
**Next:** C1 - Frontend Architecture Audit





