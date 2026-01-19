# Các Bước Kết Nối MCP Supabase (Đã Thực Hiện)

## ✅ BƯỚC 1: Đã Reset Config MCP

Config đã được cập nhật trong `c:\Users\Dell\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "headers": {}
    }
  }
}
```

**Thay đổi:**
- ✅ Đã bỏ `project_ref` khỏi URL (theo hướng dẫn)
- ✅ Đã xóa headers để trigger OAuth flow

---

## 🔄 BƯỚC 2: BẠN CẦN LÀM (Trong Cursor)

### 2.1. Reset MCP Supabase trong Cursor Settings

1. Mở **Cursor Settings** (Ctrl+,)
2. Tìm **"MCP Servers"** hoặc **"Model Context Protocol"**
3. **TẮT** Supabase MCP (nếu đang bật)
4. **ĐÓNG Cursor hoàn toàn**
5. Mở lại Cursor
6. **BẬT** lại Supabase MCP

👉 Mục đích: Xóa session MCP cũ và load config mới

---

## 🔄 BƯỚC 3: Reset Supabase CLI Session (Nếu Cần)

Nếu MCP vẫn không hoạt động sau Bước 2, chạy lệnh này trong terminal:

```powershell
# Logout (sẽ hỏi xác nhận - gõ 'y')
npx supabase logout

# Login lại (sẽ mở browser để login)
npx supabase login

# List projects để verify
npx supabase projects list

# Link project (chọn project fdklazlcbxaiapsnnbqq)
npx supabase link --project-ref fdklazlcbxaiapsnnbqq
```

---

## ✅ BƯỚC 4: Test MCP Connection

Sau khi restart Cursor, gửi lệnh này cho Cursor AI:

```
Connect to Supabase via MCP.

If authentication is required:
- Prompt me to log in to Supabase.
- Let me select the project manually (project_ref: fdklazlcbxaiapsnnbqq).

Then:
- Verify MCP connection by listing available projects.
- Do NOT modify anything.
- Only confirm read access is working.
```

**Kết quả mong đợi:**
- ✅ Cursor sẽ yêu cầu login Supabase (OAuth flow)
- ✅ Hiện danh sách projects để chọn
- ✅ Cho phép chọn project `fdklazlcbxaiapsnnbqq`

**Nếu KHÔNG có prompt login:**
- ❌ MCP chưa kết nối
- Cần kiểm tra lại Bước 2 và 3

---

## ✅ BƯỚC 5: Verify Read Access

Sau khi auth thành công, test tiếp:

```
Using Supabase MCP:
- List available projects.
- Select project fdklazlcbxaiapsnnbqq.
- Read database schema (tables only).
- Do NOT execute any write operation.
```

**Kết quả mong đợi:**
- ✅ Trả về danh sách tables trong database
- ✅ Xác nhận read access hoạt động

---

## 🔍 Troubleshooting

### Nếu MCP vẫn không hoạt động:

1. **Kiểm tra Cursor Settings:**
   - MCP Supabase có status "Connected" không?
   - Config có đúng không?

2. **Kiểm tra Supabase CLI:**
   ```powershell
   npx supabase projects list
   ```
   - Phải thấy project `fdklazlcbxaiapsnnbqq` trong danh sách

3. **Kiểm tra logs:**
   - Xem Cursor logs để biết lỗi chi tiết
   - Có thể có lỗi authentication hoặc connection

4. **Thử lại từ đầu:**
   - Logout Supabase CLI
   - Logout Cursor (nếu có)
   - Restart máy (nếu cần)
   - Login lại và thử lại

---

## 📝 Lưu Ý

- Config trong repo (`mcp-config.json`) chỉ là reference
- Config thực tế ở `c:\Users\Dell\.cursor\mcp.json` (đã được cập nhật)
- Không hardcode token trong config (dùng OAuth flow)
- Không hardcode project_ref trong URL (chọn qua auth)

---

## ✅ Checklist

- [x] Config đã được cập nhật (bỏ project_ref, xóa headers)
- [ ] Bạn đã restart Cursor (Bước 2)
- [ ] Bạn đã test MCP connection (Bước 4)
- [ ] MCP đã kết nối và có thể list projects
- [ ] MCP có thể read database schema
