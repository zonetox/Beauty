# XÁC NHẬN: REFACTOR vs NEW BUILD

**Ngày tạo:** 2025-01-05  
**Mục đích:** Xác nhận rõ ràng Master Plan là REFACTOR/CHUẨN HÓA, không phải xây mới

---

## 🎯 XÁC NHẬN CHÍNH THỨC

### Master Plan là gì?

**✅ REFACTOR / CHUẨN HÓA / HOÀN THIỆN** - KHÔNG PHẢI XÂY MỚI

**Mục tiêu:**
- Chuẩn hóa hệ thống hiện có (đã có code, database, UI)
- Consolidate các file rời rạc thành 1 source of truth
- Document flows và architecture
- Fix inconsistencies
- Hoàn thiện những gì còn thiếu

**KHÔNG phải:**
- ❌ Xây hệ thống mới từ đầu
- ❌ Tạo duplicate systems
- ❌ Làm song song 2 hệ thống
- ❌ Phá hệ thống hiện tại

---

## 📋 BẰNG CHỨNG TỪ CÁC PHẦN ĐÃ LÀM

### A1 - Architecture & Principles
**Hành động:** Document triết lý hiện có
- ✅ Tạo `ARCHITECTURE.md` - document principles
- ❌ KHÔNG tạo architecture mới
- ❌ KHÔNG thay đổi architecture hiện có

### A2 - Database Schema Consolidation
**Hành động:** Consolidate các SQL files rời rạc
- ✅ Merge 24 SQL files thành 1 `schema_v1.0.sql`
- ✅ Archive old files vào `database/archive/`
- ✅ Migration script để align existing DB (không tạo mới)
- ❌ KHÔNG tạo schema mới song song
- ❌ KHÔNG tạo `schema_v2` hay `schema_new`

**Bằng chứng:**
- `database/schema_v1.0.sql` - consolidated từ existing files
- `database/archive/` - 24 legacy files archived (không xóa, chỉ archive)
- `database/migrations/20250105000000_align_to_schema_v1.0.sql` - align existing DB

### A3 - RLS Policies
**Hành động:** Tạo RLS policies cho existing tables
- ✅ Tạo policies cho 17 existing tables
- ❌ KHÔNG tạo tables mới
- ❌ KHÔNG tạo duplicate policies

### A4 - Storage Policies
**Hành động:** Tạo storage policies cho existing buckets
- ✅ Tạo policies cho 4 existing buckets
- ❌ KHÔNG tạo buckets mới
- ❌ KHÔNG tạo duplicate policies

### B1-B3 - Auth & Registration Flows
**Hành động:** Document existing flows
- ✅ Document user registration flow (existing)
- ✅ Document business registration flow (existing)
- ✅ Document approval flow (existing)
- ❌ KHÔNG tạo flows mới
- ❌ KHÔNG tạo duplicate flows

### C1 - Frontend Architecture Audit
**Hành động:** Audit existing frontend structure
- ✅ Rà soát existing folder structure
- ✅ Document existing patterns
- ✅ Recommend improvements (không implement ngay)
- ❌ KHÔNG tạo structure mới
- ❌ KHÔNG tạo duplicate contexts/components

---

## 🚨 CAM KẾT GIÁM SÁT

### Quy tắc giám sát

**1. Trước mỗi task, phải kiểm tra:**
- ✅ File/component/table này đã tồn tại chưa?
- ✅ Có duplicate không?
- ✅ Có đang tạo song song không?

**2. Nếu phát hiện duplicate:**
- 🛑 **DỪNG LẠI NGAY**
- 📢 **BÁO CÁO CHO USER**
- ❓ **HỎI Ý KIẾN USER** trước khi tiếp tục

**3. Checklist trước khi tạo file mới:**
- [ ] File này đã tồn tại chưa? → Nếu có, sửa file cũ, không tạo mới
- [ ] Có file tương tự không? → Nếu có, merge vào file cũ
- [ ] Có đang tạo song song không? → Nếu có, dừng lại và hỏi user

**4. Checklist trước khi tạo table/component/context mới:**
- [ ] Table/component/context này đã tồn tại chưa?
- [ ] Có duplicate logic không?
- [ ] Có thể sử dụng existing không?

---

## 📊 KIỂM TRA HIỆN TRẠNG

### Database
- ✅ **1 schema duy nhất:** `schema_v1.0.sql` (LOCKED)
- ✅ **Old files archived:** `database/archive/` (24 files)
- ✅ **Migration script:** Chỉ để align existing DB
- ❌ **KHÔNG có:** `schema_v2`, `schema_new`, duplicate schemas

### Frontend
- ✅ **Existing contexts:** 26 contexts (đã có sẵn)
- ✅ **Existing components:** 70+ components (đã có sẵn)
- ✅ **Existing pages:** 19 pages (đã có sẵn)
- ❌ **KHÔNG tạo:** Contexts/components/pages mới song song

### Edge Functions
- ✅ **Existing functions:** 4 functions (đã có sẵn)
- ✅ **Document existing:** Không tạo mới
- ❌ **KHÔNG tạo:** Duplicate functions

---

## 🔍 QUY TRÌNH PHÁT HIỆN DUPLICATE

### Bước 1: Kiểm tra trước khi tạo
```
1. Tìm file/table/component tương tự
2. Nếu tìm thấy → Sử dụng existing, không tạo mới
3. Nếu không tìm thấy → Tạo mới (nhưng vẫn cẩn thận)
```

### Bước 2: Nếu phát hiện duplicate trong quá trình làm
```
1. DỪNG LẠI NGAY
2. Báo cáo cho user:
   - File/table/component nào bị duplicate?
   - File/table/component nào đã tồn tại?
   - Đề xuất: Merge hay giữ cả hai?
3. Chờ user quyết định
4. Chỉ tiếp tục sau khi user approve
```

### Bước 3: Sau khi hoàn thành task
```
1. Kiểm tra lại: Có duplicate không?
2. Nếu có → Báo cáo và fix ngay
3. Nếu không → Mark task complete
```

---

## ✅ CAM KẾT CỦA AI

**Tôi cam kết:**

1. ✅ **Luôn kiểm tra duplicate trước khi tạo file/table/component mới**
2. ✅ **Nếu phát hiện duplicate → DỪNG LẠI và hỏi user**
3. ✅ **Chỉ làm REFACTOR/CONSOLIDATE, không xây mới**
4. ✅ **Sử dụng existing code/files, không tạo song song**
5. ✅ **Báo cáo ngay nếu có nghi ngờ duplicate**

**Tôi sẽ KHÔNG:**
- ❌ Tạo duplicate systems
- ❌ Làm song song 2 hệ thống
- ❌ Phá hệ thống hiện tại
- ❌ Tự ý tạo mới mà không kiểm tra existing

---

## 📝 GHI CHÚ

- Master Plan là **REFACTOR/CHUẨN HÓA**, không phải xây mới
- Tất cả tasks đều dựa trên **existing code/database**
- Mục tiêu: **Consolidate, Document, Standardize** - không phải **Build New**
- Nếu có nghi ngờ → **DỪNG LẠI và hỏi user**

---

**Version:** 1.0  
**Status:** ACTIVE  
**Last Updated:** 2025-01-05

