# RLS Risk Report

**Last Updated:** 2025-01-11  
**Source:** Frontend ↔ Backend ↔ Database Contract Audit  
**Purpose:** Document frontend features that may fail due to RLS policies

---

## 📋 EXECUTIVE SUMMARY

This report documents RLS (Row Level Security) risks identified during frontend-database contract alignment audit. These are cases where frontend queries may be blocked by RLS policies.

**Total Risks Identified:** 1 HIGH risk, 1 ambiguous case  
**Tables Analyzed:** 3 tables (`orders`, `registration_requests`, `page_content`)

---

## ⚠️ HIGH RISK

### Table: `orders` - BusinessContext SELECT Query

**File:** `contexts/BusinessContext.tsx:121`

**Query:**
```typescript
supabase.from('orders')
  .select('id, business_id, package_id, amount, status, submitted_at, notes')
  .order('submitted_at', { ascending: false })
```

**RLS Policy:** `orders_select_owner_or_admin`
- Allows: Business owners (for their business) OR admins
- Blocks: Public users, non-owner authenticated users

**Risk Level:** ⚠️ **HIGH**

**Issue:**
- Query does NOT filter by `business_id` explicitly
- RLS policy checks: `businesses.owner_id = auth.uid()` (via EXISTS subquery)
- If user is NOT admin AND NOT business owner → Query will return empty result or error

**Impact:**
- `fetchAllData()` in BusinessContext may fail for non-admin users
- Business owners should be able to see their orders (RLS handles this)
- Non-owner users will see empty results

**Recommendation:**
- ⚠️ **Verify** that BusinessContext is only used in business owner context
- ⚠️ **Verify** RLS policy correctly filters by business ownership
- Consider adding explicit `.eq('business_id', businessId)` filter for clarity

**Status:** ⚠️ Needs verification - RLS should work but query structure is ambiguous

---

## ✅ LOW RISK / VERIFIED OK

### Table: `orders` - OrderDataContext SELECT Query

**File:** `contexts/OrderDataContext.tsx:24`

**Query:**
```typescript
supabase.from('orders').select('*').order('submitted_at', { ascending: false })
```

**RLS Policy:** `orders_select_owner_or_admin`
- Allows: Business owners (for their business) OR admins

**Risk Level:** ✅ **LOW**

**Status:** ✅ OK - Admin-only context, should work (uses admin authentication)

---

### Table: `registration_requests` - AdminPlatformContext / AdminContext SELECT

**Files:**
- `contexts/AdminPlatformContext.tsx:79`
- `contexts/AdminContext.tsx:328`

**Query:**
```typescript
supabase.from('registration_requests')
  .select('id, business_name, email, phone, address, category, tier, submitted_at, status')
  .order('submitted_at', { ascending: false })
```

**RLS Policy:** `registration_requests_select_admin`
- Allows: Admins only

**Risk Level:** ✅ **OK**

**Status:** ✅ OK - Admin-only context, should work (uses admin authentication)

---

### Table: `page_content` - Multiple Contexts SELECT

**Files:**
- `contexts/AdminPlatformContext.tsx:83`
- `contexts/AdminContext.tsx:332`
- `contexts/HomepageDataContext.tsx:58`
- `contexts/PublicPageContentContext.tsx:37`

**Query:**
```typescript
supabase.from('page_content')
  .select('page_name, content_data')
```

**RLS Policy:** `page_content_select_public`
- Allows: Public (anyone) ✅

**Risk Level:** ✅ **OK**

**Status:** ✅ OK - Public SELECT allowed, no authentication required

---

## ⚠️ AMBIGUOUS CASES

### Table: `orders` - BusinessContext Query Filtering

**Question:** Does `BusinessContext.tsx:121` query filter orders by `business_id` before RLS check, or does it rely on RLS policy to filter?

**Context:**
- Query: `supabase.from('orders').select('...').order('submitted_at', { ascending: false })`
- No `.eq('business_id', ...)` filter visible in the query
- RLS policy: `orders_select_owner_or_admin` checks `businesses.owner_id = auth.uid()`

**Analysis:**
- RLS policy uses EXISTS subquery: `businesses.id = orders.business_id AND businesses.owner_id = auth.uid()`
- RLS should filter rows automatically (even without explicit WHERE clause)
- However, query may return more rows than needed if user is admin

**Recommendation:**
- ⚠️ **Mark as Ambiguous** - Need to verify:
  1. Is `fetchAllData()` called only in business owner context?
  2. Is business_id filtering done upstream (before calling fetchAllData)?
  3. Does RLS policy correctly filter for business owners?

**Status:** ⚠️ Needs verification

---

## 📊 RLS RISK SUMMARY TABLE

| Table | Operation | Frontend Usage | RLS Policy | Risk Level | Status | Action Required |
|-------|-----------|----------------|------------|------------|--------|-----------------|
| `orders` | SELECT | BusinessContext (all orders) | Owner OR Admin | ⚠️ **HIGH** | Needs Verification | Verify business_id filtering |
| `orders` | SELECT | OrderDataContext (all orders) | Owner OR Admin | ✅ **LOW** | OK | Admin-only context |
| `orders` | INSERT | Various | Public OR Admin | ✅ **OK** | OK | No changes needed |
| `registration_requests` | SELECT | AdminPlatformContext/AdminContext | Admin only | ✅ **OK** | OK | Admin-only context |
| `registration_requests` | INSERT | PartnerRegistrationPage | Public | ✅ **OK** | OK | No changes needed |
| `page_content` | SELECT | Multiple contexts | Public | ✅ **OK** | OK | No changes needed |

---

## 🔍 RLS POLICY DETAILS

### orders_select_owner_or_admin

**Policy:**
```sql
CREATE POLICY "orders_select_owner_or_admin"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);
```

**Behavior:**
- Allows SELECT if: User is business owner (for that order's business) OR user is admin
- Blocks: Public users, non-owner authenticated users

**Frontend Impact:**
- Business owners: Can see their own business orders ✅
- Admins: Can see all orders ✅
- Other users: Cannot see orders ❌

---

### registration_requests_select_admin

**Policy:**
```sql
CREATE POLICY "registration_requests_select_admin"
ON public.registration_requests
FOR SELECT
USING (public.is_admin(public.get_user_email()));
```

**Behavior:**
- Allows SELECT if: User is admin
- Blocks: All non-admin users (including public, authenticated users, business owners)

**Frontend Impact:**
- Admins: Can see all registration requests ✅
- Other users: Cannot see registration requests ❌

---

### page_content_select_public

**Policy:**
```sql
CREATE POLICY "page_content_select_public"
ON public.page_content
FOR SELECT
USING (TRUE);
```

**Behavior:**
- Allows SELECT: Everyone (public access)
- Blocks: Nothing (public access)

**Frontend Impact:**
- All users: Can see page content ✅

---

## 📝 RECOMMENDATIONS

### Immediate Actions

1. **Verify BusinessContext orders query:**
   - Confirm RLS policy correctly filters by business ownership
   - Verify `fetchAllData()` is called only in appropriate context
   - Consider adding explicit `business_id` filter if needed

2. **Test RLS policies:**
   - Test orders SELECT as business owner
   - Test orders SELECT as admin
   - Test orders SELECT as public user (should be blocked)

### Future Improvements

1. **Add explicit filtering:**
   - Consider adding `.eq('business_id', businessId)` filters for clarity
   - Makes query intent explicit (even if RLS handles it)

2. **Document RLS behavior:**
   - Update `database/rls.md` with detailed policy explanations
   - Document which queries require explicit filters vs. RLS-only filtering

---

## ✅ CONFIRMATION

**Analysis Date:** 2025-01-11  
**Database Source:** Supabase (verified via MCP)  
**RLS Policies Source:** `database/rls_policies_v1.sql`

**Status:** 
- ✅ Most queries verified OK
- ⚠️ 1 high-risk case needs verification
- ⚠️ 1 ambiguous case needs clarification

---

**END OF RLS RISK REPORT**
