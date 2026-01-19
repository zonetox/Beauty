# Hướng Dẫn Kích Hoạt MCP Supabase Trong Cursor

## ⚠️ VẤN ĐỀ PHÁT HIỆN

Config MCP hiện tại có **headers trống `{}`** - đây là **VẤN ĐỀ NGHIÊM TRỌNG** vì MCP Supabase cần Personal Access Token để authenticate!

Theo tài liệu troubleshooting (`docs/FIX_MCP_SUPABASE_CONNECTION.md`), headers trống sẽ **ngăn cản MCP authentication**.

## ✅ CONFIG ĐÚNG (ĐÃ CẬP NHẬT)

File `mcp-config.json` đã được cập nhật:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq",
      "headers": {
        "Authorization": "Bearer YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

⚠️ **BẮT BUỘC**: Thay `YOUR_PERSONAL_ACCESS_TOKEN_HERE` bằng token thật từ Supabase Dashboard!

---

## 📋 CÁC BƯỚC KÍCH HOẠT MCP SUPABASE

### BƯỚC 1: Reset MCP Supabase trong Cursor

1. Mở **Cursor Settings** (Ctrl+, hoặc Cmd+,)
2. Tìm **"MCP Servers"** hoặc **"Model Context Protocol"**
3. **TẮT** Supabase MCP (nếu đang bật)
4. **ĐÓNG Cursor hoàn toàn**
5. Mở lại Cursor
6. **BẬT** lại Supabase MCP

👉 Mục đích: Xóa session MCP cũ

---

### BƯỚC 2: Lấy Personal Access Token

1. **Mở Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard/account/tokens

2. **Tạo mới Personal Access Token:**
   - Click "Generate new token"
   - Đặt tên (ví dụ: "Cursor MCP")
   - **Copy token ngay** (chỉ hiển thị 1 lần!)

### BƯỚC 3: Cập Nhật Config trong Cursor Settings

Trong Cursor Settings → MCP Servers, cập nhật config:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq",
      "headers": {
        "Authorization": "Bearer YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

⚠️ **QUAN TRỌNG**: 
- Thay `YOUR_PERSONAL_ACCESS_TOKEN_HERE` bằng token bạn vừa copy
- **KHÔNG** để headers trống `{}` - sẽ không hoạt động!

---

### BƯỚC 4: Restart Cursor

1. **Đóng hoàn toàn Cursor**
2. **Mở lại Cursor**
3. MCP Supabase sẽ tự động kết nối với token đã cấu hình

### BƯỚC 5: Kiểm Tra Kết Nối

Sau khi restart Cursor, thử gọi MCP tools:

```
Using Supabase MCP:
- List available projects.
- Select project fdklazlcbxaiapsnnbqq.
- Read database schema (tables only).
- Do NOT execute any write operation.
```

Hoặc đơn giản hơn, yêu cầu AI:
```
List tables in Supabase database
```

👉 Nếu Cursor trả được danh sách bảng → **MCP ĐÃ HOẠT ĐỘNG**

⚠️ **Nếu vẫn lỗi "Unauthorized"**:
- Kiểm tra lại token có đúng không
- Đảm bảo token chưa hết hạn
- Xem chi tiết trong `docs/FIX_MCP_SUPABASE_CONNECTION.md`

---

## 🔧 NẾU VẪN KHÔNG ĐƯỢC: Reset Supabase CLI

MCP Supabase phụ thuộc vào Supabase CLI session. Chạy:

```bash
supabase logout
supabase login
supabase projects list
supabase link --project-ref fdklazlcbxaiapsnnbqq
```

Sau đó:
- Mở lại Cursor
- Bật MCP Supabase
- Thử lại Bước 3

---

## ✅ CHECKLIST XÁC NHẬN MCP HOẠT ĐỘNG

MCP Supabase **ĐÃ OK** nếu Cursor có thể:

- ✅ List projects
- ✅ Read schema (tables)
- ✅ Read policies
- ✅ Read functions

**CHƯA OK** nếu:

- ❌ Không hiện project
- ❌ Không prompt login
- ❌ Im lặng hoặc báo lỗi

---

## 📝 LƯU Ý

- **Project Reference**: `fdklazlcbxaiapsnnbqq`
- **Project URL**: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq
- Config trong repo (`mcp-config.json`) chỉ là reference
- Config thực tế phải được thêm vào **Cursor Settings**
