# MANUAL STEPS CHECKLIST
## Steps Requiring Manual Intervention

**Date:** 2025-01-11  
**Status:** ACTIVE  
**Purpose:** Track all manual steps that cannot be automated

---

## ⚠️ IMPORTANT NOTES

- ✅ **Automated Steps:** Will be handled via MCP Supabase/Vercel
- ⚠️ **Manual Steps:** Must be performed by user
- 📋 **Check each item** as you complete it
- ❌ **Do not skip any steps** - All are required for production readiness

---

## PHASE 1: PRE-FIX VERIFICATION

### 1.1 Supabase Connection Verification

**Status:** ⬜ Pending | ✅ Complete

**Steps:**
- [ ] Verify Supabase project URL is accessible
- [ ] Verify Supabase API keys are valid
- [ ] Verify Edge Functions secrets are set
- [ ] Test database connection

**Notes:**
- These will be verified via MCP Supabase before proceeding

---

## PHASE 2: SECURITY FIXES (CRITICAL)

### 2.1 Edge Function Authorization

**Status:** ✅ Complete (Code deployed) | ⚠️ Manual Testing Pending

**Automated Steps:**
- ✅ Code changes made automatically
- ✅ Edge Function redeployed via MCP Supabase (version 4)

**Manual Steps:**
- [ ] **Review code changes** in `supabase/functions/create-admin-user/index.ts` (lines 17-59)
- [ ] **Verify authorization logic** matches your security requirements
- [ ] **Test function** with non-admin user (should fail with 403)
- [ ] **Test function** with admin user (should succeed)
- [ ] **Test function** without Authorization header (should fail with 401)
- [ ] **Test function** with invalid token (should fail with 401)
- [ ] **Monitor function logs** after deployment for any errors

**Verification:**
```bash
# After deployment, test:
# 1. Call with non-admin JWT (should fail)
# 2. Call with admin JWT (should succeed)
```

---

### 2.2 Edge Function Input Validation

**Status:** ✅ Complete (Code deployed) | ⚠️ Manual Testing Pending

**Automated Steps:**
- ✅ Input validation code added automatically
- ✅ Edge Functions redeployed via MCP Supabase
  - `create-admin-user`: version 4
  - `approve-registration`: version 5

**Manual Steps:**
- [ ] **Review validation rules** in updated Edge Functions
  - `create-admin-user`: Email, password (min 8 chars), username (min 3 chars), role, permissions
  - `approve-registration`: RequestId (UUID format, non-empty)
- [ ] **Test create-admin-user with invalid inputs** (should fail with 400):
  - [ ] Invalid email format
  - [ ] Weak password (< 8 characters)
  - [ ] Short username (< 3 characters)
  - [ ] Invalid role (not Admin/Moderator/Editor)
  - [ ] Missing/invalid permissions
- [ ] **Test approve-registration with invalid inputs** (should fail with 400):
  - [ ] Empty requestId
  - [ ] Invalid UUID format
  - [ ] Non-string requestId
- [ ] **Test with valid inputs** (should succeed)
- [ ] **Verify error messages** are user-friendly

**Edge Functions to Review:**
- `supabase/functions/create-admin-user/index.ts` (lines 61-104)
- `supabase/functions/approve-registration/index.ts` (lines 25-43)

---

## PHASE 3: DATABASE VERIFICATION

### 3.1 Schema Alignment Verification

**Status:** ⬜ Pending | ✅ Complete

**Automated Steps:**
- ✅ Schema verification script will be created
- ✅ Report will be generated automatically

**Manual Steps:**
- [ ] **Review schema verification report**
- [ ] **Verify no mismatches** between frontend and database
- [ ] **Fix any identified mismatches** (if any found)

**Files to Review:**
- `docs/SCHEMA_VERIFICATION_REPORT.md` (will be generated)

---

### 3.2 RLS Policy Verification

**Status:** ⬜ Pending | ✅ Complete

**Automated Steps:**
- ✅ RLS policies will be checked via MCP Supabase
- ✅ Test queries will be executed automatically
- ✅ Report will be generated

**Manual Steps:**
- [ ] **Review RLS policy verification report**
- [ ] **Test critical flows manually:**
  - [ ] Anonymous user cannot access protected data
  - [ ] Regular user can only access own data
  - [ ] Business owner can access own business data
  - [ ] Admin can access all data
- [ ] **Fix any RLS policy issues** (if any found)

**Test Scenarios:**
1. Login as regular user → Try to access admin data (should fail)
2. Login as business owner → Try to access other business data (should fail)
3. Login as admin → Verify can access all data (should succeed)

---

## PHASE 4: TESTING

### 4.1 Integration Testing

**Status:** ⬜ Pending | ✅ Complete

**Automated Steps:**
- ✅ Integration tests will be created
- ✅ Tests will be run automatically

**Manual Steps:**
- [ ] **Review test results**
- [ ] **Fix any failing tests** (if any)
- [ ] **Run tests again** to verify fixes

---

### 4.2 Manual Testing (Critical Flows)

**Status:** ⬜ Pending | ✅ Complete

**Test Scenarios:**
- [ ] **User Registration Flow:**
  - [ ] Register new user
  - [ ] Verify profile created
  - [ ] Verify email confirmation works
  - [ ] Login with new account

- [ ] **Admin User Creation Flow:**
  - [ ] Call `create-admin-user` Edge Function (as admin)
  - [ ] Verify admin user created
  - [ ] Verify admin can login
  - [ ] Verify permissions work

- [ ] **Business Registration Approval Flow:**
  - [ ] Create registration request
  - [ ] Approve request (as admin)
  - [ ] Verify business created
  - [ ] Verify invitation email sent
  - [ ] Verify business owner can login

- [ ] **Authentication Flow:**
  - [ ] Login as regular user
  - [ ] Login as business owner
  - [ ] Login as admin
  - [ ] Verify session persistence
  - [ ] Verify logout works

- [ ] **Authorization Flow:**
  - [ ] Try to access admin panel (as regular user) - should fail
  - [ ] Try to access business dashboard (as regular user) - should fail
  - [ ] Verify admin can access admin panel
  - [ ] Verify business owner can access business dashboard

---

## PHASE 5: DEPLOYMENT

### 5.1 Edge Functions Deployment

**Status:** ⬜ Pending | ✅ Complete

**Automated Steps:**
- ✅ Edge Functions will be deployed via MCP Supabase

**Manual Steps:**
- [ ] **Verify Edge Functions deployed successfully**
- [ ] **Check Edge Functions logs** for any errors
- [ ] **Test each Edge Function** manually:
  - [ ] `create-admin-user`
  - [ ] `approve-registration`
  - [ ] `send-templated-email`
  - [ ] `generate-sitemap`

**Verification:**
- Supabase Dashboard → Edge Functions → Verify all functions deployed
- Check function logs for errors

---

### 5.2 Environment Variables Verification

**Status:** ⬜ Pending | ✅ Complete

**Automated Steps:**
- ✅ Environment variables will be checked via MCP Vercel/Supabase

**Manual Steps:**
- [ ] **Verify Vercel Environment Variables:**
  - [ ] `VITE_SUPABASE_URL` - Correct value
  - [ ] `VITE_SUPABASE_ANON_KEY` - Correct value (new publishable key)
  - [ ] Other required variables (if any)

- [ ] **Verify Supabase Edge Function Secrets:**
  - [ ] `SECRET_KEY` - Correct value
  - [ ] `RESEND_API_KEY` - Correct value
  - [ ] `SUPABASE_URL` - Correct value

**Verification:**
- Vercel Dashboard → Project → Settings → Environment Variables
- Supabase Dashboard → Edge Functions → Secrets

---

## PHASE 6: PRODUCTION READINESS

### 6.1 Final Verification

**Status:** ⬜ Pending | ✅ Complete

**Checklist:**
- [ ] **All automated fixes completed**
- [ ] **All manual steps completed**
- [ ] **All tests passing**
- [ ] **No critical errors in logs**
- [ ] **Performance acceptable**
- [ ] **Security verified**
- [ ] **Documentation updated**

---

### 6.2 Monitoring Setup (Optional but Recommended)

**Status:** ⬜ Pending | ✅ Complete | ⏭️ Skip

**Steps:**
- [ ] **Set up error tracking** (e.g., Sentry)
- [ ] **Set up performance monitoring**
- [ ] **Set up alerting** for critical errors
- [ ] **Review logs** regularly

---

## PROGRESS TRACKING

**Total Manual Steps:** 40+  
**Completed:** 0  
**Remaining:** 40+

**Last Updated:** 2025-01-11

---

## NOTES

- ✅ Automated steps are handled by MCP Supabase/Vercel
- ⚠️ Manual steps require user action
- 📋 Check each item as completed
- ❌ Do not proceed to next phase until current phase is complete

---

**END OF MANUAL STEPS CHECKLIST**
