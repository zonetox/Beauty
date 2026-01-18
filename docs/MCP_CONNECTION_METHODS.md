# Phương án kết nối Supabase để chạy SQL trực tiếp

## Project Reference
- **Project Ref:** `fdklazlcbxaiapsnnbqq`
- **Project URL:** https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq

---

## Phương án 1: Supabase CLI (ĐANG THỬ)

### Bước 1: Link project
```bash
supabase link --project-ref fdklazlcbxaiapsnnbqq
```

### Bước 2: Chạy SQL file
```bash
# Chạy file SQL từ local
supabase db remote --linked < SQL_FILE.sql

# Hoặc pipe SQL command
echo "SELECT * FROM businesses LIMIT 5;" | supabase db remote --linked
```

### Bước 3: Hoặc dùng psql qua connection string
```bash
# Lấy connection string từ Dashboard → Settings → Database → Connection String
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
```

---

## Phương án 2: MCP Supabase Server

### Cấu hình hiện tại:
File: `c:\Users\Dell\.cursor\mcp.json`
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq"
    }
  }
}
```

### Status:
- ✅ Cấu hình đã có
- ❌ `list_mcp_resources` trả về empty (có thể MCP Supabase không expose resources dạng này)

### Cần kiểm tra:
- MCP Supabase có tools/functions nào để chạy SQL không?
- Có cần authentication bổ sung không?

---

## Phương án 3: SQL Editor trong Dashboard

1. Mở: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql
2. Paste SQL code
3. Click "Run"

**Ưu điểm:** Nhanh, không cần setup
**Nhược điểm:** Phải làm manual, không tự động hóa

---

## Phương án 4: Edge Function với Service Role

Tạo Edge Function để chạy SQL:

```typescript
// supabase/functions/execute-sql/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { sql } = await req.json();
  
  // Note: Supabase JS client không hỗ trợ raw SQL
  // Phải dùng RPC functions hoặc Postgres client
});
```

**Lưu ý:** Supabase JS client không hỗ trợ raw SQL trực tiếp, phải dùng RPC functions.

---

## Phương án 5: psql với Connection String

1. Lấy connection string từ Dashboard
2. Cài PostgreSQL client nếu chưa có
3. Chạy:
```bash
psql "connection_string_here" -f your_script.sql
```

---

## Recommended: Supabase CLI

**Ưu điểm:**
- ✅ Đã cài đặt
- ✅ Có thể script hóa
- ✅ Tích hợp với MCP/Cursor

**Hướng dẫn sử dụng:**
1. Link project: `supabase link --project-ref fdklazlcbxaiapsnnbqq`
2. Chạy SQL: `supabase db remote --linked < file.sql`
3. Hoặc: `echo "SQL_COMMAND" | supabase db remote --linked`
