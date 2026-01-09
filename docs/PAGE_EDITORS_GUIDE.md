# 📝 HƯỚNG DẪN CHỈNH SỬA NỘI DUNG 3 TRANG

**Ngày:** 2025-01-09  
**Mục đích:** Hướng dẫn chỉnh sửa nội dung trang chủ, về chúng tôi, và liên hệ

---

## ✅ TỔNG QUAN

Bạn có thể chỉnh sửa nội dung 3 trang trong Admin Panel:

1. **Trang chủ (Homepage)** - Sử dụng Homepage Editor
2. **Về chúng tôi (About)** - Sử dụng Page Content Editor
3. **Liên hệ (Contact)** - Sử dụng Page Content Editor

---

## 🏠 1. CHỈNH SỬA TRANG CHỦ (HOMEPAGE)

### Cách truy cập:
1. Đăng nhập Admin Panel: `/admin`
2. Click vào tab **"Homepage Editor"** trong menu bên trái
3. Cần quyền: `canManageSiteContent`

### Tính năng:
- ✅ Chỉnh sửa Hero Slides (tiêu đề, phụ đề, hình ảnh)
- ✅ Thêm/Xóa Hero Slides
- ✅ Bật/Tắt hiển thị các sections trên trang chủ
- ✅ Preview trực tiếp

### Các sections có thể bật/tắt:
- Featured Businesses
- Categories
- Testimonials
- Blog Highlights
- CTA Section

---

## 📄 2. CHỈNH SỬA TRANG "VỀ CHÚNG TÔI" (ABOUT)

### Cách truy cập:
1. Đăng nhập Admin Panel: `/admin`
2. Click vào tab **"Page Editor"** trong menu bên trái
3. Chọn **"Về chúng tôi"** từ dropdown
4. Click **"Edit Layout"** để chỉnh sửa
5. Cần quyền: `canManageSiteContent`

### Tính năng:
- ✅ Sắp xếp lại thứ tự các sections (drag & drop)
- ✅ Bật/Tắt hiển thị sections
- ✅ Thêm custom headings
- ✅ Thêm separators

### Các sections có thể chỉnh sửa:
- About Hero
- Why Choose Us
- About History
- About Mission
- About Team
- CTA Section

---

## 📧 3. CHỈNH SỬA TRANG "LIÊN HỆ" (CONTACT)

### Cách truy cập:
1. Đăng nhập Admin Panel: `/admin`
2. Click vào tab **"Page Editor"** trong menu bên trái
3. Chọn **"Liên hệ"** từ dropdown
4. Click **"Edit Layout"** để chỉnh sửa
5. Cần quyền: `canManageSiteContent`

### Tính năng:
- ✅ Sắp xếp lại thứ tự các sections (drag & drop)
- ✅ Bật/Tắt hiển thị sections
- ✅ Thêm custom headings
- ✅ Thêm separators

### Các sections có thể chỉnh sửa:
- Contact Hero
- Contact Info
- Contact Form
- Contact Map

---

## 🎯 QUYỀN TRUY CẬP

### Cần quyền:
- `canManageSiteContent` - Quản lý nội dung trang web

### Ai có quyền:
- **Admin** - Có đầy đủ quyền
- **Editor** - Có thể chỉnh sửa nội dung
- **Moderator** - Không có quyền (chỉ quản lý businesses, users)

---

## 📋 CHECKLIST

### Trước khi chỉnh sửa:
- [ ] Đăng nhập với tài khoản có quyền `canManageSiteContent`
- [ ] Backup nội dung hiện tại (nếu cần)
- [ ] Xác định những gì cần thay đổi

### Khi chỉnh sửa:
- [ ] Kiểm tra preview trước khi save
- [ ] Đảm bảo hình ảnh URLs hợp lệ
- [ ] Kiểm tra text không có lỗi chính tả

### Sau khi chỉnh sửa:
- [ ] Click **"Save"** để lưu thay đổi
- [ ] Kiểm tra trang public để xác nhận
- [ ] Clear cache nếu cần (Ctrl+F5)

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Cannot load page data"
- **Nguyên nhân:** Database chưa có dữ liệu mặc định
- **Giải pháp:** Hệ thống sẽ tự động tạo dữ liệu mặc định khi lần đầu truy cập

### Lỗi: "Access Denied"
- **Nguyên nhân:** Tài khoản không có quyền `canManageSiteContent`
- **Giải pháp:** Liên hệ Admin để cấp quyền

### Thay đổi không hiển thị:
- **Nguyên nhân:** Cache trình duyệt
- **Giải pháp:** Clear cache (Ctrl+F5) hoặc hard refresh

---

## 📝 LƯU Ý

1. **Homepage Editor** và **Page Content Editor** là 2 editor riêng biệt
2. **Homepage** có cấu trúc dữ liệu khác (heroSlides, sections) so với **About/Contact** (layout, visibility)
3. Tất cả thay đổi được lưu vào database (`page_content` table)
4. Có fallback về localStorage nếu Supabase không available

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Ready to use
