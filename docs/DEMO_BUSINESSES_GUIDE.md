# 🏢 HƯỚNG DẪN TẠO DOANH NGHIỆP DEMO

**Ngày tạo:** 2025-01-13  
**Mục đích:** Tạo các doanh nghiệp demo cho mỗi địa phương để giới thiệu khách hàng tiềm năng

---

## 📋 TỔNG QUAN

Script SQL này sẽ tạo **5 doanh nghiệp demo** cho 5 địa phương chính:

1. **TP. Hồ Chí Minh** - Spa & Massage (Spa Sài Gòn Premium)
2. **Hà Nội** - Hair Salon (Salon Hà Nội Trendy)
3. **Đà Nẵng** - Nail Salon (Nail Đà Nẵng Elegant)
4. **Hải Phòng** - Beauty Clinic (Clinic Hải Phòng Beauty)
5. **Cần Thơ** - Dental Clinic (Clinic Cần Thơ Dental)

---

## ✅ MỖI DOANH NGHIỆP BAO GỒM

### 1. **Thông tin cơ bản:**
- ✅ Tên doanh nghiệp
- ✅ Slug (URL-friendly)
- ✅ Logo và hình ảnh chính
- ✅ Slogan
- ✅ Địa chỉ đầy đủ (city, district, ward)
- ✅ Tọa độ GPS (latitude, longitude)
- ✅ Số điện thoại, email, website
- ✅ Mô tả chi tiết
- ✅ Tags và categories

### 2. **Dịch vụ (Services):**
- ✅ 4 dịch vụ mẫu cho mỗi doanh nghiệp
- ✅ Giá cả, mô tả, hình ảnh
- ✅ Thời gian thực hiện

### 3. **Ưu đãi (Deals):**
- ✅ 2 ưu đãi mẫu cho mỗi doanh nghiệp
- ✅ Giá gốc, giá ưu đãi
- ✅ Thời gian hiệu lực

### 4. **Đánh giá (Reviews):**
- ✅ 3 đánh giá mẫu cho mỗi doanh nghiệp
- ✅ Rating 4-5 sao
- ✅ Comment chi tiết
- ✅ Avatar người dùng

### 5. **Hình ảnh (Media):**
- ✅ 3 hình ảnh mẫu cho mỗi doanh nghiệp
- ✅ Phân loại: Interior, Staff, Products

### 6. **Cài đặt khác:**
- ✅ Working hours (giờ làm việc)
- ✅ Social media links
- ✅ Membership tier (Premium/VIP)
- ✅ Verified, Active, Featured status
- ✅ Rating và view count

---

## 🚀 CÁCH CHẠY SCRIPT

### **Cách 1: Sử dụng Supabase Dashboard**

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `database/migrations/20250113000000_create_demo_businesses.sql`
5. Paste vào SQL Editor
6. Click **Run** để thực thi

### **Cách 2: Sử dụng Supabase CLI**

```bash
# Nếu bạn đã cài Supabase CLI
supabase db push

# Hoặc chạy trực tiếp
psql -h <your-db-host> -U postgres -d postgres -f database/migrations/20250113000000_create_demo_businesses.sql
```

### **Cách 3: Sử dụng MCP Supabase**

Nếu bạn đã cấu hình MCP Supabase, có thể chạy migration trực tiếp:

```sql
-- Copy nội dung file và chạy qua MCP
```

---

## 📊 KẾT QUẢ SAU KHI CHẠY

Sau khi chạy script thành công, bạn sẽ có:

- ✅ **5 doanh nghiệp demo** với đầy đủ thông tin
- ✅ **20 dịch vụ** (4 dịch vụ × 5 doanh nghiệp)
- ✅ **10 ưu đãi** (2 ưu đãi × 5 doanh nghiệp)
- ✅ **15 đánh giá** (3 đánh giá × 5 doanh nghiệp)
- ✅ **15 hình ảnh** (3 hình ảnh × 5 doanh nghiệp)

---

## 🎨 CHI TIẾT TỪNG DOANH NGHIỆP

### 1. **Spa Sài Gòn Premium** (TP. Hồ Chí Minh)
- **Category:** Spa & Massage
- **Location:** Quận 1, TP. Hồ Chí Minh
- **Membership:** Premium
- **Rating:** 4.8/5 (127 reviews)
- **Services:** Massage, Chăm sóc da, Tắm hơi, Body scrub
- **Highlights:** Không gian sang trọng, dịch vụ premium

### 2. **Salon Hà Nội Trendy** (Hà Nội)
- **Category:** Hair Salon
- **Location:** Hoàn Kiếm, Hà Nội
- **Membership:** Premium
- **Rating:** 4.7/5 (98 reviews)
- **Services:** Cắt tóc, Nhuộm balayage, Uốn/duỗi, Chăm sóc tóc
- **Highlights:** Stylist chuyên nghiệp, xu hướng mới nhất

### 3. **Nail Đà Nẵng Elegant** (Đà Nẵng)
- **Category:** Nail Salon
- **Location:** Hải Châu, Đà Nẵng
- **Membership:** Premium
- **Rating:** 4.9/5 (156 reviews)
- **Services:** Sơn gel, Nail art, Chăm sóc móng, Đắp móng
- **Highlights:** Nail art độc đáo, sản phẩm cao cấp

### 4. **Clinic Hải Phòng Beauty** (Hải Phòng)
- **Category:** Beauty Clinic
- **Location:** Ngô Quyền, Hải Phòng
- **Membership:** VIP
- **Rating:** 4.8/5 (134 reviews)
- **Services:** Trị mụn, Laser, Peel da, Chăm sóc da
- **Highlights:** Công nghệ hiện đại, bác sĩ chuyên nghiệp

### 5. **Clinic Cần Thơ Dental** (Cần Thơ)
- **Category:** Dental Clinic
- **Location:** Ninh Kiều, Cần Thơ
- **Membership:** VIP
- **Rating:** 4.9/5 (142 reviews)
- **Services:** Khám răng, Niềng răng, Tẩy trắng, Implant
- **Highlights:** Trang thiết bị hiện đại, bác sĩ giàu kinh nghiệm

---

## 🖼️ HÌNH ẢNH

Tất cả hình ảnh sử dụng **Unsplash** với các seed khác nhau để đảm bảo:
- ✅ Hình ảnh chất lượng cao
- ✅ Phù hợp với từng loại dịch vụ
- ✅ Không bị trùng lặp

**Lưu ý:** Trong production, bạn nên thay thế bằng hình ảnh thật của doanh nghiệp.

---

## ⚠️ LƯU Ý

1. **Slug phải unique:** Script đã đảm bảo mỗi doanh nghiệp có slug riêng
2. **Owner ID:** Các doanh nghiệp demo không có `owner_id` (NULL), phù hợp cho demo
3. **Hình ảnh:** Sử dụng Unsplash, có thể thay thế sau
4. **Dữ liệu mẫu:** Tất cả dữ liệu là mẫu, phù hợp cho demo/showcase

---

## 🔄 XÓA DỮ LIỆU DEMO (Nếu cần)

Nếu muốn xóa các doanh nghiệp demo:

```sql
-- Xóa các doanh nghiệp demo
DELETE FROM public.businesses
WHERE slug IN (
    'spa-saigon-premium',
    'salon-hanoi-trendy',
    'nail-danang-elegant',
    'clinic-haiphong-beauty',
    'clinic-cantho-dental'
);

-- Lưu ý: Các bảng liên quan (services, deals, reviews, media_items) 
-- sẽ tự động xóa do CASCADE constraint
```

---

## ✅ VERIFICATION

Script tự động kiểm tra sau khi chạy:
- ✅ Đếm số doanh nghiệp đã tạo
- ✅ Hiển thị thông báo thành công/thất bại

---

## 🎯 MỤC ĐÍCH SỬ DỤNG

Các doanh nghiệp demo này phù hợp cho:
- ✅ **Showcase platform:** Giới thiệu khách hàng tiềm năng
- ✅ **Testing:** Test các tính năng của platform
- ✅ **Demo:** Demo cho nhà đầu tư, đối tác
- ✅ **Development:** Phát triển và test UI/UX

---

## 📝 CẬP NHẬT

Nếu muốn thêm doanh nghiệp demo cho địa phương khác:
1. Copy pattern từ một doanh nghiệp hiện có
2. Thay đổi thông tin phù hợp
3. Thêm vào script migration
4. Chạy lại migration

---

**Báo cáo được tạo bởi:** AI Assistant  
**Ngày:** 2025-01-13  
**Version:** 1.0.0
