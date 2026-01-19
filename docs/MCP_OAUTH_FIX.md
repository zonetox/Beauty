# Fix: OAuth Authorization Error - Chuyển Sang Personal Access Token

## 🔴 Vấn Đề

Lỗi: **"OAuth authorization request does not exist"**

**Nguyên nhân:**
- OAuth flow của MCP Supabase không ổn định
- Authorization request timeout hoặc không sync được giữa Cursor và Supabase
- OAuth flow phức tạp và dễ lỗi trong môi trường Cursor

## ✅ Giải Pháp: Dùng Personal Access Token (PAT)

Theo `docs/FIX_MCP_SUPABASE_CONNECTION.md`, cách **ỔN ĐỊNH NHẤT** là dùng Personal Access Token thay vì OAuth.

---

## 📋 Các Bước

### Bước 1: Lấy Personal Access Token

1. **Mở Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard/account/tokens

2. **Tạo mới Personal Access Token:**
   - Click **"Generate new token"**
   - Đặt tên (ví dụ: "Cursor MCP")
   - **Copy token ngay** (chỉ hiển thị 1 lần!)

### Bước 2: Cập Nhật Config MCP

**Cập nhật file:** `c:\Users\Dell\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "Vercel": {
      "url": "https://mcp.vercel.com",
      "headers": {}
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq",
      "headers": {
        "Authorization": "Bearer YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

**Thay thế:** `YOUR_PERSONAL_ACCESS_TOKEN_HERE` bằng token bạn vừa copy.

### Bước 3: Restart Cursor

1. **Đóng hoàn toàn Cursor**
2. **Mở lại Cursor**
3. MCP Supabase sẽ tự động kết nối với token

### Bước 4: Verify Connection

Sau khi restart, test MCP:

```
Using Supabase MCP:
- List available projects.
- Select project fdklazlcbxaiapsnnbqq.
- Read database schema (tables only).
- Do NOT execute any write operation.
```

**Kết quả mong đợi:**
- ✅ Trả về danh sách tables
- ✅ Xác nhận read access hoạt động

---

## 🔍 Tại Sao OAuth Không Hoạt Động?

1. **OAuth flow phức tạp:**
   - Cần browser redirect
   - Cần sync state giữa Cursor và Supabase
   - Dễ timeout hoặc mất sync

2. **MCP Supabase ưu tiên PAT:**
   - PAT đơn giản hơn, ổn định hơn
   - Không cần browser flow
   - Token được lưu trực tiếp trong config

3. **Tài liệu chính thức khuyến nghị PAT:**
   - `docs/FIX_MCP_SUPABASE_CONNECTION.md` khuyến nghị dùng PAT
   - OAuth chỉ là option thay thế, không phải primary method

---

## 🔐 Security Notes

**QUAN TRỌNG:**

1. ✅ **KHÔNG commit `mcp.json` có token vào git**
2. ✅ **Giữ token bí mật** - không share public
3. ✅ **Rotate token** nếu nghi ngờ bị lộ
4. ✅ **Xóa token cũ** nếu không dùng nữa

**Best Practice:**
- File `mcp-config.json` trong repo chỉ là template (không có token thật)
- Token chỉ set trong local `mcp.json` (không commit)
- Nếu cần share config, dùng `mcp-config.json.example` với placeholder

---

## ✅ Checklist

- [ ] Đã lấy Personal Access Token từ Supabase Dashboard
- [ ] Đã cập nhật `c:\Users\Dell\.cursor\mcp.json` với token
- [ ] Đã thêm `project_ref=fdklazlcbxaiapsnnbqq` vào URL
- [ ] Đã restart Cursor
- [ ] Đã test MCP connection thành công
- [ ] MCP có thể list projects và read schema

---

## 🐛 Troubleshooting

### Nếu vẫn lỗi "Unauthorized":

1. **Kiểm tra token:**
   - Token có đúng không? (copy lại)
   - Token chưa hết hạn?
   - Token có quyền truy cập project `fdklazlcbxaiapsnnbqq`?

2. **Kiểm tra config:**
   - Format JSON có đúng không?
   - Headers có đúng format `Bearer TOKEN` không?
   - URL có đúng không?

3. **Kiểm tra Cursor:**
   - Cursor đã restart chưa?
   - MCP Supabase có status "Connected" trong Settings không?

### Nếu token không hoạt động:

1. **Tạo token mới:**
   - Xóa token cũ trong Dashboard
   - Tạo token mới
   - Cập nhật lại config

2. **Kiểm tra quyền token:**
   - Token phải có quyền truy cập project
   - Token phải là Personal Access Token (không phải API key)

---

## 📝 Tóm Tắt

**Vấn đề:** OAuth flow không ổn định, gây lỗi "authorization request does not exist"

**Giải pháp:** Dùng Personal Access Token thay vì OAuth

**Kết quả:** MCP Supabase kết nối ổn định, không cần OAuth flow
