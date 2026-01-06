# Database Migrations

**Version:** 1.0  
**Last Updated:** 2025-01-06

---

## 📋 Migration Scripts

### Thứ tự chạy migration (theo thời gian):

1. **`20250105000000_align_to_schema_v1.0.sql`**
   - Căn chỉnh database với schema v1.0
   - Tạo các bảng cơ bản (businesses, services, reviews, etc.)
   - **Chạy đầu tiên**

2. **`20250105000001_d2_data_integrity.sql`**
   - Tạo bảng `blog_comments`
   - Tạo RPC functions cho view count increment
   - Initialize homepage content

3. **`20250106000000_add_admin_logs_and_notifications.sql`**
   - Tạo bảng `admin_activity_logs`
   - Tạo bảng `email_notifications_log`
   - RLS policies cho các bảng mới

4. **`20250106000001_create_blog_comments.sql`**
   - Đảm bảo bảng `blog_comments` tồn tại (nếu chưa chạy migration #2)
   - RLS policies cho `blog_comments`

---

## 🚀 Cách chạy migration

### Trong Supabase SQL Editor:

1. Mở Supabase Dashboard → SQL Editor
2. Chạy từng migration script theo thứ tự trên
3. Kiểm tra kết quả (không có lỗi)

### Lưu ý:

- Tất cả migration scripts đều **idempotent** (có thể chạy nhiều lần không lỗi)
- Sử dụng `CREATE TABLE IF NOT EXISTS` và `DROP POLICY IF EXISTS`
- Nếu gặp lỗi, kiểm tra:
  - Helper functions (`is_admin`, `is_business_owner`, `get_user_email`) đã tồn tại chưa
  - RLS policies file (`rls_policies_v1.sql`) đã được chạy chưa

---

## ✅ Verification

Sau khi chạy migrations, chạy verification scripts:

- `database/verifications/a3.4_security_audit.sql` - Kiểm tra RLS và security
- `database/verifications/c4_admin_panel_verification.sql` - Kiểm tra Admin Panel

---

## 📝 Notes

- Migration scripts không xóa dữ liệu hiện có
- Chỉ thêm/sửa schema và policies
- Backup database trước khi chạy migration (khuyến nghị)

