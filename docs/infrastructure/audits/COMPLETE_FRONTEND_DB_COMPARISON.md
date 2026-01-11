# BÁO CÁO SO SÁNH HOÀN CHỈNH: FRONTEND vs DATABASE THỰC TẾ

**Ngày tạo:** 2025-01-11  
**Nguồn Database:** Supabase (thực tế, đọc trực tiếp)  
**Nguồn Frontend:** Code trong `contexts/`, `pages/`, `lib/`  
**Mục đích:** Tìm ra TẤT CẢ các vấn đề khiến ứng dụng không hoạt động đúng

---

## ✅ XÁC NHẬN ĐỌC ĐƯỢC DATABASE THỰC TẾ

- ✅ **24 bảng** với đầy đủ columns
- ✅ **15 RPC functions**
- ✅ **50+ RLS policies**
- ✅ **20+ foreign keys**
- ✅ **12 enum types**

**Nguồn:** Supabase MCP (Model Context Protocol) - Đọc trực tiếp từ database

---

## 🔍 PHÂN TÍCH CHI TIẾT TỪNG QUERY

### 1. ❌ **CRITICAL: `orders` Table - Columns Không Tồn Tại**

#### Query Location:
- `contexts/BusinessContext.tsx:121`
- `contexts/BusinessBlogDataContext.tsx:85`

#### Frontend Query:
```typescript
supabase.from('orders')
  .select('id, business_id, package_id, customer_name, customer_email, customer_phone, total_amount, status, submitted_at, notes')
```

#### Database Thực Tế (từ Supabase):
```sql
-- Table: orders
id UUID
business_id BIGINT
business_name TEXT (nullable)
package_id TEXT (nullable)
package_name TEXT (nullable)
amount DOUBLE PRECISION (nullable)  -- ❌ KHÔNG PHẢI total_amount
status order_status
payment_method TEXT (nullable)
submitted_at TIMESTAMPTZ (nullable)
confirmed_at TIMESTAMPTZ (nullable)
notes TEXT (nullable)
```

#### ❌ VẤN ĐỀ:
1. **`total_amount`** → ❌ KHÔNG TỒN TẠI → Phải dùng `amount`
2. **`customer_name`** → ❌ KHÔNG TỒN TẠI → Không có trong orders table
3. **`customer_email`** → ❌ KHÔNG TỒN TẠI → Không có trong orders table
4. **`customer_phone`** → ❌ KHÔNG TỒN TẠI → Không có trong orders table

**Lưu ý:** `customer_name`, `customer_email`, `customer_phone` tồn tại trong `appointments` table, KHÔNG phải `orders` table.

#### ✅ FIX:
```typescript
// SỬA THÀNH:
supabase.from('orders')
  .select('id, business_id, package_id, package_name, amount, status, payment_method, submitted_at, confirmed_at, notes')
```

---

### 2. ❌ **CRITICAL: `registration_requests` Table - Columns Không Tồn Tại**

#### Query Location:
- `contexts/AdminPlatformContext.tsx:79`
- `contexts/AdminContext.tsx:328`

#### Frontend Query:
```typescript
supabase.from('registration_requests')
  .select('id, business_name, email, phone, address, city, district, categories, submitted_at, status, notes')
```

#### Database Thực Tế (từ Supabase):
```sql
-- Table: registration_requests
id UUID
business_name TEXT NOT NULL
email TEXT NOT NULL
phone TEXT NOT NULL
category business_category (nullable)  -- ❌ SINGULAR, KHÔNG PHẢI categories
address TEXT (nullable)
tier membership_tier (nullable)
status TEXT (nullable)  -- CHECK: 'Pending', 'Approved', 'Rejected'
submitted_at TIMESTAMPTZ (nullable)
```

#### ❌ VẤN ĐỀ:
1. **`city`** → ❌ KHÔNG TỒN TẠI
2. **`district`** → ❌ KHÔNG TỒN TẠI
3. **`categories`** → ❌ KHÔNG TỒN TẠI → Phải dùng `category` (singular)
4. **`notes`** → ❌ KHÔNG TỒN TẠI

#### ✅ FIX:
```typescript
// SỬA THÀNH:
supabase.from('registration_requests')
  .select('id, business_name, email, phone, address, category, tier, submitted_at, status')
```

---

### 3. ❌ **CRITICAL: `page_content` Table - Column Không Tồn Tại**

#### Query Location:
- `contexts/AdminPlatformContext.tsx:83`
- `contexts/AdminContext.tsx:332`

#### Frontend Query:
```typescript
supabase.from('page_content')
  .select('id, page_name, content_data')
```

#### Database Thực Tế (từ Supabase):
```sql
-- Table: page_content
page_name TEXT PRIMARY KEY  -- ❌ KHÔNG CÓ id column
content_data JSONB (nullable)
```

#### ❌ VẤN ĐỀ:
1. **`id`** → ❌ KHÔNG TỒN TẠI → Primary key là `page_name`, không phải `id`

#### ✅ FIX:
```typescript
// SỬA THÀNH:
supabase.from('page_content')
  .select('page_name, content_data')
```

---

### 4. ⚠️ **WARNING: `orders` Table - RLS Policy Risk**

#### Query Location:
- `contexts/BusinessContext.tsx:121`
- `contexts/OrderDataContext.tsx:24`

#### Frontend Query:
```typescript
// BusinessContext.tsx:121
supabase.from('orders')
  .select('...')
  .order('submitted_at', { ascending: false })

// OrderDataContext.tsx:24
supabase.from('orders').select('*').order('submitted_at', { ascending: false })
```

#### RLS Policy Thực Tế (từ Supabase):
```sql
-- Policy: "Business owners view orders"
-- SELECT: business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
```

#### ⚠️ VẤN ĐỀ:
- Query không filter theo `business_id` → RLS sẽ tự động filter
- Nếu user không phải business owner → Query sẽ trả về empty array
- **Risk:** BusinessContext có thể không lấy được orders nếu user không phải owner

#### ✅ RECOMMENDATION:
- Verify RLS policy hoạt động đúng
- Consider adding explicit `.eq('business_id', businessId)` filter for clarity

---

### 5. ✅ **VERIFIED OK: Các Queries Khác**

#### `businesses` Table:
- ✅ All columns exist
- ✅ Queries match schema

#### `profiles` Table:
- ✅ All columns exist
- ✅ Queries match schema

#### `blog_posts` Table:
- ✅ All columns exist
- ✅ Queries match schema

#### `business_blog_posts` Table:
- ✅ All columns exist
- ✅ Queries match schema

#### `reviews` Table:
- ✅ All columns exist
- ✅ Queries match schema

#### `appointments` Table:
- ✅ All columns exist
- ✅ Queries match schema

#### `services`, `deals`, `team_members`, `media_items`:
- ✅ All columns exist
- ✅ Queries match schema

---

## 📊 TỔNG KẾT VẤN ĐỀ

### ❌ CRITICAL ISSUES (Phải sửa ngay):

1. **`orders.total_amount`** → Sửa thành `orders.amount`
2. **`orders.customer_name`** → Xóa (không tồn tại)
3. **`orders.customer_email`** → Xóa (không tồn tại)
4. **`orders.customer_phone`** → Xóa (không tồn tại)
5. **`registration_requests.city`** → Xóa (không tồn tại)
6. **`registration_requests.district`** → Xóa (không tồn tại)
7. **`registration_requests.categories`** → Sửa thành `category` (singular)
8. **`registration_requests.notes`** → Xóa (không tồn tại)
9. **`page_content.id`** → Xóa (không tồn tại, dùng `page_name`)

### ⚠️ WARNINGS (Cần verify):

1. **`orders` RLS policy** - Cần verify business owner access
2. **Missing columns in TypeScript interfaces** - Cần update `types.ts`

---

## 🔧 FIX PLAN

### Priority 1: Fix `orders` Table Queries

**Files to fix:**
- `contexts/BusinessContext.tsx:121`
- `contexts/BusinessBlogDataContext.tsx:85`

**Change:**
```typescript
// FROM:
.select('id, business_id, package_id, customer_name, customer_email, customer_phone, total_amount, status, submitted_at, notes')

// TO:
.select('id, business_id, package_id, package_name, amount, status, payment_method, submitted_at, confirmed_at, notes')
```

### Priority 2: Fix `registration_requests` Table Queries

**Files to fix:**
- `contexts/AdminPlatformContext.tsx:79`
- `contexts/AdminContext.tsx:328`

**Change:**
```typescript
// FROM:
.select('id, business_name, email, phone, address, city, district, categories, submitted_at, status, notes')

// TO:
.select('id, business_name, email, phone, address, category, tier, submitted_at, status')
```

### Priority 3: Fix `page_content` Table Queries

**Files to fix:**
- `contexts/AdminPlatformContext.tsx:83`
- `contexts/AdminContext.tsx:332`

**Change:**
```typescript
// FROM:
.select('id, page_name, content_data')

// TO:
.select('page_name, content_data')
```

### Priority 4: Update TypeScript Interfaces

**File to fix:**
- `types.ts`

**Changes needed:**
- Update `Order` interface: Remove `total_amount`, `customer_name`, `customer_email`, `customer_phone`
- Add `amount`, `package_name`, `payment_method`, `confirmed_at` to `Order` interface
- Update `RegistrationRequest` interface: Remove `city`, `district`, `categories`, `notes`
- Add `category` (singular), `tier` to `RegistrationRequest` interface
- Update `PageContent` interface: Remove `id`, use `page_name` as key

---

## ✅ VERIFICATION CHECKLIST

Sau khi fix, verify:

- [ ] `orders` queries không còn lỗi
- [ ] `registration_requests` queries không còn lỗi
- [ ] `page_content` queries không còn lỗi
- [ ] TypeScript interfaces match database schema
- [ ] RLS policies allow access correctly
- [ ] No runtime SQL errors

---

**END OF COMPLETE COMPARISON REPORT**
