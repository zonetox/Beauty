# 🔒 Quy trình Phát triển Database - Bắt buộc tuân thủ

**Date:** 2025-01-11  
**Status:** MANDATORY - Tất cả developers phải tuân thủ

---

## ⚠️ QUY TẮC TUYỆT ĐỐI

### 1. Database Schema là Single Source of Truth

**Tài liệu database trong `/docs/infrastructure/database/` là DUY NHẤT và CHÍNH XÁC:**
- `schema.md` - Tables và columns
- `relations.md` - Foreign keys
- `enums.md` - Enum types
- `rls.md` - RLS policies
- `functions.md` - RPC functions và triggers
- `limitations.md` - Những gì database KHÔNG hỗ trợ

**❌ KHÔNG BAO GIỜ:**
- Giả định tables/columns không có trong docs
- Suy diễn relations không được document
- Tạo code dựa trên assumptions

**✅ LUÔN LUÔN:**
- Đọc database docs TRƯỚC KHI viết code
- Sử dụng đúng tên columns như trong docs
- Tuân thủ RLS policies được document

---

## 📋 QUY TRÌNH PHÁT TRIỂN TÍNH NĂNG MỚI

### Bước 1: Đọc Database Docs (BẮT BUỘC)

**Trước khi code bất kỳ tính năng nào:**

1. ✅ Đọc `docs/infrastructure/database/schema.md`
   - Kiểm tra tables có sẵn
   - Kiểm tra columns và data types
   - Kiểm tra nullable và defaults

2. ✅ Đọc `docs/infrastructure/database/relations.md`
   - Kiểm tra foreign keys
   - Hiểu relationships giữa tables

3. ✅ Đọc `docs/infrastructure/database/rls.md`
   - Kiểm tra RLS policies
   - Đảm bảo queries tuân thủ policies

4. ✅ Đọc `docs/infrastructure/database/functions.md`
   - Kiểm tra RPC functions có sẵn
   - Kiểm tra triggers

5. ✅ Đọc `docs/infrastructure/database/limitations.md`
   - Hiểu những gì database KHÔNG hỗ trợ
   - Tránh assumptions sai

---

### Bước 2: Quyết định - Cần thêm Database không?

#### Option A: Database đã có đủ (Không cần thêm)

**Nếu database đã có tables/columns cần thiết:**
- ✅ Sử dụng đúng tên columns từ `schema.md`
- ✅ Sử dụng đúng data types
- ✅ Tuân thủ RLS policies
- ✅ Viết code ngay

**Ví dụ:**
```typescript
// ✅ ĐÚNG - Sử dụng columns từ schema.md
const { data } = await supabase
  .from('businesses')
  .select('id, name, email, membership_tier, membership_expiry_date, is_active')
  .eq('slug', slug)
  .single();
```

---

#### Option B: Cần thêm Database (Migration cần thiết)

**Nếu cần thêm tables/columns/functions:**

**⚠️ QUY TRÌNH BẮT BUỘC:**

1. **Tạo Migration SQL:**
   ```sql
   -- migrations/YYYYMMDDHHMMSS_add_feature_name.sql
   CREATE TABLE IF NOT EXISTS new_table (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     column_name data_type NOT NULL,
     ...
   );
   ```

2. **Apply Migration:**
   - Chạy migration trong Supabase SQL Editor
   - Verify migration thành công

3. **Cập nhật Database Docs (BẮT BUỘC):**
   - ✅ Update `schema.md` - Thêm table/columns mới
   - ✅ Update `relations.md` - Thêm foreign keys mới (nếu có)
   - ✅ Update `enums.md` - Thêm enum types mới (nếu có)
   - ✅ Update `rls.md` - Thêm RLS policies mới
   - ✅ Update `functions.md` - Thêm functions/triggers mới
   - ✅ Update `limitations.md` - Nếu có thay đổi limitations

4. **Verify Docs chính xác:**
   - Đọc lại từ Supabase database
   - So sánh với docs
   - Đảm bảo 100% match

5. **Sau đó mới viết code:**
   - Sử dụng schema mới từ docs đã update
   - Tuân thủ RLS policies mới
   - Test kỹ

---

### Bước 3: Cập nhật Database Docs (Khi có thay đổi)

**Khi nào cần update docs:**
- ✅ Thêm table mới
- ✅ Thêm column mới
- ✅ Thêm foreign key mới
- ✅ Thêm enum mới
- ✅ Thêm RLS policy mới
- ✅ Thêm function/trigger mới
- ✅ Thay đổi data type
- ✅ Thay đổi nullable/default

**Cách update docs:**

#### 3.1. Update schema.md

**Thêm table mới:**
```markdown
## Table: `new_table_name`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `column_name` | text | NOT NULL | - | - |
```

**Thêm column vào table có sẵn:**
```markdown
## Table: `existing_table`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| ... existing columns ...
| `new_column` | text | NULL | - | **NEW** - Added for feature X |
```

#### 3.2. Update relations.md

**Thêm foreign key:**
```markdown
## Table: `new_table`
- `business_id` REFERENCES `public.businesses(id)`
```

#### 3.3. Update enums.md

**Thêm enum:**
```markdown
## Enum: `new_enum_type`
- `Value1`
- `Value2`
- `Value3`
```

#### 3.4. Update rls.md

**Thêm RLS policy:**
```markdown
## Table: `new_table`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `policy_name` | `public` | `condition` |
```

#### 3.5. Update functions.md

**Thêm function:**
```markdown
### Function: `new_function_name`
- **Type:** FUNCTION
- **Return Type:** `return_type`
- **Definition:**
  ```sql
  CREATE FUNCTION new_function_name(...)
  ...
  ```
```

#### 3.6. Update limitations.md

**Nếu có thay đổi:**
```markdown
## New Limitations (Updated: YYYY-MM-DD)
- Feature X không được hỗ trợ vì...
```

---

## 🔄 QUY TRÌNH CẬP NHẬT DOCS TỪ DATABASE

### Khi nào cần chạy update docs:

1. **Sau khi apply migration**
2. **Khi phát hiện docs không khớp với database**
3. **Trước khi bắt đầu feature mới** (để đảm bảo docs chính xác)

### Cách update docs từ Supabase:

**Option 1: Sử dụng Supabase MCP (Recommended)**

```typescript
// Sử dụng MCP tools để đọc database schema
// Tự động generate docs từ database thực tế
```

**Option 2: Manual Update**

1. Vào Supabase Dashboard → Database → Tables
2. Đọc schema từng table
3. Update docs theo đúng format
4. Verify với database thực tế

---

## ✅ CHECKLIST TRƯỚC KHI CODE

### Pre-Development:

- [ ] Đã đọc `schema.md` cho tables liên quan
- [ ] Đã đọc `relations.md` cho foreign keys
- [ ] Đã đọc `rls.md` cho RLS policies
- [ ] Đã đọc `functions.md` cho RPC functions
- [ ] Đã đọc `limitations.md` để tránh assumptions

### Nếu cần thêm database:

- [ ] Đã tạo migration SQL
- [ ] Đã apply migration trong Supabase
- [ ] Đã verify migration thành công
- [ ] Đã update `schema.md`
- [ ] Đã update `relations.md` (nếu có FK)
- [ ] Đã update `enums.md` (nếu có enum)
- [ ] Đã update `rls.md` (nếu có RLS)
- [ ] Đã update `functions.md` (nếu có function)
- [ ] Đã update `limitations.md` (nếu cần)
- [ ] Đã verify docs khớp với database thực tế

### Code Development:

- [ ] Sử dụng đúng tên columns từ `schema.md`
- [ ] Sử dụng đúng data types
- [ ] Tuân thủ RLS policies
- [ ] Không có placeholder code
- [ ] Code hoàn thiện, không có TODO/FIXME

---

## 🚫 CẤM TUYỆT ĐỐI

### ❌ KHÔNG BAO GIỜ:

1. **Giả định tables/columns không có trong docs**
   ```typescript
   // ❌ SAI - Column không có trong schema.md
   .select('id, name, assumed_column')
   ```

2. **Suy diễn relations không được document**
   ```typescript
   // ❌ SAI - Relation không có trong relations.md
   .select('businesses(*, users(*))')
   ```

3. **Bỏ qua RLS policies**
   ```typescript
   // ❌ SAI - Không check RLS policy
   // Phải đọc rls.md và tuân thủ
   ```

4. **Tạo code trước khi update docs**
   ```typescript
   // ❌ SAI - Code trước, docs sau
   // ✅ ĐÚNG - Docs trước, code sau
   ```

5. **Để placeholder code**
   ```typescript
   // ❌ SAI
   // TODO: Implement this
   // FIXME: This is a placeholder
   
   // ✅ ĐÚNG
   // Code hoàn thiện, không có placeholder
   ```

6. **Update database mà không update docs**
   ```sql
   -- ❌ SAI - Thêm column mà không update schema.md
   ALTER TABLE businesses ADD COLUMN new_column text;
   ```

---

## 📝 VÍ DỤ QUY TRÌNH ĐÚNG

### Scenario: Thêm tính năng "Business Reviews"

#### Step 1: Đọc Database Docs

1. Đọc `schema.md` → Tìm table `reviews`
2. Đọc `relations.md` → Tìm FK `reviews.business_id`
3. Đọc `rls.md` → Tìm RLS policies cho `reviews`
4. Đọc `functions.md` → Tìm functions liên quan

**Kết quả:** Database đã có table `reviews` với đầy đủ columns và RLS policies.

#### Step 2: Viết Code

```typescript
// ✅ ĐÚNG - Sử dụng columns từ schema.md
const { data } = await supabase
  .from('reviews')
  .select('id, business_id, user_name, rating, comment, submitted_date, status')
  .eq('business_id', businessId)
  .eq('status', 'Visible')
  .order('submitted_date', { ascending: false });
```

---

### Scenario: Thêm tính năng "Business Analytics" (Cần table mới)

#### Step 1: Đọc Database Docs

1. Đọc `schema.md` → Không có table `analytics`
2. Đọc `limitations.md` → Không có mention về analytics

**Kết quả:** Cần tạo table mới.

#### Step 2: Tạo Migration

```sql
-- migrations/20250111120000_add_business_analytics.sql
CREATE TABLE IF NOT EXISTS business_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id bigint NOT NULL REFERENCES businesses(id),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  recorded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_business_analytics_business_id ON business_analytics(business_id);
CREATE INDEX idx_business_analytics_recorded_at ON business_analytics(recorded_at);

-- RLS Policies
ALTER TABLE business_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their analytics"
  ON business_analytics FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));
```

#### Step 3: Apply Migration

- Chạy trong Supabase SQL Editor
- Verify thành công

#### Step 4: Update Database Docs (BẮT BUỘC)

**Update `schema.md`:**
```markdown
## Table: `business_analytics`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NOT NULL | - | Foreign key to `businesses.id` |
| `metric_name` | text | NOT NULL | - | - |
| `metric_value` | numeric | NOT NULL | - | - |
| `recorded_at` | timestamp with time zone | NULL | `now()` | - |
| `created_at` | timestamp with time zone | NULL | `now()` | - |
```

**Update `relations.md`:**
```markdown
## Table: `business_analytics`
- `business_id` REFERENCES `public.businesses(id)`
```

**Update `rls.md`:**
```markdown
## Table: `business_analytics`

**RLS Enabled:** Yes

| Operation | Policy Name | Allowed Roles | Condition |
|-----------|-------------|---------------|-----------|
| SELECT | `Business owners can view their analytics` | `public` | `business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())` |
```

#### Step 5: Verify Docs

- Đọc lại từ Supabase database
- So sánh với docs
- Đảm bảo 100% match

#### Step 6: Viết Code

```typescript
// ✅ ĐÚNG - Sử dụng columns từ schema.md đã update
const { data } = await supabase
  .from('business_analytics')
  .select('id, business_id, metric_name, metric_value, recorded_at')
  .eq('business_id', businessId)
  .order('recorded_at', { ascending: false });
```

---

## 🔍 VERIFICATION PROCESS

### Sau khi update docs, luôn verify:

1. **Schema Verification:**
   ```sql
   -- Check table exists
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'new_table';
   
   -- Check columns
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'new_table';
   ```

2. **Relations Verification:**
   ```sql
   -- Check foreign keys
   SELECT * FROM information_schema.table_constraints
   WHERE table_name = 'new_table' AND constraint_type = 'FOREIGN KEY';
   ```

3. **RLS Verification:**
   ```sql
   -- Check RLS enabled
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public' AND tablename = 'new_table';
   
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'new_table';
   ```

4. **Functions Verification:**
   ```sql
   -- Check functions
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_name = 'new_function';
   ```

---

## 📚 TÀI LIỆU THAM KHẢO

### Database Documentation Location:

```
/docs/infrastructure/database/
├── schema.md          # Tables & columns (READ FIRST)
├── relations.md       # Foreign keys
├── enums.md           # Enum types
├── rls.md             # RLS policies
├── functions.md       # RPC functions & triggers
└── limitations.md     # What DB does NOT support
```

### Contract Documentation:

```
/docs/infrastructure/contracts/
├── frontend-db-contract.md  # What frontend can read/write
├── public-data.md          # Publicly accessible data
└── protected-data.md       # Auth/owner/admin-only data
```

---

## 🎯 TÓM TẮT QUY TẮC

1. **Đọc docs TRƯỚC KHI code**
2. **Nếu cần thêm database → Migration → Update docs → Code**
3. **Docs phải luôn chính xác và match với database thực tế**
4. **Không có placeholder code**
5. **Tuân thủ RLS policies**
6. **Sử dụng đúng tên columns từ schema.md**

---

## ⚠️ LƯU Ý QUAN TRỌNG

- **Database docs là Single Source of Truth**
- **Mọi thay đổi database PHẢI được reflect trong docs**
- **Docs không chính xác = Code sẽ sai**
- **Placeholder code = Technical debt**

---

**TUÂN THỦ QUY TRÌNH NÀY ĐỂ ĐẢM BẢO CODE CHẤT LƯỢNG VÀ TRÁNH BUGS!**
