# Cấu hình MCP Server

## Supabase MCP Server

Để sử dụng MCP Supabase server trong Cursor hoặc Claude Desktop, thêm cấu hình sau vào file cấu hình MCP của bạn (thường là `mcp.json` hoặc `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "serverURL": "https://mcp.supabase.com/mcp?project_ref=fdklazlcbxaiapsnnbqq",
      "headers": {
        "Authorization": "Bearer YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

⚠️ **QUAN TRỌNG**: 
- **LƯU Ý**: Sử dụng `serverURL` thay vì `url` để tránh lỗi "serverURL or command must be specified".
- **BẮT BUỘC**: Thay `YOUR_PERSONAL_ACCESS_TOKEN_HERE` bằng Personal Access Token thật từ Supabase Dashboard.
- Headers trống `{}` sẽ **KHÔNG hoạt động** - MCP Supabase cần Authorization header để xác thực.
- Xem hướng dẫn chi tiết trong `docs/FIX_MCP_SUPABASE_CONNECTION.md`.

## Thông tin dự án

- **Project Ref:** `fdklazlcbxaiapsnnbqq`
- **Project URL:** https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq

## Cách thêm vào Cursor

1. Mở Cursor Settings.
2. Tìm "MCP Servers" hoặc "Model Context Protocol".
3. Thêm cấu hình trên vào danh sách MCP servers.
4. Nếu gặp lỗi "serverURL or command must be specified", hãy đảm bảo bạn đang dùng key `serverURL` như ví dụ trên.
5. Khởi động lại Cursor để áp dụng.

## Lưu ý

- File `mcp-config.json` trong repo này chỉ dùng để tham khảo.
- Cấu hình thực tế cần được thêm vào cài đặt của công cụ (Cursor/Claude).
- Đảm bảo bạn có quyền truy cập vào dự án Supabase này.

