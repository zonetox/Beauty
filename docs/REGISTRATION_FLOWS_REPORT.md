# 📋 Báo cáo Chi tiết - Các Luồng Đăng ký Hiện tại

**Date:** 2025-01-11  
**Purpose:** Document tất cả các luồng đăng ký và loại tài khoản

---

## 📊 TỔNG QUAN

**Total Registration Flows:** 3  
**Total Account Types:** 4  
**Active Flows:** 3  
**Disabled Flows:** 1

---

## 🔐 1. LUỒNG ĐĂNG KÝ DOANH NGHIỆP (BUSINESS REGISTRATION)

### Flow A: Direct Business Signup

**File:** `pages/RegisterPage.tsx`  
**Route:** `/register`  
**Status:** ✅ **ACTIVE**

**Process:**
1. User điền form:
   - Business name
   - Email
   - Phone
   - Password
   - Confirm password

2. Submit → `supabase.auth.signUp()`
   - Creates auth user
   - Stores `business_name` in `user_metadata.full_name`
   - Stores `phone` in `user_metadata.phone`

3. **Auto-create Business** (assumed via trigger/function):
   - Creates record in `businesses` table
   - Creates record in `profiles` table
   - Links `owner_id` to auth user

4. Redirect to `/account` (business dashboard)

**Membership Tier:**
- ❓ **KHÔNG RÕ** - Code không set membership_tier
- ⚠️ **Default:** 'Free' (từ database default)
- ⚠️ **VẤN ĐỀ:** Không set `membership_expiry_date`
- ⚠️ **VẤN ĐỀ:** Không có trial 30 ngày

**Fields Created:**
- ✅ `auth.users` - Auth user
- ✅ `profiles` - User profile (auto-created)
- ✅ `businesses` - Business record (assumed auto-created)

**Activation:**
- `is_active = true` (default)
- Business có thể sử dụng ngay

---

### Flow B: Partner Registration Request

**File:** `pages/PartnerRegistrationPage.tsx`  
**Route:** `/partner-registration` (assumed)  
**Status:** ✅ **ACTIVE**

**Process:**
1. User điền form:
   - Business name
   - Email
   - Phone
   - Category (BusinessCategory enum)
   - Address
   - Tier preference (MembershipTier enum)

2. Submit → Insert vào `registration_requests` table:
   ```typescript
   {
     business_name: string,
     email: string,
     phone: string,
     category: BusinessCategory,
     address: string,
     tier: MembershipTier,  // User preference
     status: 'Pending'
   }
   ```

3. Admin review và approve:
   - Admin xem request trong admin panel
   - Approve → Tạo business account
   - Reject → Mark status = 'Rejected'

**Membership Tier:**
- User chọn tier preference (VIP, Premium, Free)
- ⚠️ **VẤN ĐỀ:** Tier này chỉ là preference, không phải actual tier
- ⚠️ **VẤN ĐỀ:** Cần verify admin approval flow tạo business với tier nào

**Status:** ✅ **HOẠT ĐỘNG** - Nhưng cần verify approval implementation

---

## 👨‍💼 2. LUỒNG ĐĂNG KÝ ADMIN

### Flow C: Admin User Creation

**File:** `contexts/AdminContext.tsx`  
**Route:** Admin panel  
**Status:** ✅ **ACTIVE**

**Process:**
1. Admin tạo user mới qua admin panel:
   - Username
   - Email
   - Role (Admin, Moderator, Editor)
   - Permissions (jsonb)

2. Insert vào `admin_users` table:
   ```typescript
   {
     username: string,
     email: string,
     role: AdminUserRole,
     permissions: AdminPermissions,
     is_locked: false
   }
   ```

3. User phải đăng ký riêng qua Supabase Auth:
   - User vào `/admin/register` hoặc `/register`
   - Đăng ký với email đã được add vào `admin_users`
   - Link email trong `admin_users` với auth user

4. Login:
   - `AdminContext` check email match
   - Verify `is_locked = false`
   - Set currentUser với admin profile

**Status:** ✅ **HOẠT ĐỘNG** - Manual 2-step process

---

## 🚫 3. LUỒNG ĐÃ BỊ DISABLE

### Flow D: End User Registration

**File:** `pages/SignupPage.tsx`  
**Route:** `/signup`  
**Status:** ❌ **DISABLED**

**Comment trong code:**
> "This page is no longer in use as per the removal of end-user accounts. The user registration flow is now handled by business registration and admin approval."

**Status:** ❌ **KHÔNG HOẠT ĐỘNG** - Returns null

---

## 👥 4. CÁC LOẠI TÀI KHOẢN

### Type 1: Business Account (Doanh nghiệp)

**Registration Methods:**
- Direct signup (`/register`)
- Partner request + Admin approval (`/partner-registration`)

**Database Tables:**
- `auth.users` - Auth user
- `profiles` - User profile (links to auth.users.id)
- `businesses` - Business record (links to profiles.business_id)

**Membership Tiers:**
- `FREE` - Default khi đăng ký
- `PREMIUM` - Sau khi thanh toán package
- `VIP` - Sau khi thanh toán VIP package

**Features:**
- Business dashboard (`/account`)
- Manage services, gallery, blog posts
- View analytics
- Manage appointments
- Manage reviews
- Manage deals

**Activation:**
- `is_active = true` (default hoặc sau payment)
- `membership_expiry_date` (nullable, set sau payment)

**Current Count:**
- Total: 1 business (VIP tier)
- Active: 1 business

---

### Type 2: Admin Account

**Registration Method:**
- Manual creation via admin panel

**Database Tables:**
- `auth.users` - Auth user (must register separately)
- `admin_users` - Admin profile (links by email)

**Roles:**
- `Admin` - Full permissions
- `Moderator` - Limited permissions
- `Editor` - Content only

**Features:**
- Admin dashboard (`/admin`)
- Manage businesses, users, orders
- Manage platform blog
- View analytics
- System settings
- Manage registrations

**Current Count:**
- Total: 0 (after reset)

---

### Type 3: Registration Request (Pending)

**Registration Method:**
- Form submit (`/partner-registration`)

**Database Tables:**
- `registration_requests` - Request record

**Status Values:**
- `Pending` - Awaiting admin approval
- `Approved` - Admin approved (should create business)
- `Rejected` - Admin rejected

**Current Count:**
- Total: 0 (after reset)

---

### Type 4: End User Account

**Status:** ❌ **DISABLED**

**Note:** End-user registration đã bị remove. Chỉ có business accounts.

---

## 💳 5. LUỒNG THANH TOÁN - PHÂN TÍCH

### Payment Flow Steps:

#### Step 1: Create Order
**Location:** Business dashboard  
**Action:** Business tạo order cho package

```typescript
const order = await addOrder({
  businessId: number,
  packageId: string,
  packageName: string,
  amount: number,
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Simulated Gateway',
  status: OrderStatus.PENDING
});
```

**Status:** ✅ **HOẠT ĐỘNG**

---

#### Step 2: User Payment (External)
**Process:**
- User chuyển khoản hoặc thanh toán qua gateway
- **KHÔNG có payment gateway integration**
- Manual process - User tự thanh toán

**Status:** ⚠️ **MANUAL** - Không có automation

---

#### Step 3: Admin Confirms Payment
**Location:** Admin panel → Orders  
**Action:** Admin confirm payment

```typescript
await updateOrderStatus(orderId, OrderStatus.COMPLETED);
```

**What Happens:**
1. Order status → `COMPLETED`
2. `confirmed_at` → current timestamp
3. **Business Activation:**
   - Fetch package từ `membership_packages` (hoặc hardcode)
   - Calculate expiry: `now() + package.durationMonths`
   - Update business:
     - `membership_tier` → package.tier
     - `membership_expiry_date` → calculated date
     - `is_active` → `true`
4. Send notification email

**Status:** ✅ **HOẠT ĐỘNG** - Có business activation logic

---

### ⚠️ VẤN ĐỀ TRONG PAYMENT FLOW

#### Issue 1: Duplicate Logic
**Files:**
- `contexts/BusinessContext.tsx:415-457`
- `contexts/BusinessBlogDataContext.tsx:250-290`

**Vấn đề:**
- Logic activate business duplicate ở 2 nơi
- Có thể gây inconsistency nếu logic khác nhau

**Fix đề xuất:**
- Centralize vào một function
- Hoặc dùng database trigger

---

#### Issue 2: Package Lookup
**File:** `BusinessBlogDataContext.tsx:264-275`

**Vấn đề:**
```typescript
// Hardcoded 1 year if package lookup fails
expiryDate.setFullYear(expiryDate.getFullYear() + 1);
```

**Vấn đề:**
- Không fetch từ `membership_packages` table
- Hardcoded 1 year nếu không tìm thấy package
- Có thể gây sai expiry date

**Fix cần thiết:**
- Fetch package từ `membership_packages` table
- Use `package.durationMonths` thay vì hardcode

---

#### Issue 3: Payment Gateway Missing
**Vấn đề:**
- Không có payment gateway integration
- Manual payment confirmation
- Có thể gây delay và errors

**Status:** ⚠️ **CẦN CẢI THIỆN** - Nhưng không critical nếu manual process OK

---

## 🎯 6. TRIAL 30 NGÀY - PHÂN TÍCH & ĐỀ XUẤT

### Yêu cầu:
> "Tất cả tài khoản doanh nghiệp hiện nay sẽ trial 30 ngày miễn phí, đầy đủ chức năng"

### Hiện trạng:

**Current Registration:**
- Business được tạo với `membership_tier = 'Free'` (default)
- `membership_expiry_date = NULL` (không có expiry)
- `is_active = true` (default)
- Business có thể sử dụng ngay, không có expiry

**Vấn đề:**
- ❌ Không có trial period logic
- ❌ Không set expiry date khi đăng ký
- ❌ Không có check expiry date
- ❌ Không có auto-deactivate sau trial

---

### Đề xuất Implementation:

#### Option 1: Premium Trial (Recommended)

**Khi đăng ký:**
```typescript
// Set Premium tier với 30 days expiry
membership_tier = 'Premium'
membership_expiry_date = now() + 30 days
is_active = true
```

**Sau 30 ngày:**
- Check expiry date
- If expired → Downgrade to 'Free' hoặc deactivate
- Show upgrade prompt

**Ưu điểm:**
- User được dùng đầy đủ tính năng Premium trong 30 ngày
- Sau đó có thể upgrade hoặc downgrade to Free

---

#### Option 2: Trial Tier

**Thêm Trial Tier:**
```typescript
export enum MembershipTier {
  TRIAL = 'Trial',  // NEW
  VIP = 'VIP',
  PREMIUM = 'Premium',
  FREE = 'Free',
}
```

**Khi đăng ký:**
```typescript
membership_tier = 'Trial'
membership_expiry_date = now() + 30 days
is_active = true
```

**Sau 30 ngày:**
- Check expiry date
- If expired → Downgrade to 'Free' hoặc require payment

**Ưu điểm:**
- Rõ ràng là trial period
- Dễ track trial users

---

#### Option 3: Free với Expiry

**Khi đăng ký:**
```typescript
membership_tier = 'Free'
membership_expiry_date = now() + 30 days
is_active = true
```

**Sau 30 ngày:**
- Check expiry date
- If expired → `is_active = false` hoặc require payment

**Ưu điểm:**
- Đơn giản, không cần thêm tier mới

---

### Recommended: Option 1 (Premium Trial)

**Lý do:**
- User được dùng đầy đủ tính năng Premium
- Sau trial có thể upgrade hoặc downgrade
- Không cần thêm tier mới

**Implementation:**

**1. Update Registration:**
```typescript
// In RegisterPage.tsx or trigger/function
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30); // 30 days trial

await supabase.from('businesses').insert({
  // ... other fields
  membership_tier: 'Premium',
  membership_expiry_date: expiryDate.toISOString(),
  is_active: true
});
```

**2. Add Expiry Check:**
```typescript
// Check on business access or cron job
const checkTrialExpiry = async (businessId: number) => {
  const { data } = await supabase
    .from('businesses')
    .select('membership_expiry_date, membership_tier, is_active')
    .eq('id', businessId)
    .single();
  
  if (data && data.membership_expiry_date) {
    const expiry = new Date(data.membership_expiry_date);
    const now = new Date();
    
    if (now > expiry && data.membership_tier === 'Premium') {
      // Trial expired - downgrade to Free
      await supabase.from('businesses').update({
        membership_tier: 'Free',
        // Keep is_active = true with limited features
        // Or set is_active = false to require payment
      }).eq('id', businessId);
    }
  }
};
```

**3. UI Notifications:**
- Show trial countdown trong dashboard
- Show warning khi trial sắp hết (7 days, 3 days, 1 day)
- Show upgrade prompt sau khi trial hết

---

## 📊 7. MEMBERSHIP PACKAGES

### Database Table: `membership_packages`

**Columns:**
- `id` (text) - Primary key
- `name` (text)
- `price` (numeric)
- `duration_months` (integer)
- `description` (text, nullable)
- `features` (ARRAY, nullable)
- `permissions` (jsonb, nullable)
- `is_popular` (boolean, default false)
- `is_active` (boolean, default true)

**Note:** 
- ❌ **KHÔNG có column `tier`** trong database
- ⚠️ Frontend code sử dụng `tier` nhưng database không có
- ⚠️ Cần verify mapping giữa package và tier

**Current Packages:**
- Database: 0 packages (empty)
- Frontend constants: 3 packages (Free, Premium, VIP)

---

## 📋 8. TỔNG KẾT

### Registration Flows Summary

| Flow | Route | Method | Creates | Tier | Trial | Status |
|------|-------|--------|---------|------|-------|--------|
| **Business Direct** | `/register` | Supabase Auth | auth.user + business + profile | Free (default) | ❌ No | ✅ Active |
| **Partner Request** | `/partner-registration` | Form submit | registration_request | User preference | ❌ No | ✅ Active |
| **Admin Manual** | Admin panel | Admin create | admin_user | N/A | N/A | ✅ Active |
| **End User** | `/signup` | Disabled | N/A | N/A | N/A | ❌ Disabled |

---

### Account Types Summary

| Type | Count | Registration | Features |
|------|-------|--------------|----------|
| **Business** | 1 | Direct/Request | Dashboard, Services, Blog, Analytics |
| **Admin** | 0 | Manual | Admin panel, Full permissions |
| **Registration Request** | 0 | Form | Pending approval |
| **End User** | 0 | Disabled | N/A |

---

### Issues Summary

**Critical:**
1. ❌ Trial 30 ngày chưa được implement
2. ⚠️ Payment flow có duplicate logic
3. ⚠️ Package lookup missing trong một context

**Medium:**
4. ⚠️ Registration không set expiry date
5. ⚠️ Membership_packages table không có tier column

**Low:**
6. ⚠️ Payment gateway missing
7. ⚠️ Admin approval flow cần verify

---

## 🎯 9. KHUYẾN NGHỊ TRIAL 30 NGÀY

### Implementation Plan:

**Phase 1: Database & Registration**
- [ ] Update registration flow: Set `membership_tier = 'Premium'`
- [ ] Set `membership_expiry_date = now() + 30 days`
- [ ] Verify business creation trigger/function

**Phase 2: Expiry Check**
- [ ] Add expiry check function
- [ ] Add cron job hoặc check on access
- [ ] Auto-downgrade sau expiry

**Phase 3: UI**
- [ ] Show trial countdown trong dashboard
- [ ] Show warning notifications
- [ ] Show upgrade prompt

**Phase 4: Testing**
- [ ] Test registration với trial
- [ ] Test expiry check
- [ ] Test downgrade flow

---

**END OF REGISTRATION FLOWS REPORT**
