# CHECKLIST THIẾT LẬP THỦ CÔNG - 1BEAUTY.ASIA
**Ngày:** 2025-01-08  
**Mục đích:** Hoàn thiện 2 bước còn lại sau khi apply migrations

---

## ✅ BƯỚC 1: ENABLE LEAKED PASSWORD PROTECTION

### Mục đích
Bảo vệ users khỏi việc sử dụng passwords đã bị leak trên internet (HaveIBeenPwned database).

### Hướng dẫn chi tiết

1. **Đăng nhập Supabase Dashboard**
   - Truy cập: https://supabase.com/dashboard
   - Chọn project của bạn

2. **Điều hướng đến Auth Settings**
   - Menu bên trái → **Authentication**
   - Click vào **Policies** hoặc **Password Security** (tùy version)

3. **Enable Leaked Password Protection**
   - Tìm section: **"Password Security"** hoặc **"Password Strength"**
   - Tìm toggle: **"Leaked password protection"** hoặc **"Check passwords against HaveIBeenPwned"**
   - **Bật toggle** (chuyển sang ON/Enabled)

4. **Verify**
   - Thử tạo user mới với password đã bị leak (ví dụ: "password123")
   - System sẽ từ chối và yêu cầu password mạnh hơn
   - ✅ **DONE** - Bước 1 hoàn thành

### Screenshot Locations (nếu cần)
- Path trong Dashboard: `Authentication → Password Security → Leaked password protection`

### Lưu ý
- Feature này không ảnh hưởng đến users hiện tại
- Chỉ áp dụng cho password mới khi đăng ký hoặc đổi password
- Không có performance impact đáng kể

---

## ✅ BƯỚC 2: VERIFY & SETUP STORAGE BUCKETS

### Mục đích
Đảm bảo 4 storage buckets đã được tạo và policies đã được apply để ứng dụng có thể upload/download files.

### Hướng dẫn chi tiết

#### 2.1. Kiểm tra Buckets đã tồn tại

1. **Điều hướng đến Storage**
   - Menu bên trái → **Storage**
   - Xem danh sách buckets

2. **Kiểm tra 4 buckets sau:**
   - ✅ `avatars` - User profile avatars
   - ✅ `business-logos` - Business logos
   - ✅ `business-gallery` - Business gallery images
   - ✅ `blog-images` - Blog post images

3. **Nếu thiếu buckets → Tạo mới (xem 2.2)**
4. **Nếu đã có → Verify policies (xem 2.3)**

---

#### 2.2. Tạo Buckets (nếu chưa có)

**Lưu ý:** Mỗi bucket phải là **PUBLIC** (public read access)

##### Bucket 1: `avatars`
1. Click **"New bucket"** hoặc **"Create bucket"**
2. **Name:** `avatars`
3. **Public bucket:** ✅ **BẬT** (ON)
4. **File size limit:** 5 MB (recommended)
5. **Allowed MIME types:** `image/*` (optional)
6. Click **"Create bucket"**

##### Bucket 2: `business-logos`
1. Click **"New bucket"** hoặc **"Create bucket"**
2. **Name:** `business-logos`
3. **Public bucket:** ✅ **BẬT** (ON)
4. **File size limit:** 5 MB (recommended)
5. **Allowed MIME types:** `image/*` (optional)
6. Click **"Create bucket"**

##### Bucket 3: `business-gallery`
1. Click **"New bucket"** hoặc **"Create bucket"**
2. **Name:** `business-gallery`
3. **Public bucket:** ✅ **BẬT** (ON)
4. **File size limit:** 10 MB (recommended, vì có thể có nhiều images)
5. **Allowed MIME types:** `image/*,video/*` (optional)
6. Click **"Create bucket"**

##### Bucket 4: `blog-images`
1. Click **"New bucket"** hoặc **"Create bucket"**
2. **Name:** `blog-images`
3. **Public bucket:** ✅ **BẬT** (ON)
4. **File size limit:** 5 MB (recommended)
5. **Allowed MIME types:** `image/*` (optional)
6. Click **"Create bucket"**

---

#### 2.3. Apply Storage Policies

**Option 1: Apply qua SQL Editor (Recommended)**

1. **Mở SQL Editor**
   - Menu bên trái → **SQL Editor**
   - Click **"New query"**

2. **Copy và chạy script**
   - Mở file: `database/storage_policies_v1.sql`
   - Copy toàn bộ nội dung
   - Paste vào SQL Editor
   - Click **"Run"** hoặc **"Execute"**

3. **Verify policies đã apply**
   - Quay lại **Storage** → Chọn một bucket
   - Click tab **"Policies"**
   - Kiểm tra có các policies:
     - `{bucket_name}_select_public`
     - `{bucket_name}_insert_owner_or_admin` (hoặc tương tự)
     - `{bucket_name}_update_owner_or_admin`
     - `{bucket_name}_delete_owner_or_admin`

**Option 2: Apply qua Dashboard (Manual)**

Nếu SQL script không chạy được, có thể tạo policies thủ công qua Dashboard:

1. **Vào Storage → Chọn bucket**
2. **Click tab "Policies"**
3. **Tạo policies theo pattern:**

**Ví dụ cho bucket `avatars`:**

**Policy 1: SELECT (Public read)**
- Policy name: `avatars_select_public`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'avatars'`

**Policy 2: INSERT (Own only)**
- Policy name: `avatars_insert_own`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression:
  ```sql
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '/', 1) = 'user'
  AND split_part(name, '/', 2) = auth.uid()::TEXT
  ```

**Policy 3: UPDATE (Own or admin)**
- Policy name: `avatars_update_own_or_admin`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'avatars'
  AND (
    (split_part(name, '/', 1) = 'user'
    AND split_part(name, '/', 2) = auth.uid()::TEXT)
    OR public.is_admin()
  )
  ```

**Policy 4: DELETE (Own or admin)**
- Policy name: `avatars_delete_own_or_admin`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'avatars'
  AND (
    (split_part(name, '/', 1) = 'user'
    AND split_part(name, '/', 2) = auth.uid()::TEXT)
    OR public.is_admin()
  )
  ```

**Lặp lại cho 3 buckets còn lại** với tên bucket tương ứng.

---

#### 2.4. Verify Storage Setup

1. **Test upload (nếu có quyền)**
   - Thử upload một file test vào bucket `avatars`
   - Verify file có thể access được qua public URL

2. **Check policies count**
   - Mỗi bucket nên có **4 policies** (SELECT, INSERT, UPDATE, DELETE)
   - Tổng: 16 policies cho 4 buckets

3. **Verify helper functions exist**
   - SQL Editor → Run:
     ```sql
     SELECT proname 
     FROM pg_proc 
     WHERE proname IN ('is_admin', 'is_business_owner', 'get_user_email', 'extract_business_id_from_path', 'extract_user_id_from_path');
     ```
   - Phải có 5 functions

---

## ✅ CHECKLIST TỔNG HỢP

### Bước 1: Leaked Password Protection
- [ ] Đăng nhập Supabase Dashboard
- [ ] Vào Authentication → Password Security
- [ ] Enable "Leaked password protection"
- [ ] Test với password yếu (verify bị reject)
- [ ] ✅ **DONE**

### Bước 2: Storage Buckets
- [ ] Kiểm tra 4 buckets đã tồn tại
  - [ ] `avatars`
  - [ ] `business-logos`
  - [ ] `business-gallery`
  - [ ] `blog-images`
- [ ] Tạo buckets thiếu (nếu có)
- [ ] Apply storage policies (SQL script hoặc manual)
- [ ] Verify mỗi bucket có 4 policies
- [ ] Verify helper functions exist
- [ ] Test upload (optional)
- [ ] ✅ **DONE**

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành 2 bước trên:

1. ✅ **Security:** Leaked password protection enabled
2. ✅ **Storage:** 4 buckets created với đầy đủ policies
3. ✅ **Application:** Có thể upload/download files
4. ✅ **Production Ready:** 100% hoàn thiện

---

## 📝 NOTES

- **Thời gian ước tính:** 15-30 phút
- **Khó khăn:** Trung bình (cần hiểu cơ bản về Supabase Dashboard)
- **Rủi ro:** Thấp (không ảnh hưởng đến data hiện tại)

---

## 🆘 TROUBLESHOOTING

### Issue 1: Không tìm thấy "Password Security" trong Dashboard
- **Solution:** Có thể ở tab "Policies" hoặc "Settings" trong Authentication
- **Alternative:** Tìm trong "Auth" → "Configuration"

### Issue 2: Storage policies không apply được
- **Solution:** Kiểm tra helper functions đã tồn tại chưa
- **Run:** `database/rls_policies_v1.sql` trước (nếu chưa chạy)

### Issue 3: Bucket không public
- **Solution:** Edit bucket → Toggle "Public bucket" → Save

---

**Last Updated:** 2025-01-08  
**Status:** ⚠️ Pending manual steps
