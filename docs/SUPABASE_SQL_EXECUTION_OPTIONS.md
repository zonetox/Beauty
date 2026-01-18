# Các Phương Án Chạy SQL Trực Tiếp Trên Supabase

**Project Ref:** `fdklazlcbxaiapsnnbqq`

---

## ✅ Phương án 1: SQL Editor Dashboard (NHANH NHẤT)

**URL:** https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql

**Cách dùng:**
1. Mở link trên
2. Paste SQL code vào editor
3. Click "Run"

**Ví dụ SQL:**
```sql
-- Reset users
DELETE FROM auth.users WHERE email != 'admin@example.com';
DELETE FROM public.profiles;
DELETE FROM public.businesses;
```

**Ưu điểm:**
- ✅ Không cần setup
- ✅ Chạy ngay được
- ✅ Có thể save queries
- ✅ An toàn (có quyền admin)

**Nhược điểm:**
- ❌ Phải làm manual
- ❌ Không tự động hóa được

---

## ⚠️ Phương án 2: Supabase CLI (CẦN FIX PRIVILEGES)

**Hiện trạng:**
- ✅ CLI đã cài: v2.33.7 (có v2.72.7 mới hơn)
- ❌ Link project bị lỗi privilege
- ❌ Projects list không có project `fdklazlcbxaiapsnnbqq`

**Lệnh thử:**
```bash
# Link project
supabase link --project-ref fdklazlcbxaiapsnnbqq

# Chạy SQL file
supabase db remote --linked < database/reset_users_quick.sql

# Hoặc pipe SQL
echo "SELECT COUNT(*) FROM businesses;" | supabase db remote --linked
```

**Cần fix:**
1. Kiểm tra account có quyền truy cập project `fdklazlcbxaiapsnnbqq` không
2. Thử login lại: `supabase login`
3. Kiểm tra project ref có đúng không

---

## 🔍 Phương án 3: MCP Supabase Server

**Cấu hình hiện tại:**
- ✅ File: `c:\Users\Dell\.cursor\mcp.json`
- ✅ URL: `https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq`
- ❌ `list_mcp_resources` trả về empty

**Kiểm tra cần làm:**
1. MCP Supabase có expose **tools** không? (không phải resources)
2. Có cần authentication OAuth không?
3. Có thể gọi function `execute_sql` hoặc tương tự không?

**Note:** MCP có thể có tools để chạy SQL, nhưng cần kiểm tra documentation của MCP Supabase.

---

## 🔧 Phương án 4: psql với Connection String

**Bước 1:** Lấy connection string
- Dashboard → Settings → Database → Connection String
- Copy "Direct connection" hoặc "Session pooler"

**Bước 2:** Cài PostgreSQL client (nếu chưa có)
```powershell
# Windows - dùng Scoop hoặc download
# hoặc dùng WSL với Ubuntu
```

**Bước 3:** Chạy SQL
```bash
# Chạy file SQL
psql "connection_string" -f database/reset_users_quick.sql

# Hoặc interactive
psql "connection_string"
# Sau đó gõ SQL
```

**Lưu ý:** Cần password database từ Dashboard.

---

## 🚀 Phương án 5: Edge Function với Service Role (KHÔNG KHUYẾN NGHỊ)

**Lý do không khuyến nghị:**
- Supabase JS client không hỗ trợ raw SQL
- Phải tạo RPC function trước → phức tạp hơn
- Chỉ dùng khi cần integrate vào app flow

**Nếu vẫn muốn dùng:**
1. Tạo RPC function trong SQL:
```sql
CREATE OR REPLACE FUNCTION execute_sql(sql_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
  RETURN json_build_object('success', true);
END;
$$;
```

2. Gọi từ Edge Function:
```typescript
const { data } = await supabase.rpc('execute_sql', { sql_text: 'SQL HERE' });
```

---

## 📋 RECOMMENDED WORKFLOW

**Cho mục đích hiện tại (reset users, fix security):**

1. **Dùng SQL Editor Dashboard** (nhanh nhất)
   - Mở: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql
   - Copy SQL từ file `database/reset_users_quick.sql`
   - Paste và Run

2. **Nếu cần tự động hóa sau này:**
   - Fix Supabase CLI privileges
   - Hoặc setup psql với connection string
   - Hoặc tìm MCP Supabase tools documentation

---

## 🔐 Security Note

**Quan trọng:**
- ✅ **KHÔNG** commit connection strings hoặc service role keys vào git
- ✅ Chỉ dùng SQL Editor Dashboard hoặc CLI khi đã authenticated
- ✅ Backup database trước khi chạy DELETE/UPDATE queries

---

## Next Steps

1. **Thử ngay:** SQL Editor Dashboard
2. **Kiểm tra:** MCP Supabase có tools/functions nào không
3. **Fix CLI:** Nếu cần tự động hóa, fix Supabase CLI privileges
