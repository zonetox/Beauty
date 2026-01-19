# MCP Supabase Connection - Debug Steps

**Date:** 2025-01-19  
**Status:** 🔍 DEBUGGING IN PROGRESS

---

## ✅ ĐÃ XÁC NHẬN

1. **Token hợp lệ:** `sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd`
2. **Project tồn tại:** `fdklazlcbxaiapsnnbqq` (supabase-BEAUTY)
3. **Config đúng:** `c:\Users\Dell\.cursor\mcp.json` có token trong headers
4. **Cursor đã restart:** User confirmed

---

## ❌ VẤN ĐỀ HIỆN TẠI

**`list_mcp_resources` trả về:** "No MCP resources found"

**Nguyên nhân có thể:**
1. MCP Supabase không expose **resources** (chỉ expose **tools**)
2. Cursor chưa khởi động MCP server (cần thời gian)
3. MCP server connection failed (cần check logs)

---

## 🔧 CÁC BƯỚC DEBUG

### Bước 1: Kiểm Tra Cursor Settings

1. Mở Cursor Settings (Ctrl+,)
2. Tìm **"MCP Servers"** hoặc **"Model Context Protocol"**
3. Kiểm tra:
   - Supabase server có trong danh sách không?
   - Status là gì? (Connected/Disconnected/Error)
   - Có error message nào không?

### Bước 2: Kiểm Tra Cursor Developer Tools

1. Mở **Help → Toggle Developer Tools**
2. Xem **Console** tab
3. Tìm các message liên quan đến:
   - "MCP"
   - "Supabase"
   - "Connection"
   - "Error"

### Bước 3: Test MCP Tools Trực Tiếp

**Thay vì dùng `list_mcp_resources`, thử gọi tools trực tiếp:**

Trong chat với AI, thử các lệnh sau:
- "Execute SQL on Supabase: SELECT COUNT(*) FROM businesses"
- "List all tables in Supabase database"
- "Show database schema for Supabase project"

**Nếu tools hoạt động:** MCP đã kết nối, chỉ là không expose resources.

**Nếu tools không hoạt động:** MCP chưa kết nối, cần fix connection.

### Bước 4: Kiểm Tra MCP Config Format

**File:** `c:\Users\Dell\.cursor\mcp.json`

**Config hiện tại:**
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq",
      "headers": {
        "Authorization": "Bearer sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
      }
    }
  }
}
```

**Có thể cần thử format khác:**
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "params": {
        "project_ref": "fdklazlcbxaiapsnnbqq"
      },
      "headers": {
        "Authorization": "Bearer sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
      }
    }
  }
}
```

**HOẶC:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server", "--project-ref", "fdklazlcbxaiapsnnbqq"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
      }
    }
  }
}
```

### Bước 5: Kiểm Tra Network/Firewall

1. Kiểm tra firewall có block `mcp.supabase.com` không
2. Kiểm tra proxy settings trong Cursor
3. Thử disable VPN nếu đang dùng

### Bước 6: Thử Re-authenticate

1. Xóa token khỏi config
2. Restart Cursor
3. Thử login lại qua browser flow (nếu MCP hỗ trợ)
4. Thêm token lại vào config

---

## 🎯 KẾT LUẬN

**Nếu `list_mcp_resources` trả về empty nhưng tools vẫn hoạt động:**
- ✅ MCP đã kết nối thành công
- ✅ Chỉ là không expose resources (bình thường)
- ✅ Có thể dùng tools để chạy SQL

**Nếu cả resources và tools đều không hoạt động:**
- ❌ MCP chưa kết nối
- ❌ Cần fix connection (thử các bước trên)

---

## 📝 NEXT ACTIONS

1. **Ngay bây giờ:** Kiểm tra Cursor Settings → MCP Servers status
2. **Nếu status = Error:** Xem error message và fix
3. **Nếu status = Connected:** Thử gọi MCP tools trực tiếp
4. **Nếu vẫn không được:** Thử các format config khác ở Bước 4
