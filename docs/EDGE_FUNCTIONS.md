# Supabase Edge Functions Documentation

**Last Updated:** 2025-01-12  
**Total Functions:** 6

---

## Function: `approve-registration`

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

---

## Function: `invite-staff`

**Location:** `supabase/functions/invite-staff/index.ts`

**Purpose:** Invite staff member to a business (handles both new and existing users).

**Privileges:** Service role key (elevated privileges)

**Operations:**
1. ✅ Check if business exists
2. ✅ Check if user exists (via profiles table)
3. ✅ If user doesn't exist: Invite via Supabase Auth Admin API
4. ✅ Create profile for new user (if needed)
5. ✅ Send invitation email (if new user)
6. ✅ Check if user is already staff member
7. ✅ Add staff member to `business_staff` table (bypasses RLS)

**Input:**
```typescript
{
  email: string;
  businessId: number;
  role: 'Editor' | 'Admin';
  permissions: {
    canEditLandingPage?: boolean;
    canEditBlog?: boolean;
    canManageMedia?: boolean;
    canManageServices?: boolean;
  };
  businessName?: string;  // For email template
}
```

**Output:**
```typescript
{
  message: string;
  staff: BusinessStaff;
  isNewUser: boolean;
}
// OR
{
  error: string;
}
```

**Error Handling:**
- Rollback on failure (delete user if created, remove staff if added)
- Returns error message if any step fails

---

## Function: `send-templated-email`

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
    action_url: string,
    business_name?: string  // Optional, for staff invitations
  }
}
```

**Dependencies:**
- Resend API key (`RESEND_API_KEY` environment variable)

---

## Function: `create-admin-user`

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

---

## Function: `send-email`

**Location:** `supabase/functions/send-email/index.ts`

**Purpose:** Generic email sending (legacy function).

**Status:** May be legacy, verify usage.

---

## Function: `generate-sitemap`

**Location:** `supabase/functions/generate-sitemap/index.ts`

**Purpose:** Generate sitemap for SEO.

**Status:** Verify usage and implementation.

---

## Summary

| Function | Used For | Service Role | Database Access | Email Sending |
|----------|----------|--------------|-----------------|---------------|
| `approve-registration` | Business approval | ✅ Yes | ✅ Bypasses RLS | ✅ Yes |
| `invite-staff` | Staff invitation | ✅ Yes | ✅ Bypasses RLS | ✅ Yes |
| `send-templated-email` | Email sending | ✅ Yes | ❌ No | ✅ Yes |
| `create-admin-user` | Admin creation | ✅ Yes | ✅ Bypasses RLS | ❌ No |
| `send-email` | Generic email | ✅ Yes | ❌ No | ✅ Yes |
| `generate-sitemap` | SEO sitemap | ❓ Unknown | ❓ Unknown | ❌ No |

---

**END OF EDGE FUNCTIONS DOCUMENTATION**
