# Sửa lỗi kết nối MCP Supabase - "No MCP resources" hoặc "serverURL or command must be specified"

## 🔍 Vấn Đề Phát Hiện

**1. Lỗi thiếu Token:**
Headers trống hoặc sai token dẫn đến lỗi xác thực.

**2. Lỗi tên trường cấu hình (Field Name):**
Lỗi `supabase: serverURL or command must be specified` xảy ra do Cursor hoặc các công cụ MCP mới yêu cầu tên trường là `serverURL` thay vì `url` cho các kết nối SSE.

---

## ✅ Giải Pháp: Cấu Hình Đúng Chuẩn

### Bước 1: Lấy Personal Access Token từ Supabase

1. **Mở Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard/account/tokens

2. **Tạo mới Personal Access Token:**
   - Click "Generate new token"
   - Đặt tên (ví dụ: "Cursor MCP")
   - **Copy token ngay** (chỉ hiển thị 1 lần!)

### Bước 2: Cập nhật cấu hình MCP

Mở cài đặt MCP trong ứng dụng của bạn (ví dụ Cursor Settings > MCP) và sử dụng cấu hình sau:

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

**Lưu ý quan trọng:**
- Phải dùng **`serverURL`** thay cho `url`.
- Thay `YOUR_PERSONAL_ACCESS_TOKEN_HERE` bằng token bạn vừa copy.

### Bước 3: Khởi động lại ứng dụng

1. **Đóng hoàn toàn Cursor/Claude Desktop.**
2. **Mở lại ứng dụng.**
3. **Kiểm tra trạng thái kết nối (Status: Connected).**

---

## 🔧 Giải Pháp Thay Thế: Dùng lệnh (stdio)

Nếu kết nối URL gặp vấn đề, bạn có thể thử dùng lệnh npx:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

## 📋 Kiểm Tra Kết Nối

Sau khi cập nhật và khởi động lại:

1. **Kiểm tra trong Cài đặt:**
   - Đảm bảo server Supabase hiển thị trạng thái "Connected".
2. **Thử gọi công cụ:**
   - Hỏi AI: "Liệt kê các bảng trong database Supabase".
3. **Kiểm tra Logs:**
   - Nếu vẫn lỗi, hãy xem log để biết chi tiết.

---

## 🔐 Lưu Ý Bảo Mật

1. ✅ **KHÔNG** chia sẻ Personal Access Token.
2. ✅ **KHÔNG** commit file cấu hình có chứa token vào Git.
3. ✅ Nếu nghi ngờ bị lộ, hãy thu hồi (revoke) token cũ trên Supabase Dashboard và tạo cái mới.

---

## 🐛 Troubleshooting (Xử lý sự cố)

### Lỗi: "serverURL or command must be specified"
- **Nguyên nhân:** Bạn đang dùng trường `url`.
- **Khắc phục:** Đổi tên trường thành `serverURL`.

### Lỗi: "Unauthorized"
- **Nguyên nhân:** Token sai hoặc hết hạn.
- **Khắc phục:** Tạo token mới và cập nhật vào headers.

### Lỗi: "Project not found"
- **Nguyên nhân:** Sai `project_ref`.
- **Khắc phục:** Kiểm tra mã dự án (trong trường hợp này là `fdklazlcbxaiapsnnbqq`).
