# MCP Supabase Connection Diagnosis

**Date:** 2025-01-19  
**Status:** 🔍 DIAGNOSIS COMPLETE

---

## ✅ ĐÃ XÁC NHẬN

### 1. Token Hợp Lệ
- **Token:** `sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd`
- **Test Result:** ✅ **SUCCESS**
- **Project Info:**
  - Name: `supabase-BEAUTY`
  - Ref: `fdklazlcbxaiapsnnbqq`
  - Status: `ACTIVE_HEALTHY`
  - Region: `ap-southeast-1`
  - Database: `db.fdklazlcbxaiapsnnbqq.supabase.co`

### 2. MCP Config Đúng
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
✅ Config đã có token trong headers

---

## ❌ VẤN ĐỀ PHÁT HIỆN

### 1. MCP Endpoint Không Phải REST API
- **Test:** `GET https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq`
- **Result:** `405 Method Not Allowed`
- **Lý do:** MCP protocol không dùng HTTP GET, cần kết nối qua MCP client

### 2. `list_mcp_resources` Trả Về Empty
- **Result:** "No MCP resources found"
- **Nguyên nhân có thể:**
  1. Cursor chưa khởi động MCP server sau khi thêm token
  2. MCP server cần restart Cursor để load config
  3. MCP Supabase không expose resources qua API này (có thể chỉ expose tools)

---

## 🔧 GIẢI PHÁP

### Bước 1: Restart Cursor (QUAN TRỌNG)
1. **Đóng hoàn toàn Cursor** (không chỉ window)
2. **Mở lại Cursor**
3. **Chờ MCP servers khởi động** (có thể mất 10-30 giây)

### Bước 2: Kiểm Tra MCP Server Status
1. Mở **Cursor Settings** (Ctrl+,)
2. Tìm **"MCP Servers"** hoặc **"Model Context Protocol"**
3. Kiểm tra Supabase server có status:
   - ✅ "Connected" hoặc "Active"
   - ❌ "Disconnected" hoặc "Error"

### Bước 3: Test Kết Nối Qua MCP Tools
Thay vì dùng `list_mcp_resources`, thử gọi MCP tools trực tiếp:

**Ví dụ:**
- "Execute SQL query on Supabase: SELECT COUNT(*) FROM businesses"
- "List all tables in Supabase database"
- "Show RLS policies for businesses table"

### Bước 4: Kiểm Tra Logs
Nếu vẫn không hoạt động:
1. Mở **Cursor Developer Tools** (Help → Toggle Developer Tools)
2. Xem **Console** tab
3. Tìm lỗi liên quan đến MCP hoặc Supabase

---

## 🔍 CHẨN ĐOÁN CHI TIẾT

### Test 1: Token Validation ✅
```powershell
$headers = @{ "Authorization" = "Bearer sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd" }
Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/fdklazlcbxaiapsnnbqq" -Headers $headers
```
**Result:** ✅ SUCCESS - Project info returned

### Test 2: MCP Endpoint ❌
```powershell
Invoke-RestMethod -Uri "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq" -Headers $headers
```
**Result:** ❌ 405 Method Not Allowed (Expected - MCP không phải REST API)

### Test 3: MCP Resources ❌
```typescript
list_mcp_resources(server: "supabase")
```
**Result:** ❌ "No MCP resources found"

---

## 📋 CHECKLIST

- [x] Token hợp lệ và có quyền truy cập project
- [x] MCP config có token trong headers
- [ ] Cursor đã restart sau khi thêm token
- [ ] MCP server status = "Connected" trong Cursor Settings
- [ ] Có thể gọi MCP tools (execute_sql, etc.)

---

## 🎯 KẾT LUẬN

**Vấn đề không phải ở:**
- ❌ Token (đã xác nhận hợp lệ)
- ❌ Config (đã có token trong headers)
- ❌ Project (đã xác nhận tồn tại và active)

**Vấn đề thực sự:**
- ⚠️ **Cursor chưa khởi động MCP server** hoặc chưa load config mới
- ⚠️ **Cần restart Cursor** để MCP server nhận config mới

**Action Required:**
1. **Restart Cursor ngay bây giờ**
2. Kiểm tra MCP server status trong Settings
3. Thử gọi MCP tools trực tiếp (không qua list_resources)

---

## 📝 NOTES

- MCP protocol khác với REST API - không thể test bằng HTTP GET
- `list_mcp_resources` có thể không hoạt động với Supabase MCP (chỉ expose tools, không expose resources)
- Cách test đúng: Gọi MCP tools trực tiếp qua Cursor AI
