# Kết Nối MCP Supabase Trực Tiếp

**Date:** 2025-01-19

---

## 🔧 CÁC CÁCH KẾT NỐI MCP SUPABASE

### Cách 1: Dùng URL (Hiện tại - Đã có token)

**File:** `c:\Users\Dell\.cursor\mcp.json`
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

**Status:** ✅ Connected trong Cursor Settings

**Vấn đề:** `list_mcp_resources` trả về empty (có thể MCP không expose resources, chỉ expose tools)

---

### Cách 2: Dùng Command (Thử format này)

**Thử format này trong `mcp.json`:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "fdklazlcbxaiapsnnbqq",
        "--access-token",
        "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
      ]
    }
  }
}
```

**Hoặc:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.fdklazlcbxaiapsnnbqq:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
      }
    }
  }
}
```

---

## 🎯 CÁCH TEST KẾT NỐI

### Test 1: Kiểm tra MCP Tools

Trong Cursor chat, thử yêu cầu:
- "List all tables in Supabase database"
- "Execute SQL: SELECT COUNT(*) FROM businesses"
- "Show database schema for Supabase"

Nếu MCP tools hoạt động, AI sẽ gọi tools tự động.

### Test 2: Kiểm tra Connection Status

1. Mở Cursor Settings (Ctrl+,)
2. Tìm "MCP Servers"
3. Xem Supabase server status:
   - ✅ "Connected" = Đã kết nối
   - ❌ "Error" = Có lỗi (xem error message)

### Test 3: Kiểm tra Logs

1. Mở Cursor Developer Tools (Help → Toggle Developer Tools)
2. Xem Console tab
3. Tìm messages về MCP hoặc Supabase

---

## 🔍 TROUBLESHOOTING

### Nếu `list_mcp_resources` trả về empty:

**Đây là BÌNH THƯỜNG nếu:**
- MCP Supabase chỉ expose **tools**, không expose **resources**
- Tools chỉ available khi AI gọi chúng, không list được trước

**Cách test:**
- Yêu cầu AI chạy SQL query
- Nếu AI có thể chạy được = MCP đã kết nối thành công

### Nếu MCP tools không hoạt động:

1. **Thử format command thay vì url:**
   - Update `mcp.json` với format ở Cách 2
   - Restart Cursor

2. **Kiểm tra token:**
   - Token có hợp lệ không?
   - Token có quyền truy cập project không?

3. **Kiểm tra network:**
   - Firewall có block không?
   - VPN có ảnh hưởng không?

---

## ✅ KẾT LUẬN

**Hiện tại:**
- ✅ Config đúng với token
- ✅ Cursor Settings show "Connected"
- ⚠️ `list_mcp_resources` empty (có thể bình thường)

**Next Steps:**
1. Thử yêu cầu AI chạy SQL query để test MCP tools
2. Nếu không được, thử format command trong `mcp.json`
3. Restart Cursor sau khi đổi config
