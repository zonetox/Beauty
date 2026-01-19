# MCP Server Configuration

## Supabase MCP Server

Để sử dụng MCP Supabase server trong Cursor, thêm cấu hình sau vào file cấu hình MCP của bạn:

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
- **BẮT BUỘC**: Thay `YOUR_PERSONAL_ACCESS_TOKEN_HERE` bằng Personal Access Token thật từ Supabase Dashboard
- Headers trống `{}` sẽ **KHÔNG hoạt động** - MCP Supabase cần Authorization header để authenticate
- Xem hướng dẫn chi tiết trong `docs/FIX_MCP_SUPABASE_CONNECTION.md`

## Project Reference

- **Project Ref:** `fdklazlcbxaiapsnnbqq`
- **Project URL:** https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq

## Cách thêm vào Cursor

1. Mở Cursor Settings
2. Tìm "MCP Servers" hoặc "Model Context Protocol"
3. Thêm cấu hình trên vào danh sách MCP servers
4. Restart Cursor để áp dụng

## Lưu ý

- File `mcp-config.json` trong repo này chỉ là reference
- Cấu hình thực tế cần được thêm vào Cursor settings
- Đảm bảo bạn có quyền truy cập project Supabase

