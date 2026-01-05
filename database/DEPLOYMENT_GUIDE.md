# Database Deployment Guide

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## ⚠️ QUAN TRỌNG - ĐỌC TRƯỚC KHI CHẠY SQL

### Lỗi Thường Gặp: "relation already exists"

**Nếu bạn gặp lỗi:**
```
ERROR: 42P07: relation "businesses" already exists
```

**Nguyên nhân:**
- Bạn đang chạy `schema_v1.0.sql` hoặc `schema_v1.0_FINAL.sql` trên database **đã có dữ liệu**
- File này dùng cho **fresh install** (database mới/trống)
- Không có `IF NOT EXISTS` nên sẽ lỗi nếu table đã tồn tại

**Giải pháp:**
- ✅ **CHỈ chạy migration script:** `database/migrations/20250105000000_align_to_schema_v1.0.sql`
- ❌ **KHÔNG chạy:** `schema_v1.0.sql` hoặc `schema_v1.0_FINAL.sql` trên database đã có

---

## HƯỚNG DẪN DEPLOY

### Scenario 1: Database Mới (Fresh Install)

**Khi nào dùng:**
- Database hoàn toàn trống (mới tạo)
- Muốn reset toàn bộ database

**File cần chạy:**
```sql
-- Chạy file này:
database/schema_v1.0_FINAL.sql
```

**Lưu ý:**
- File này sẽ DROP và tạo lại tất cả tables
- **MẤT TẤT CẢ DỮ LIỆU** nếu database đã có data

---

### Scenario 2: Database Đã Có Dữ Liệu (Existing Database)

**Khi nào dùng:**
- Database đã có tables và data
- Muốn align structure với schema v1.0
- **Đây là trường hợp phổ biến nhất**

**File cần chạy:**
```sql
-- Chạy file này:
database/migrations/20250105000000_align_to_schema_v1.0.sql
```

**Lưu ý:**
- File này dùng `IF NOT EXISTS` - an toàn cho database đã có
- Không xóa data hiện có
- Chỉ tạo missing tables/columns/indexes
- Có thể chạy nhiều lần (idempotent)

---

### Scenario 3: Đã Chạy Nhầm schema_v1.0.sql

**Nếu bạn đã chạy nhầm `schema_v1.0.sql` trên database đã có:**

**Bước 1:** Kiểm tra xem có lỗi nào không
- Nếu chỉ lỗi "already exists" → Không sao, tiếp tục bước 2
- Nếu có lỗi khác → Cần kiểm tra kỹ hơn

**Bước 2:** Chạy migration script
```sql
-- Chạy file này để align structure:
database/migrations/20250105000000_align_to_schema_v1.0.sql
```

**Bước 3:** Chạy RLS policies (nếu chưa chạy)
```sql
-- Chạy file này:
database/rls_policies_v1.sql
```

**Bước 4:** Chạy Storage policies (nếu chưa chạy)
```sql
-- Chạy file này:
database/storage_policies_v1.sql
```

---

## THỨ TỰ CHẠY SQL (CHO DATABASE ĐÃ CÓ)

**Nếu database đã có dữ liệu, chạy theo thứ tự:**

1. **Migration Script** (align structure)
   ```sql
   database/migrations/20250105000000_align_to_schema_v1.0.sql
   ```

2. **D2 Migration** (data integrity - nếu chưa chạy)
   ```sql
   database/migrations/20250105000001_d2_data_integrity.sql
   ```

3. **RLS Policies**
   ```sql
   database/rls_policies_v1.sql
   ```

4. **Storage Policies**
   ```sql
   database/storage_policies_v1.sql
   ```

---

## KIỂM TRA SAU KHI CHẠY

**Kiểm tra tables đã được tạo:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Kiểm tra RLS đã được enable:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

**Kiểm tra policies đã được tạo:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

---

## TROUBLESHOOTING

### Lỗi: "relation already exists"

**Nguyên nhân:** Đang chạy `schema_v1.0.sql` trên database đã có

**Giải pháp:** Chỉ chạy migration script `20250105000000_align_to_schema_v1.0.sql`

---

### Lỗi: "policy already exists"

**Nguyên nhân:** Đã chạy `rls_policies_v1.sql` trước đó

**Giải pháp:** File này đã có `DROP POLICY IF EXISTS` - chạy lại không sao

---

### Lỗi: "type already exists"

**Nguyên nhân:** Enum đã được tạo trước đó

**Giải pháp:** Migration script dùng `DO $$ BEGIN ... EXCEPTION ... END $$` - an toàn, chạy lại không sao

---

## TÓM TẮT

**Cho database đã có dữ liệu:**
- ✅ Chạy: `migrations/20250105000000_align_to_schema_v1.0.sql`
- ✅ Chạy: `migrations/20250105000001_d2_data_integrity.sql` (nếu chưa)
- ✅ Chạy: `rls_policies_v1.sql`
- ✅ Chạy: `storage_policies_v1.sql`
- ❌ KHÔNG chạy: `schema_v1.0.sql` hoặc `schema_v1.0_FINAL.sql`

**Cho database mới:**
- ✅ Chạy: `schema_v1.0_FINAL.sql`
- ✅ Chạy: `rls_policies_v1.sql`
- ✅ Chạy: `storage_policies_v1.sql`

