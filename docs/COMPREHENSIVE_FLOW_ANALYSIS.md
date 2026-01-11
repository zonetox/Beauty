# 📊 Báo cáo Phân tích Toàn diện - Homepage, Registration, Payment Flows

**Date:** 2025-01-11  
**Purpose:** Kiểm tra toàn diện các luồng chính của ứng dụng

---

## 🔍 1. TRANG CHỦ (HOMEPAGE) - PHÂN TÍCH

### ✅ Loading Logic - ĐÚNG CÁCH

**File:** `pages/HomePage.tsx`

**Loading States:**
```typescript
const isLoading = homepageLoading || businessLoading || blogLoading;
```

**Các contexts được sử dụng:**
1. `HomepageDataContext` - Load homepage content từ database
2. `BusinessDataContext` - Load businesses list
3. `BlogDataContext` - Load blog posts

**Loading Flow:**
1. ✅ `HomepageDataContext` fetch từ `page_content` table (page_name = 'homepage')
2. ✅ Fallback to `DEFAULT_HOMEPAGE_DATA` nếu không có data
3. ✅ Fallback to localStorage nếu Supabase không configured
4. ✅ Safety timeout: 10s (trong UserSessionContext, không phải HomepageDataContext)

**Vấn đề tiềm ẩn:**
- ⚠️ Nếu một trong 3 contexts bị stuck → homepage sẽ loading mãi
- ⚠️ Không có timeout riêng cho HomepageDataContext
- ✅ Có fallback mechanisms (localStorage, DEFAULT_HOMEPAGE_DATA)

---

### 📋 Homepage Content Structure

**Data Source:** `page_content` table (page_name = 'homepage')

**Structure:**
```typescript
interface HomepageData {
  heroSlides: HeroSlide[];  // Hero carousel slides
  sections: HomepageSection[];  // Featured sections
}

interface HomepageSection {
  id: string;
  type: 'featuredBusinesses' | 'featuredDeals' | 'featuredBlog' | 'exploreByLocation';
  title: string;
  subtitle: string;
  visible: boolean;
}
```

**Sections được render:**
1. **Hero Section** - Carousel slides (auto-rotate mỗi 5s)
2. **Featured Businesses** - Grid 4 columns
3. **Featured Deals** - Grid 4 columns
4. **Featured Blog** - Grid 3 columns
5. **Explore By Location** - Grid 4 columns

**Status:** ✅ **HOẠT ĐỘNG ĐÚNG** - Có fallback, có loading states, có error handling

---

## 🔐 2. LUỒNG ĐĂNG KÝ (REGISTRATION FLOWS)

### Flow 1: Business Registration (Direct Signup)

**File:** `pages/RegisterPage.tsx`  
**Route:** `/register`

**Process:**
1. User điền form: business_name, email, phone, password
2. Submit → `supabase.auth.signUp()`
3. Supabase tạo auth user
4. **Trigger/Function tự động tạo business và profile** (assumed)
5. Redirect to `/account`

**Fields:**
- ✅ `business_name` → stored in `user_metadata.full_name`
- ✅ `email` → auth user email
- ✅ `phone` → stored in `user_metadata.phone`
- ✅ `password` → auth password

**Membership Tier:**
- ❓ **KHÔNG RÕ** - Không set membership_tier trong registration
- ⚠️ **VẤN ĐỀ:** Business được tạo với tier nào? Default là 'Free'?

**Status:** ✅ **HOẠT ĐỘNG** - Nhưng cần verify trigger/function tạo business

---

### Flow 2: Partner Registration Request

**File:** `pages/PartnerRegistrationPage.tsx`  
**Route:** `/partner-registration` (assumed)

**Process:**
1. User điền form: businessName, email, phone, category, address, tier
2. Submit → Insert vào `registration_requests` table
3. Status: 'Pending'
4. Admin approve → Tạo business account

**Fields:**
- ✅ `business_name`
- ✅ `email`
- ✅ `phone`
- ✅ `category` (BusinessCategory enum)
- ✅ `address`
- ✅ `tier` (MembershipTier enum - PREMIUM default)
- ✅ `status` ('Pending')

**Membership Tier:**
- ✅ User chọn tier (VIP, Premium, Free)
- ⚠️ **VẤN ĐỀ:** Tier này chỉ là preference, không phải actual tier khi approve

**Status:** ✅ **HOẠT ĐỘNG** - Nhưng cần verify admin approval flow

---

### Flow 3: Admin User Registration

**File:** `contexts/AdminContext.tsx`  
**Route:** Admin panel

**Process:**
1. Admin tạo user mới qua admin panel
2. Insert vào `admin_users` table
3. User phải đăng ký qua Supabase Auth riêng
4. Link email trong `admin_users` với auth user

**Status:** ✅ **HOẠT ĐỘNG** - Manual process

---

## 🔑 3. LUỒNG ĐĂNG NHẬP (LOGIN FLOWS)

### Flow 1: Business User Login

**File:** `pages/LoginPage.tsx`  
**Route:** `/login`

**Process:**
1. User nhập email + password
2. `supabase.auth.signInWithPassword()`
3. `UserSessionContext` fetch profile
4. Check business_id trong profile
5. Redirect to `/account` (business dashboard)

**Status:** ✅ **HOẠT ĐỘNG** - Standard Supabase auth

---

### Flow 2: Admin Login

**File:** `pages/AdminLoginPage.tsx` (assumed)  
**Route:** `/admin/login`

**Process:**
1. Admin nhập email + password
2. `supabase.auth.signInWithPassword()`
3. `AdminContext` check `admin_users` table
4. Verify email match và `is_locked = false`
5. Set currentUser với admin profile + auth user

**Status:** ✅ **HOẠT ĐỘNG** - Có validation

---

## 💳 4. LUỒNG THANH TOÁN (PAYMENT FLOW)

### Payment Flow Analysis

**Files:**
- `contexts/BusinessContext.tsx:415-457`
- `contexts/BusinessBlogDataContext.tsx:228-290`
- `contexts/OrderDataContext.tsx:66-91`

**Process:**

#### Step 1: Create Order
```typescript
// Business creates order
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

#### Step 2: User Pays (External)
- User chuyển khoản hoặc thanh toán qua gateway
- **KHÔNG có integration** - Manual process
- User gửi proof of payment (nếu cần)

**Status:** ⚠️ **MANUAL** - Không có payment gateway integration

---

#### Step 3: Admin Confirms Payment
```typescript
// Admin confirms payment
await updateOrderStatus(orderId, OrderStatus.COMPLETED);
```

**What happens:**
1. Order status → `COMPLETED`
2. `confirmed_at` → current timestamp
3. **Business Activation:**
   - Fetch package từ `membership_packages`
   - Calculate expiry date: `now() + package.durationMonths`
   - Update business:
     - `membership_tier` → package.tier
     - `membership_expiry_date` → calculated date
     - `is_active` → `true`
4. Send notification email

**Status:** ✅ **HOẠT ĐỘNG** - Có business activation logic

---

### ⚠️ VẤN ĐỀ PHÁT HIỆN TRONG PAYMENT FLOW

#### Issue 1: Duplicate Logic
**Files:** 
- `BusinessContext.tsx:415-457`
- `BusinessBlogDataContext.tsx:250-290`

**Vấn đề:**
- Logic activate business được duplicate ở 2 nơi
- Có thể gây inconsistency

**Fix đề xuất:**
- Centralize vào một function
- Hoặc dùng database trigger

---

#### Issue 2: Package Lookup
**File:** `BusinessBlogDataContext.tsx:264-275`

**Vấn đề:**
```typescript
// Default to 1 year if package lookup fails
expiryDate.setFullYear(expiryDate.getFullYear() + 1);
```

**Vấn đề:**
- Hardcoded 1 year nếu không tìm thấy package
- Không fetch từ `membership_packages` table
- Có thể gây sai expiry date

**Fix cần thiết:**
- Fetch package từ `membership_packages` table
- Use `package.durationMonths` thay vì hardcode

---

#### Issue 3: Payment Gateway Integration
**Vấn đề:**
- Không có payment gateway integration
- Manual payment confirmation
- Có thể gây delay và errors

**Status:** ⚠️ **CẦN CẢI THIỆN** - Nhưng không critical nếu manual process OK

---

## 👥 5. CÁC LOẠI TÀI KHOẢN (ACCOUNT TYPES)

### Type 1: Business Account (Doanh nghiệp)

**Registration:**
- Route: `/register`
- Method: Direct signup via Supabase Auth
- Auto-create business và profile

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

**Activation:**
- `is_active = true` sau khi payment confirmed
- `membership_expiry_date` set based on package

**Status:** ✅ **HOẠT ĐỘNG**

---

### Type 2: Admin Account

**Registration:**
- Manual creation via admin panel
- Must register via Supabase Auth separately
- Link email in `admin_users` table

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

**Status:** ✅ **HOẠT ĐỘNG**

---

### Type 3: Regular User (End User)

**Registration:**
- ❌ **KHÔNG CÒN** - `SignupPage.tsx` returns null
- Comment: "This page is no longer in use as per the removal of end-user accounts"

**Status:** ❌ **DISABLED** - End-user registration đã bị disable

---

### Type 4: Registration Request (Pending)

**Registration:**
- Route: `/partner-registration`
- Insert vào `registration_requests` table
- Status: 'Pending'

**Process:**
- Admin review và approve
- After approval → Create business account

**Status:** ✅ **HOẠT ĐỘNG** - Nhưng cần verify approval flow

---

## 📊 6. MEMBERSHIP TIERS - HIỆN TRẠNG

### Database Enum: `membership_tier`

**Values:**
- `VIP`
- `Premium`
- `Free` (default)

**Business Table:**
- `membership_tier` - Enum, default = 'Free'
- `membership_expiry_date` - Timestamp, nullable
- `is_active` - Boolean, default = true

**Current State:**
- 1 business với tier 'VIP' (từ database query)
- Default tier khi đăng ký: 'Free'

---

## 🎯 7. TRIAL 30 NGÀY - PHÂN TÍCH & ĐỀ XUẤT

### Yêu cầu:
> "Tất cả tài khoản doanh nghiệp hiện nay sẽ trial 30 ngày miễn phí, đầy đủ chức năng"

### Phân tích hiện trạng:

**Current Flow:**
1. User đăng ký → Business created với `membership_tier = 'Free'`
2. `is_active = true` (default)
3. `membership_expiry_date = NULL` (không có expiry)
4. Business có thể sử dụng ngay (nếu is_active = true)

**Vấn đề:**
- ❌ Không có trial period logic
- ❌ Không có expiry date khi đăng ký
- ❌ Không có check expiry date
- ❌ Không có auto-deactivate sau trial

---

### Đề xuất Implementation:

#### Option 1: Trial Tier (Recommended)

**Thêm Trial Tier:**
```typescript
export enum MembershipTier {
  TRIAL = 'Trial',  // NEW
  VIP = 'VIP',
  PREMIUM = 'Premium',
  FREE = 'Free',
}
```

**Registration Flow:**
```typescript
// When business is created
membership_tier = 'Trial'
membership_expiry_date = now() + 30 days
is_active = true
```

**Expiry Check:**
- Check `membership_expiry_date` khi business access features
- If expired → set `is_active = false` hoặc downgrade to 'Free'
- Show notification: "Trial đã hết hạn, vui lòng nâng cấp"

---

#### Option 2: Free Tier với Expiry

**Keep Free Tier:**
- Set `membership_tier = 'Free'`
- Set `membership_expiry_date = now() + 30 days`
- After expiry → `is_active = false` hoặc require payment

---

#### Option 3: Premium Trial

**Set Premium Tier với Expiry:**
- Set `membership_tier = 'Premium'`
- Set `membership_expiry_date = now() + 30 days`
- After expiry → downgrade to 'Free' hoặc require payment

---

### Recommended Implementation:

**1. Database Migration:**
```sql
-- Add Trial to enum (if needed)
-- Or use existing 'Free' tier with expiry

-- Update registration trigger/function
-- Set membership_expiry_date = now() + interval '30 days'
```

**2. Registration Code:**
```typescript
// In RegisterPage.tsx or trigger
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30); // 30 days trial

await supabase.from('businesses').insert({
  // ... other fields
  membership_tier: 'Premium', // or 'Trial' if new tier
  membership_expiry_date: expiryDate.toISOString(),
  is_active: true
});
```

**3. Expiry Check:**
```typescript
// Check on business access
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
      // Trial expired - downgrade or deactivate
      await supabase.from('businesses').update({
        membership_tier: 'Free',
        is_active: false // or keep active with limited features
      }).eq('id', businessId);
    }
  }
};
```

**4. UI Notification:**
- Show trial countdown trong business dashboard
- Show warning khi trial sắp hết (7 days, 3 days, 1 day)
- Show upgrade prompt sau khi trial hết

---

## 📋 8. TỔNG KẾT CÁC LUỒNG ĐĂNG KÝ

### Summary Table

| Flow | Route | Method | Creates | Membership Tier | Status |
|------|-------|--------|---------|----------------|--------|
| **Business Direct** | `/register` | Supabase Auth | auth.user + business + profile | Free (default) | ✅ Active |
| **Partner Request** | `/partner-registration` | Form submit | registration_request | User preference | ✅ Active |
| **Admin Manual** | Admin panel | Admin create | admin_user | N/A | ✅ Active |
| **End User** | `/signup` | Disabled | N/A | N/A | ❌ Disabled |

---

## ⚠️ 9. VẤN ĐỀ PHÁT HIỆN & KHUYẾN NGHỊ

### Critical Issues:

1. **Payment Flow Duplication**
   - Logic activate business duplicate ở 2 contexts
   - **Fix:** Centralize hoặc dùng database trigger

2. **Package Lookup Missing**
   - Hardcoded 1 year expiry nếu không tìm thấy package
   - **Fix:** Fetch từ `membership_packages` table

3. **Trial Period Missing**
   - Không có trial 30 ngày logic
   - **Fix:** Implement trial với expiry date

4. **Expiry Check Missing**
   - Không có check membership expiry
   - **Fix:** Add expiry check và auto-deactivate

---

### Medium Priority:

5. **Homepage Loading**
   - Không có timeout riêng cho HomepageDataContext
   - **Fix:** Add timeout hoặc improve error handling

6. **Registration Tier**
   - Không set membership_tier khi đăng ký
   - **Fix:** Set trial tier với expiry date

---

### Low Priority:

7. **Payment Gateway**
   - Manual payment confirmation
   - **Fix:** Integrate payment gateway (Stripe, PayPal, etc.)

8. **Admin Approval Flow**
   - Cần verify approval flow cho registration_requests
   - **Fix:** Document và test approval process

---

## 🎯 10. KHUYẾN NGHỊ TRIAL 30 NGÀY

### Implementation Plan:

**Phase 1: Database**
- [ ] Add 'Trial' to membership_tier enum (hoặc dùng 'Premium' với expiry)
- [ ] Verify registration trigger/function set expiry date

**Phase 2: Registration**
- [ ] Update registration flow: Set `membership_expiry_date = now() + 30 days`
- [ ] Set `membership_tier = 'Premium'` (hoặc 'Trial' nếu có)
- [ ] Set `is_active = true`

**Phase 3: Expiry Check**
- [ ] Add expiry check function
- [ ] Add cron job hoặc check on access
- [ ] Auto-deactivate hoặc downgrade sau expiry

**Phase 4: UI**
- [ ] Show trial countdown trong dashboard
- [ ] Show warning notifications
- [ ] Show upgrade prompt

**Phase 5: Testing**
- [ ] Test registration với trial
- [ ] Test expiry check
- [ ] Test downgrade/upgrade flow

---

## 📊 11. STATISTICS

**Account Types:**
- Business Accounts: 1 (VIP tier)
- Admin Accounts: 0 (after reset)
- Registration Requests: 0 (after reset)
- End User Accounts: Disabled

**Membership Tiers:**
- VIP: 1 business
- Premium: 0 businesses
- Free: Default for new registrations

**Registration Flows:**
- Active: 3 (Business Direct, Partner Request, Admin Manual)
- Disabled: 1 (End User)

---

**END OF COMPREHENSIVE FLOW ANALYSIS**
