# Fix MCP Supabase Connection - Lỗi "No MCP resources"

## 🔍 Vấn Đề Phát Hiện

**File cấu hình hiện tại:** `c:\Users\Dell\.cursor\mcp.json`
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq",
      "headers": {}  // ❌ HEADERS TRỐNG!
    }
  }
}
```

**Vấn đề:** Headers đang trống, trong khi MCP Supabase server cần **Personal Access Token (PAT)** để authenticate!

---

## ✅ Giải Pháp: Thêm Access Token vào Headers

### Bước 1: Lấy Personal Access Token từ Supabase

1. **Mở Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard/account/tokens

2. **Tạo mới Personal Access Token:**
   - Click "Generate new token"
   - Đặt tên (ví dụ: "Cursor MCP")
   - **Copy token ngay** (chỉ hiển thị 1 lần!)

### Bước 2: Cập nhật `mcp.json`

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
3. **Kiểm tra kết nối MCP**

---

## 🔧 Giải Pháp Thay Thế: Dùng Environment Variable (AN TOÀN HƠN)

### Bước 1: Set Environment Variable

**Windows PowerShell:**
```powershell
# Set cho session hiện tại
$env:SUPABASE_ACCESS_TOKEN = "your_token_here"

# Hoặc set permanently (User-level)
[System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "your_token_here", "User")
```

### Bước 2: Cập nhật `mcp.json` để dùng env variable

**Lưu ý:** Cursor MCP có thể không tự động expand environment variables trong JSON. Cần kiểm tra documentation Cursor về cách dùng env vars trong MCP config.

**Hoặc:** Nếu không hỗ trợ env vars trong JSON, phải hardcode token (nhưng nhớ giữ bí mật!).

---

## 📋 Kiểm Tra Kết Nối

Sau khi cập nhật và restart Cursor:

1. **Kiểm tra trong Cursor Settings:**
   - Mở Cursor Settings
   - Tìm "MCP Servers"
   - Kiểm tra Supabase server có status "Connected" không

2. **Thử gọi MCP tools:**
   - Yêu cầu AI: "List tables in Supabase database"
   - Hoặc: "Execute SQL: SELECT COUNT(*) FROM businesses"

3. **Kiểm tra logs:**
   - Nếu vẫn lỗi, xem Cursor logs để biết chi tiết

---

## 🔐 Security Notes

**QUAN TRỌNG:**

1. ✅ **KHÔNG commit `mcp.json` có token vào git**
2. ✅ **Giữ token bí mật** - không share public
3. ✅ **Rotate token** nếu nghi ngờ bị lộ
4. ✅ **Xóa token cũ** nếu không dùng nữa

**Best Practice:**
- Nên dùng `.gitignore` cho `mcp.json` nếu chứa token
- Hoặc tạo `mcp.json.example` không có token, commit file đó
- Token chỉ set trong local `mcp.json` (không commit)

---

## 🐛 Troubleshooting

### Lỗi: "Unauthorized" hoặc "Invalid token"
- ✅ Kiểm tra token có đúng không (copy lại)
- ✅ Kiểm tra token chưa hết hạn
- ✅ Kiểm tra token có quyền truy cập project `fdklazlcbxaiapsnnbqq` không

### Lỗi: "Project not found"
- ✅ Kiểm tra `project_ref=fdklazlcbxaiapsnnbqq` có đúng không
- ✅ Kiểm tra account có quyền truy cập project không

### Lỗi: MCP server không kết nối
- ✅ Restart Cursor
- ✅ Kiểm tra internet connection
- ✅ Kiểm tra MCP URL có đúng không: `https://mcp.supabase.com/mcp`

---

## 📝 Tóm Tắt

**Vấn đề gốc:** MCP Supabase config thiếu `Authorization` header với Personal Access Token.

**Giải pháp:** 
1. Lấy token từ Dashboard
2. Thêm vào `headers.Authorization` trong `mcp.json`
3. Restart Cursor

**Expected result:** MCP Supabase kết nối thành công, có thể gọi `execute_sql` và các tools khác.
