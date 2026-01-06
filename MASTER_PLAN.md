# MASTER PLAN – KẾ HOẠCH HOÀN THIỆN 100% 1Beauty.asia

**⚠️ QUAN TRỌNG: Đây là "xương sống" triển khai, KHÔNG ĐƯỢC LÀM LỆCH THỨ TỰ**

**Ngày tạo:** $(date)  
**Version:** 1.1 (Clarification & Rebase)  
**Trạng thái:** Đang triển khai

---

## 🚨 CAM KẾT NGUYÊN TẮC (RẤT QUAN TRỌNG – CHỐT NGAY)

**⚠️ ĐỌC KỸ PHẦN NÀY TRƯỚC KHI BẮT ĐẦU BẤT KỲ MỤC NÀO**

Mình đồng ý 100% và cam kết giữ tuyệt đối các nguyên tắc sau, từ đầu đến cuối dự án:

### ✅ CAM KẾT TUYỆT ĐỐI

1. **KHÔNG LAN MAN – KHÔNG RẼ NHÁNH**
   - Chỉ làm đúng những gì trong Master Plan
   - Không tự ý thêm features ngoài kế hoạch
   - Không làm các mục không liên quan

2. **ĐI ĐÚNG THỨ TỰ A → B → C → D → E → F → G → H**
   - Phải hoàn thành Phần A trước khi bắt đầu Phần B
   - Phải hoàn thành tất cả mục trong một phần trước khi chuyển phần
   - Không được nhảy cóc, bỏ qua mục nào

3. **MỖI MỤC = HOÀN THIỆN 100% → KIỂM TRA → CHỐT → MỚI ĐƯỢC QUA**
   - Mỗi mục phải hoàn thiện 100% trước khi chuyển mục tiếp theo
   - Phải kiểm tra kỹ lưỡng sau khi hoàn thành
   - Phải chốt và đánh dấu hoàn thành trước khi tiếp tục

4. **KHÔNG CẮT NGẮN – KHÔNG RÚT GỌN SAU VÀI PHIÊN CHAT**
   - Không được rút gọn scope vì "mệt" hoặc "lâu"
   - Không được bỏ qua deliverables
   - Phải làm đầy đủ như đã định nghĩa

5. **KHÔNG "TẠM ĐƯỢC" – KHÔNG TODO – KHÔNG PLACEHOLDER**
   - Không được để code tạm
   - Không được để TODO comments
   - Không được để placeholder functions
   - Mọi thứ phải hoàn chỉnh, chạy được

6. **KHÔNG ĐỂ AI (KỂ CẢ CURSOR) LÁI KẾ HOẠCH**
   - Chỉ làm theo Master Plan
   - Nếu AI đề xuất điều gì ngoài kế hoạch → từ chối
   - Nếu AI muốn thay đổi thứ tự → từ chối

7. **MỌI QUYẾT ĐỊNH CUỐI CÙNG PHẢI PHÙ HỢP MASTER PLAN**
   - Mọi thay đổi phải được review với Master Plan
   - Nếu conflict → ưu tiên Master Plan
   - Nếu cần thay đổi Master Plan → phải được approve trước

---

## 🔁 EXECUTION PROTOCOL (QUY TRÌNH TRIỂN KHAI BẮT BUỘC)

**⚠️ ÁP DỤNG CHO TỪNG MỤC NHỎ (ví dụ: A2.1, A2.2, A3.1…)**

Mỗi mục đều phải đi theo chu kỳ 6 bước sau. **KHÔNG ĐƯỢC BỎ QUA BƯỚC NÀO.**

### 1️⃣ PHÂN TÍCH HIỆN TRẠNG (READ-ONLY)

**Mục đích:** Hiểu rõ tình trạng hiện tại trước khi làm gì

**Quy tắc:**
- ❌ KHÔNG code
- ❌ KHÔNG sửa
- ❌ KHÔNG đề xuất giải pháp vội
- ✅ CHỈ đọc, phân tích, liệt kê

**Câu hỏi phải trả lời:**
- Đang có gì?
- File nào liên quan?
- Bảng/cột nào trong database?
- Code hiện tại như thế nào?
- Rủi ro gì có thể xảy ra?
- Có conflict gì không?

**👉 Nếu chưa xong bước này → KHÔNG ĐƯỢC làm bước 2**

**Output:** Báo cáo hiện trạng (có thể viết ngắn gọn, nhưng phải đầy đủ)

---

### 2️⃣ ĐỊNH NGHĨA "HOÀN THIỆN 100%" (DEFINITION OF DONE)

**Mục đích:** Xác định rõ ràng khi nào gọi là XONG

**Quy tắc:**
- Phải viết rõ, cụ thể
- Có thể đo lường được
- Có thể verify được

**Câu hỏi phải trả lời:**
- Khi nào gọi là XONG?
- Output bắt buộc là gì?
- File nào phải tồn tại?
- Test nào phải pass?
- Checklist nào phải đầy đủ?
- Có SQL nào cần tạo không?
- Có documentation nào cần viết không?

**👉 Không rõ "xong là gì" → KHÔNG ĐƯỢC code**

**Output:** Definition of Done cho mục này (viết rõ ràng, cụ thể)

---

### 3️⃣ CHECKLIST KỸ THUẬT (LOCK SCOPE)

**Mục đích:** Xác định rõ phạm vi công việc, tránh làm lan man

**Quy tắc:**
- Liệt kê TẤT CẢ việc cần làm
- Liệt kê TẤT CẢ việc KHÔNG được làm
- Lock scope - không mở rộng

**Checklist phải có:**
- ✅ Danh sách việc được phép làm
- ❌ Danh sách việc cấm làm
- 📝 Files sẽ được tạo/sửa
- 🗄️ Database changes (nếu có)
- 🧪 Tests cần làm (nếu có)

**👉 Cái gì ngoài checklist → KHÔNG ĐƯỢC ĐỤNG**

**Output:** Checklist kỹ thuật (có thể dùng format trong Master Plan, nhưng phải cụ thể hóa)

---

### 4️⃣ CHỈ THỊ CHO CURSOR (PROMPT CHÍNH THỨC)

**Mục đích:** Đưa ra chỉ thị rõ ràng, không vòng vo

**Quy tắc:**
- 1 prompt duy nhất, rõ ràng
- Không vòng vo
- Không mở rộng
- Không "tự suy luận thêm"
- Dựa trên bước 1, 2, 3

**Prompt phải bao gồm:**
- Mục tiêu cụ thể
- Scope (từ checklist)
- Definition of Done
- Constraints (từ Master Plan)
- Deliverables mong đợi

**Output:** Prompt sẵn sàng để gửi cho Cursor/AI

---

### 5️⃣ KIỂM TRA – SOI LỖI – CHỐT

**Mục đích:** Đảm bảo output đúng như mong đợi

**Quy tắc:**
- Phải kiểm tra kỹ lưỡng
- Soi lỗi nghiêm ngặt
- Chỉ chốt khi thực sự hoàn thành

**Checklist kiểm tra:**
- ✅ Đối chiếu với Master Plan
- ✅ Đối chiếu với Definition of Done
- ✅ Đối chiếu với Checklist kỹ thuật
- ✅ Test (nếu có)
- ✅ Code review (nếu có)
- ✅ Documentation (nếu có)

**Nếu:**
- ❌ SAI → quay lại bước 4 (có thể cần điều chỉnh prompt)
- ✅ ĐÚNG → ĐÁNH DẤU HOÀN THÀNH

**Output:** Kết quả kiểm tra (Pass/Fail) + Lý do

---

### 6️⃣ GHI NHẬN TIẾN ĐỘ

**Mục đích:** Cập nhật tiến độ và đánh dấu mục đã hoàn thành

**Quy tắc:**
- Cập nhật ngay sau khi chốt
- Không được quên
- Phải đầy đủ thông tin

**Nội dung cập nhật:**
- Đánh dấu checkbox trong `TIEN_DO_HOAN_THIEN.md`
- Ghi ngày hoàn thành
- Ghi người thực hiện (nếu có)
- Ghi ghi chú (nếu có)
- List deliverables đã tạo
- **Đánh dấu trạng thái:** DONE / UI_COMPLETE / REVIEW_LATER (xem định nghĩa bên dưới)
- Chốt: "MỤC NÀY ĐÃ ĐÓNG – KHÔNG ĐƯỢC SỬA LẠI TRỪ KHI CÓ BUG NGHIÊM TRỌNG"

**Output:** File `TIEN_DO_HOAN_THIEN.md` được cập nhật

---

## 📋 COMPLETION EVIDENCE (LITE) - v1.1

**⚠️ THAY ĐỔI QUAN TRỌNG:** Từ v1.1, không còn yêu cầu tạo Completion Report file riêng.

### Định nghĩa Completion Evidence (Lite)

**Completion Evidence (Lite)** cho mỗi mục bao gồm:

1. **Code diff đã hoàn thiện**
   - ✅ Code không có TODO
   - ✅ Code không có placeholder
   - ✅ Code chạy được, không lỗi

2. **SQL verification script** (nếu mục có liên quan database)
   - ✅ File trong `database/verifications/`
   - ✅ Script idempotent, có thể chạy nhiều lần
   - ✅ Verify schema, RLS, data integrity

3. **Update đầy đủ vào TIEN_DO_HOAN_THIEN.md**
   - ✅ Đánh dấu checkbox
   - ✅ Ghi deliverables
   - ✅ Ghi trạng thái (DONE / UI_COMPLETE / REVIEW_LATER)
   - ✅ Ghi notes nếu cần

**➡️ Completion Evidence (Lite) được xem là bằng chứng hoàn thành hợp lệ.**

**❌ KHÔNG cần:**
- Completion Report file riêng (`docs/*_completion_report.md`)
- Báo cáo dài dòng
- Documentation chi tiết ngoài code comments

---

## 🏷️ TRẠNG THÁI TIẾN ĐỘ - v1.1

**Các trạng thái chính thức trong TIEN_DO_HOAN_THIEN.md:**

### DONE
- ✅ Hoàn thiện 100%, đã khóa
- ✅ Code production-ready
- ✅ Logic hoàn chỉnh
- ✅ **Quy tắc:** Không được sửa mục DONE trừ khi có bug nghiêm trọng

### UI_COMPLETE
- ✅ UI hoàn chỉnh
- ✅ CRUD hoạt động
- ✅ RLS-safe
- ✅ Không placeholder
- ⚠️ Business logic nâng cao sẽ được audit lại ở Phase D

### REVIEW_LATER
- ✅ Đã chạy được
- ✅ UI + CRUD cơ bản OK
- ⚠️ Cần audit lại ở phase logic (Phase D)
- ⚠️ Có thể có business rules chưa đầy đủ

**Quy tắc:**
- Các mục UI_COMPLETE / REVIEW_LATER sẽ được audit lại ở Phase D
- KHÔNG xóa code
- KHÔNG làm lại UI
- CHỈ audit logic khi đến Phase D

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Mỗi mục phải đi qua đủ 6 bước trên**
2. **Không được bỏ qua bước nào, dù có vẻ "nhỏ"**
3. **Nếu thấy mình đang làm sai quy trình → DỪNG LẠI và làm lại đúng**
4. **Nếu AI (Cursor) đề xuất bỏ qua bước nào → TỪ CHỐI**
5. **Nếu AI muốn làm nhanh, rút gọn → TỪ CHỐI**
6. **Luôn đối chiếu với Master Plan trước khi quyết định**

---

## 📋 QUY TẮC TRIỂN KHAI (TÓM TẮT)

1. **Thứ tự bắt buộc:** Phải làm theo thứ tự A → B → C → D → E → F → G → H
2. **Hoàn thiện 100%:** Mỗi mục phải hoàn thiện 100%, KHÔNG được để placeholder, TODO, hoặc code tạm
3. **SQL đầy đủ:** Nếu cần SQL, phải cung cấp SQL hoàn chỉnh, test được
4. **Báo cáo tiến độ:** Mỗi mục hoàn thành phải cập nhật vào `TIEN_DO_HOAN_THIEN.md`
5. **Database thật:** Tất cả database phải hoàn thiện 100% để vận hành thật sự
6. **Báo lỗi:** Nếu phát hiện sai sót từ AI, phải báo lại ngay
7. **Execution Protocol:** Mỗi mục phải đi qua đủ 6 bước (Phân tích → Định nghĩa → Checklist → Chỉ thị → Kiểm tra → Ghi nhận)

---

## PHẦN A – NỀN MÓNG BẮT BUỘC (KHÔNG ĐƯỢC LÀM SAI)

### A1. Chuẩn hóa kiến trúc & nguyên tắc triển khai

**Mục tiêu:** Xây dựng quy ước và triết lý làm nền tảng cho toàn bộ dự án

**Danh mục:**

- [ ] **A1.1** Định nghĩa quy ước:
  - [ ] `frontend ↔ backend ↔ database` data flow
  - [ ] Data ownership (ai sở hữu data nào)
  - [ ] Role & permission model
  - [ ] Single source of truth

- [ ] **A1.2** Chốt triết lý:
  - [ ] Supabase là backend duy nhất
  - [ ] Không bypass RLS
  - [ ] Không hardcode role ở frontend
  - [ ] Document triết lý trong file `ARCHITECTURE.md`

**⚠️ CẢNH BÁO:** Nếu bỏ qua A1 → dự án sẽ nát về sau

---

### A2. Chuẩn hóa DATABASE SCHEMA (CONSOLIDATION)

**Mục tiêu:** Chỉ tồn tại 1 schema chuẩn, không còn SQL rời rạc gây xung đột

**Danh mục:**

- [ ] **A2.1** Audit và liệt kê tất cả SQL files:
  - [ ] `supabase_new_schema.sql`
  - [ ] `supabase_schema.sql`
  - [ ] Tất cả files trong `supabase/migrations/`
  - [ ] Tất cả `fix_*.sql` files
  - [ ] Tất cả `optimize_*.sql` files
  - [ ] Tất cả `seed_*.sql` files
  - [ ] Tất cả `setup_*.sql` files

- [ ] **A2.2** Consolidate schema:
  - [ ] Tạo file `database/schema_v1.0.sql` - Schema duy nhất, chuẩn
  - [ ] Merge tất cả changes từ các file rời rạc
  - [ ] Resolve conflicts
  - [ ] Đảm bảo không mất data/structure nào

- [ ] **A2.3** Chuẩn hóa naming:
  - [ ] Table naming convention
  - [ ] Column naming convention (snake_case)
  - [ ] Enum naming convention
  - [ ] Index naming convention
  - [ ] Foreign key naming convention

- [ ] **A2.4** Định nghĩa foreign keys & cascade rules:
  - [ ] Liệt kê tất cả foreign keys
  - [ ] Quyết định ON DELETE CASCADE/NO ACTION/SET NULL
  - [ ] Quyết định ON UPDATE rules
  - [ ] Document trong schema

- [ ] **A2.5** Freeze schema v1.0:
  - [ ] Review toàn bộ schema
  - [ ] Test schema trên local Supabase
  - [ ] Tạo file `database/schema_v1.0_FINAL.sql`
  - [ ] Archive các file SQL cũ vào `database/archive/`
  - [ ] Update README với schema v1.0

**Deliverables:**
- `database/schema_v1.0_FINAL.sql` - Schema hoàn chỉnh, test được
- `database/migrations/` - Migrations chuẩn hóa (nếu cần)
- Document schema trong `database/README.md`

---

### A3. RLS & SECURITY AUDIT (CỰC KỲ QUAN TRỌNG)

**Mục tiêu:** Không user nào đọc/ghi được dữ liệu không thuộc quyền

**Danh mục:**

- [ ] **A3.1** Audit RLS cho mỗi bảng:
  - [ ] `businesses`
  - [ ] `services`
  - [ ] `deals`
  - [ ] `team_members`
  - [ ] `media_items`
  - [ ] `reviews`
  - [ ] `blog_posts`
  - [ ] `business_blog_posts`
  - [ ] `profiles`
  - [ ] `registration_requests`
  - [ ] `orders`
  - [ ] `appointments`
  - [ ] `support_tickets`
  - [ ] `admin_users`
  - [ ] Các bảng khác (homepage_data, page_content, app_settings, announcements, membership_packages)

- [ ] **A3.2** Policy cho mỗi operation:
  - [ ] SELECT policies (public data vs private data)
  - [ ] INSERT policies (ai được insert)
  - [ ] UPDATE policies (ai được update)
  - [ ] DELETE policies (ai được delete)

- [ ] **A3.3** Role-based policies:
  - [ ] Anonymous users
  - [ ] Logged-in users
  - [ ] Business owners (chỉ được modify business của mình)
  - [ ] Admin users (full access với điều kiện)
  - [ ] Staff members (future)

- [ ] **A3.4** Security audit:
  - [ ] Privilege escalation prevention
  - [ ] Public data vs private data boundary
  - [ ] Cross-tenant data leak prevention
  - [ ] SQL injection prevention (Supabase handles, nhưng cần verify)

- [ ] **A3.5** Test matrix:
  - [ ] Test với anonymous user
  - [ ] Test với logged-in user
  - [ ] Test với business owner (chỉ business của mình)
  - [ ] Test với business owner (business của người khác) → phải block
  - [ ] Test với admin
  - [ ] Test với moderator
  - [ ] Test với editor

- [ ] **A3.6** Tạo RLS policies file:
  - [ ] `database/rls_policies_v1.0.sql` - Tất cả RLS policies
  - [ ] Document từng policy
  - [ ] Test script để verify policies

**Deliverables:**
- `database/rls_policies_v1.0.sql` - RLS policies hoàn chỉnh
- `database/rls_test_script.sql` - Test script
- Document policies trong `database/SECURITY.md`

---

### A4. STORAGE & MEDIA SECURITY

**Mục tiêu:** Setup storage buckets và policies an toàn

**Danh mục:**

- [ ] **A4.1** Chuẩn hóa buckets:
  - [ ] `business-images` - Hình ảnh businesses
  - [ ] `business-logos` - Logos của businesses
  - [ ] `media-gallery` - Media items (gallery)
  - [ ] `user-avatars` - User avatars
  - [ ] `blog-images` - Blog images
  - [ ] Tạo SQL script để tạo buckets (nếu có thể) hoặc document manual steps

- [ ] **A4.2** Storage policies (upload):
  - [ ] Ai được upload vào bucket nào?
  - [ ] Size limits
  - [ ] File type restrictions
  - [ ] Path restrictions (ví dụ: `business-images/{business_id}/*`)

- [ ] **A4.3** Storage policies (download/view):
  - [ ] Public images (ai cũng xem được)
  - [ ] Private images (chỉ owner/admin xem được)
  - [ ] Business images (public nhưng path có business_id)
  - [ ] User avatars (public hoặc private)

- [ ] **A4.4** Path structure:
  - [ ] `business-images/{business_id}/{filename}`
  - [ ] `business-logos/{business_id}/{filename}`
  - [ ] `media-gallery/{business_id}/{filename}`
  - [ ] `user-avatars/{user_id}/{filename}`
  - [ ] `blog-images/{blog_id}/{filename}`
  - [ ] Tránh leak file qua path guessing

- [ ] **A4.5** Image optimization flow:
  - [ ] Upload → Optimize → Store
  - [ ] Thumbnails generation
  - [ ] CDN integration (nếu có)
  - [ ] Update `lib/storage.ts` và `lib/image.ts`

- [ ] **A4.6** Test storage:
  - [ ] Test upload với các roles
  - [ ] Test download/view với các roles
  - [ ] Test path security
  - [ ] Test file type validation
  - [ ] Test size limits

**Deliverables:**
- `database/storage_setup.sql` - Storage setup (nếu có thể)
- `database/STORAGE.md` - Storage documentation
- Updated `lib/storage.ts` với policies
- Test results

---

## PHẦN B – AUTH & ROLE SYSTEM (XƯƠNG SỐNG QUYỀN)

### B1. Auth Flow chuẩn hóa

**Mục tiêu:** Chuẩn hóa authentication flows cho tất cả user types

**Danh mục:**

- [ ] **B1.1** User auth flow:
  - [ ] Registration flow
  - [ ] Login flow
  - [ ] Logout flow
  - [ ] Password reset flow
  - [ ] Session management
  - [ ] Token refresh
  - [ ] Verify implementation trong `contexts/UserSessionContext.tsx`

- [ ] **B1.2** Business owner auth flow:
  - [ ] Registration request → Approval → Invite → First login
  - [ ] Business owner login
  - [ ] Link profile với business
  - [ ] Verify implementation trong `contexts/BusinessAuthContext.tsx`
  - [ ] Verify Edge Function `approve-registration`

- [ ] **B1.3** Admin auth flow:
  - [ ] Admin login (Supabase Auth + admin_users table lookup)
  - [ ] Disable DEV quick login ở production
  - [ ] Admin session management
  - [ ] Verify implementation trong `contexts/AdminContext.tsx`

- [ ] **B1.4** Token lifecycle:
  - [ ] Access token
  - [ ] Refresh token
  - [ ] Token expiry handling
  - [ ] Auto refresh logic

- [ ] **B1.5** Test auth flows:
  - [ ] Test user registration → login → logout
  - [ ] Test business registration → approval → invite → login
  - [ ] Test admin login
  - [ ] Test password reset
  - [ ] Test session persistence

**Deliverables:**
- Updated auth contexts (nếu cần)
- Document auth flows trong `docs/AUTHENTICATION.md`
- Test results

---

### B2. Role & Permission Model

**Mục tiêu:** Định nghĩa rõ ràng roles và permissions, mapping với frontend và backend

**Danh mục:**

- [ ] **B2.1** Define roles:
  - [ ] `User` - Regular user
  - [ ] `BusinessOwner` - Business owner
  - [ ] `Staff` - Staff member (future, nhưng cần define structure)
  - [ ] `Admin` - Full admin
  - [ ] `Moderator` - Limited admin
  - [ ] `Editor` - Content editor only

- [ ] **B2.2** Define permissions:
  - [ ] Map permissions với `AdminPermissions` interface trong `types.ts`
  - [ ] Define business owner permissions
  - [ ] Define user permissions
  - [ ] Define staff permissions (future)

- [ ] **B2.3** Frontend guards:
  - [ ] `ProtectedRoute` component
  - [ ] `AdminProtectedRoute` component
  - [ ] Permission-based UI rendering
  - [ ] Verify tất cả routes có protection đúng

- [ ] **B2.4** Backend RLS mapping:
  - [ ] Map frontend roles với RLS policies
  - [ ] Ensure RLS policies match role permissions
  - [ ] Document mapping

- [ ] **B2.5** Admin permissions JSON:
  - [ ] Verify `admin_users.permissions` JSONB structure
  - [ ] Default permissions cho mỗi role
  - [ ] Permission presets trong `constants.ts`

**Deliverables:**
- `docs/ROLES_AND_PERMISSIONS.md` - Document roles và permissions
- Updated constants/permissions (nếu cần)
- Verify frontend guards
- Verify RLS mapping

---

### B3. Registration & Approval Flow (END-TO-END)

**Mục tiêu:** Hoàn thiện flow từ registration đến business setup

**Danh mục:**

- [ ] **B3.1** Partner registration:
  - [ ] Form tại `/partner-registration`
  - [ ] Validation
  - [ ] Submit → `registration_requests` table
  - [ ] Email notification cho admin
  - [ ] Verify `pages/PartnerRegistrationPage.tsx`

- [ ] **B3.2** Admin approve:
  - [ ] Admin xem registration requests
  - [ ] Admin approve/reject
  - [ ] Verify admin UI

- [ ] **B3.3** Edge Function `approve-registration`:
  - [ ] Review code trong `supabase/functions/approve-registration/index.ts`
  - [ ] Create business record
  - [ ] Invite user via Supabase Auth
  - [ ] Send templated email
  - [ ] Create profile
  - [ ] Link profile với business
  - [ ] Update request status
  - [ ] Error handling & rollback
  - [ ] Test function

- [ ] **B3.4** Email invite:
  - [ ] Email template 'invite'
  - [ ] Invitation link
  - [ ] Email content
  - [ ] Test email sending

- [ ] **B3.5** First login:
  - [ ] User click invitation link
  - [ ] Set password
  - [ ] Login lần đầu
  - [ ] Redirect to onboarding

- [ ] **B3.6** Business onboarding wizard:
  - [ ] Wizard steps
  - [ ] Business profile setup
  - [ ] Initial services setup
  - [ ] Verify `components/BusinessOnboardingWizard.tsx`
  - [ ] Complete flow test

**Deliverables:**
- Tested registration → approval → invite → first login → onboarding flow
- Updated Edge Function (nếu cần)
- Email template
- Onboarding wizard hoàn chỉnh

---

## PHẦN C – FRONTEND HOÀN THIỆN (KHÔNG CHỈ "CÓ UI")

### C1. Frontend Architecture Audit

**Mục tiêu:** Cleanup và chuẩn hóa frontend architecture

**Danh mục:**

- [ ] **C1.1** Context cleanup:
  - [ ] Review tất cả 26 contexts
  - [ ] Identify duplicated logic
  - [ ] Merge hoặc remove duplicate contexts
  - [ ] Optimize context providers tree
  - [ ] Document context responsibilities

- [ ] **C1.2** Data-fetch pattern:
  - [ ] Chuẩn hóa data fetching trong contexts
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Refetch logic
  - [ ] Cache strategy (nếu có)

- [ ] **C1.3** Error boundary & loading state:
  - [ ] Error boundaries cho critical sections
  - [ ] Loading states consistent
  - [ ] Error messages user-friendly
  - [ ] Fallback UI

- [ ] **C1.4** Component structure:
  - [ ] Review component organization
  - [ ] Extract reusable components
  - [ ] Document component API

**Deliverables:**
- Cleaned up contexts
- Documented architecture trong `docs/FRONTEND_ARCHITECTURE.md`
- Error boundaries
- Consistent loading states

---

### C2. PUBLIC SITE (USER-FACING)

**Mục tiêu:** Hoàn thiện public-facing website

**Danh mục:**

- [ ] **C2.1** Homepage:
  - [ ] Hero slides (dynamic từ database)
  - [ ] Featured businesses section
  - [ ] Featured deals section
  - [ ] Featured blog section
  - [ ] Explore by location section
  - [ ] Newsletter signup
  - [ ] Recently viewed
  - [ ] Verify `pages/HomePage.tsx`
  - [ ] Test với data thật

- [ ] **C2.2** Directory search & filter:
  - [ ] Search functionality
  - [ ] Filter by category
  - [ ] Filter by location
  - [ ] Filter by tags
  - [ ] Sort options
  - [ ] Pagination
  - [ ] Map view
  - [ ] List view
  - [ ] Verify `pages/DirectoryPage.tsx`
  - [ ] Test search performance

- [ ] **C2.3** Business landing page:
  - [ ] Business detail page
  - [ ] Services listing
  - [ ] Deals/promotions
  - [ ] Gallery
  - [ ] Reviews & ratings
  - [ ] Team members
  - [ ] Business blog posts
  - [ ] Contact information
  - [ ] Map integration
  - [ ] Verify `pages/BusinessDetailPage.tsx`
  - [ ] Custom landing page (nếu business có custom landing)

- [ ] **C2.4** Blog platform:
  - [ ] Blog list page
  - [ ] Blog post detail
  - [ ] Categories
  - [ ] Search
  - [ ] Comments
  - [ ] Related posts
  - [ ] Verify `pages/BlogListPage.tsx` và `pages/BlogPostPage.tsx`
  - [ ] Business blog posts
  - [ ] Verify `pages/BusinessPostPage.tsx`

- [ ] **C2.5** SEO, metadata, schema:
  - [ ] Meta tags cho mỗi page
  - [ ] Open Graph tags
  - [ ] Twitter cards
  - [ ] Schema.org markup
  - [ ] Sitemap generation
  - [ ] Robots.txt
  - [ ] Canonical URLs
  - [ ] Slug optimization

- [ ] **C2.6** Other pages:
  - [ ] About page
  - [ ] Contact page
  - [ ] Login/Register pages
  - [ ] Reset password page
  - [ ] 404 page

**Deliverables:**
- Tất cả public pages hoàn chỉnh và test với data thật
- SEO optimization
- Performance optimization

---

### C3. BUSINESS DASHBOARD (CORE VALUE) - v1.1 REBASE

**Mục tiêu:** Hoàn thiện business dashboard với tất cả modules

**⚠️ PHẠM VI PHASE C (v1.1):**
- ✅ UI hoàn chỉnh
- ✅ CRUD hoạt động
- ✅ RLS-safe
- ✅ Không placeholder
- ❌ **KHÔNG** business automation phức tạp
- ❌ **KHÔNG** business logic nâng cao
- ❌ **KHÔNG** rule enforcement phức tạp

**➡️ Business logic nâng cao, rule enforcement, automation → ĐƯỢC CHUYỂN SANG PHASE D**

**⚠️ TRẠNG THÁI C3.4 → C3.9 (v1.1):**
- Các module C3.4 → C3.9 được đánh dấu: **UI_COMPLETE / REVIEW_LATER**
- Không coi là DONE logic
- Sẽ audit lại khi triển khai Phase D (Data Flow & Business Logic)
- ➡️ KHÔNG xóa code
- ➡️ KHÔNG làm lại UI
- ➡️ CHỈ audit logic khi đến Phase D

**Checklist cho mỗi module:**

- [ ] **C3.1** Dashboard overview:
  - [ ] Statistics cards
  - [ ] Recent activities
  - [ ] Quick actions
  - [ ] Notifications
  - [ ] Verify `components/DashboardOverview.tsx`

- [ ] **C3.2** Profile editor:
  - [ ] Business info edit
  - [ ] Logo upload
  - [ ] Images upload
  - [ ] Categories selection
  - [ ] Location (address, GPS)
  - [ ] Working hours
  - [ ] Social links
  - [ ] SEO settings
  - [ ] Notification settings
  - [ ] Hero slides editor
  - [ ] Verify `components/BusinessProfileEditor.tsx`
  - [ ] Test save/update

- [ ] **C3.3** Landing page builder:
  - [ ] Custom landing page editor
  - [ ] Page sections
  - [ ] Layout editor
  - [ ] Preview
  - [ ] Publish
  - [ ] Verify `components/LayoutEditor.tsx` và `components/HomepageEditor.tsx`

- [ ] **C3.4** Services:
  - [ ] List services
  - [ ] Add service
  - [ ] Edit service
  - [ ] Delete service
  - [ ] Reorder services
  - [ ] Service images
  - [ ] Verify `components/ServicesManager.tsx`
  - [ ] Test CRUD operations

- [ ] **C3.5** Deals:
  - [ ] List deals
  - [ ] Add deal
  - [ ] Edit deal
  - [ ] Delete deal
  - [ ] Deal status (Active, Expired, Scheduled)
  - [ ] Deal images
  - [ ] Verify `components/DealsManager.tsx`
  - [ ] Test CRUD operations

- [ ] **C3.6** Media:
  - [ ] Gallery view
  - [ ] Upload images/videos
  - [ ] Delete media
  - [ ] Reorder media
  - [ ] Media categories
  - [ ] Image optimization
  - [ ] Verify `components/MediaLibrary.tsx`
  - [ ] Test upload/download

- [ ] **C3.7** Blog:
  - [ ] List blog posts
  - [ ] Create blog post (Draft/Published)
  - [ ] Edit blog post
  - [ ] Delete blog post
  - [ ] Rich text editor
  - [ ] Featured posts
  - [ ] SEO settings
  - [ ] Verify `components/BlogManager.tsx`
  - [ ] Test CRUD operations

- [ ] **C3.8** Reviews:
  - [ ] List reviews
  - [ ] Reply to reviews
  - [ ] Hide/show reviews
  - [ ] Rating statistics
  - [ ] Verify `components/ReviewsManager.tsx`
  - [ ] Test review management

- [ ] **C3.9** Booking:
  - [ ] List appointments
  - [ ] View appointment details
  - [ ] Confirm/cancel appointments
  - [ ] Calendar view
  - [ ] Filter by status
  - [ ] Verify `components/BookingsManager.tsx`
  - [ ] Test booking management

- [ ] **C3.10** Analytics:
  - [ ] Statistics dashboard
  - [ ] Page views
  - [ ] Contact clicks
  - [ ] Charts & graphs
  - [ ] Time series data
  - [ ] Verify `components/AnalyticsDashboard.tsx`
  - [ ] Test với data thật

- [ ] **C3.11** Membership & billing:
  - [ ] Current membership tier
  - [ ] Membership expiry
  - [ ] Upgrade/downgrade options
  - [ ] Order history
  - [ ] Payment methods
  - [ ] Invoice generation
  - [ ] Verify `components/MembershipAndBilling.tsx`
  - [ ] Test membership flow

- [ ] **C3.12** Support:
  - [ ] Support tickets list
  - [ ] Create ticket
  - [ ] View ticket details
  - [ ] Reply to tickets
  - [ ] Ticket status
  - [ ] Verify `components/BusinessSupportCenter.tsx`
  - [ ] Test support flow

- [ ] **C3.13** Settings:
  - [ ] Account settings
  - [ ] Password change
  - [ ] Email preferences
  - [ ] Verify `components/AccountSettings.tsx`
  - [ ] Test settings update

**Deliverables:**
- Tất cả dashboard modules hoàn chỉnh và test với data thật
- CRUD operations work correctly
- File uploads work correctly
- Data persistence verified

---

### C4. ADMIN PANEL (CONTROL TOWER)

**Mục tiêu:** Hoàn thiện admin panel với permission-based UI

**Danh mục:**

- [ ] **C4.1** Admin auth:
  - [ ] Login page
  - [ ] Session management
  - [ ] Disable dev quick login in production
  - [ ] Verify `pages/AdminLoginPage.tsx`

- [ ] **C4.2** Permission-based UI:
  - [ ] Show/hide features based on permissions
  - [ ] Access denied messages
  - [ ] Verify tất cả admin features có permission check

- [ ] **C4.3** Dashboard:
  - [ ] Statistics overview
  - [ ] Recent activities
  - [ ] Quick actions
  - [ ] Verify `components/AdminDashboardOverview.tsx`

- [ ] **C4.4** Businesses management:
  - [ ] List businesses
  - [ ] View business details
  - [ ] Edit business
  - [ ] Delete business
  - [ ] Bulk import
  - [ ] Verify `components/BusinessManagementTable.tsx`
  - [ ] Test CRUD operations

- [ ] **C4.5** Orders:
  - [ ] List orders
  - [ ] View order details
  - [ ] Update order status
  - [ ] Verify order management
  - [ ] Test order workflow

- [ ] **C4.6** Packages:
  - [ ] List membership packages
  - [ ] Create package
  - [ ] Edit package
  - [ ] Delete package
  - [ ] Verify package management
  - [ ] Test CRUD operations

- [ ] **C4.7** Content:
  - [ ] Page content editor
  - [ ] Homepage editor
  - [ ] Blog management
  - [ ] Verify content management

- [ ] **C4.8** Homepage editor:
  - [ ] Hero slides editor
  - [ ] Sections configuration
  - [ ] Preview
  - [ ] Publish
  - [ ] Verify `components/HomepageEditor.tsx`

- [ ] **C4.9** Logs:
  - [ ] Activity log viewer
  - [ ] Email notifications log
  - [ ] Filter & search logs
  - [ ] Verify log viewers

- [ ] **C4.10** Support:
  - [ ] Support tickets management
  - [ ] Reply to tickets
  - [ ] Update ticket status
  - [ ] Verify `components/AdminSupportTickets.tsx`

- [ ] **C4.11** Tools:
  - [ ] Bulk import tool
  - [ ] API health check
  - [ ] Database tools (nếu có)
  - [ ] Verify admin tools

- [ ] **C4.12** Other admin features:
  - [ ] Users management
  - [ ] Admin users management
  - [ ] Registration requests
  - [ ] Announcements
  - [ ] System settings
  - [ ] Theme editor

**Deliverables:**
- Tất cả admin features hoàn chỉnh và test với data thật
- Permission-based UI working correctly
- All CRUD operations verified

---

## PHẦN D – DATA FLOW & LOGIC NGHIỆP VỤ

### D1. Membership & Billing Logic

**Mục tiêu:** Hoàn thiện membership và billing logic

**Danh mục:**

- [ ] **D1.1** Membership packages:
  - [ ] Define packages (Free, Premium, VIP)
  - [ ] Package features
  - [ ] Package permissions
  - [ ] Package pricing
  - [ ] Verify `membership_packages` table

- [ ] **D1.2** Quyền theo gói:
  - [ ] Map package → permissions
  - [ ] Enforce permissions trong business features
  - [ ] Check permissions trước khi allow actions

- [ ] **D1.3** Membership expiry:
  - [ ] Track expiry date
  - [ ] Notify before expiry
  - [ ] Handle expired memberships
  - [ ] Downgrade to Free khi hết hạn

- [ ] **D1.4** Gia hạn:
  - [ ] Renew membership
  - [ ] Extend expiry date
  - [ ] Update order status

- [ ] **D1.5** Upgrade/downgrade:
  - [ ] Upgrade flow
  - [ ] Downgrade flow
  - [ ] Prorated billing (nếu có)
  - [ ] Update permissions immediately

- [ ] **D1.6** Order lifecycle:
  - [ ] Create order
  - [ ] Payment (simulated hoặc real gateway)
  - [ ] Confirm order
  - [ ] Activate membership
  - [ ] Order status updates
  - [ ] Email notifications

**Deliverables:**
- Membership logic hoàn chỉnh
- Billing logic hoàn chỉnh
- Test membership workflows

---

### D2. Booking & Appointment Logic

**Mục tiêu:** Hoàn thiện booking và appointment logic

**Danh mục:**

- [ ] **D2.1** Appointment slots:
  - [ ] Slot availability
  - [ ] Service duration
  - [ ] Working hours
  - [ ] Blocked time slots

- [ ] **D2.2** Appointment status:
  - [ ] Pending → Confirmed → Completed
  - [ ] Cancelled flow
  - [ ] Status transitions

- [ ] **D2.3** Owner vs user:
  - [ ] User tạo appointment
  - [ ] Owner xem appointments
  - [ ] Owner confirm/cancel
  - [ ] Permissions

- [ ] **D2.4** Notifications:
  - [ ] Email khi có appointment mới
  - [ ] Email khi appointment được confirm
  - [ ] Email khi appointment bị cancel
  - [ ] In-app notifications

**Deliverables:**
- Booking logic hoàn chỉnh
- Test booking workflows
- Email notifications working

---

### D3. Review & Rating System

**Mục tiêu:** Hoàn thiện review và rating system

**Danh mục:**

- [ ] **D3.1** Ai được review:
  - [ ] Logged-in users
  - [ ] One review per user per business
  - [ ] Business owners không được review business của mình

- [ ] **D3.2** Chống spam:
  - [ ] Rate limiting
  - [ ] Duplicate detection
  - [ ] Moderation (nếu cần)

- [ ] **D3.3** Reply logic:
  - [ ] Business owner reply
  - [ ] One reply per review
  - [ ] Reply notification

- [ ] **D3.4** Rating aggregation:
  - [ ] Calculate average rating
  - [ ] Update business.rating
  - [ ] Update business.review_count
  - [ ] Trigger khi có review mới/update/delete

**Deliverables:**
- Review system hoàn chỉnh
- Rating aggregation working
- Test review workflows

---

## PHẦN E – EMAIL, NOTIFICATION, EDGE FUNCTIONS

### E1. Email System hoàn chỉnh

**Mục tiêu:** Hoàn thiện email system với tất cả templates

**Danh mục:**

- [ ] **E1.1** Email templates:
  - [ ] `invite` - Business registration invitation
  - [ ] `welcome` - Welcome email
  - [ ] `order_confirmation` - Order confirmation
  - [ ] `booking_confirmation` - Booking confirmation
  - [ ] `booking_cancelled` - Booking cancelled
  - [ ] `password_reset` - Password reset
  - [ ] `membership_expiry` - Membership expiry warning
  - [ ] `review_received` - New review notification
  - [ ] Tất cả templates có HTML đẹp, responsive

- [ ] **E1.2** Resend integration:
  - [ ] Verify Resend API setup
  - [ ] Verify RESEND_API_KEY
  - [ ] Test email sending
  - [ ] Error handling

- [ ] **E1.3** Trigger points:
  - [ ] Registration approval → Send invite email
  - [ ] Order created → Send confirmation email
  - [ ] Booking created → Send confirmation email
  - [ ] Booking confirmed → Send confirmation email
  - [ ] Booking cancelled → Send cancellation email
  - [ ] Password reset → Send reset email
  - [ ] Review received → Send notification email
  - [ ] Membership expiring → Send warning email

- [ ] **E1.4** Email testing:
  - [ ] Test tất cả email templates
  - [ ] Test với real email addresses
  - [ ] Verify email delivery
  - [ ] Verify email content

**Deliverables:**
- Tất cả email templates hoàn chỉnh
- Email system working
- Test results

---

### E2. Edge Functions Audit

**Mục tiêu:** Audit và hoàn thiện tất cả Edge Functions

**Danh mục:**

- [ ] **E2.1** `approve-registration`:
  - [ ] Review code
  - [ ] Error handling
  - [ ] Rollback logic
  - [ ] Logging
  - [ ] Security
  - [ ] Test function

- [ ] **E2.2** `send-templated-email`:
  - [ ] Review code
  - [ ] Template system
  - [ ] Error handling
  - [ ] Logging
  - [ ] Security
  - [ ] Test function

- [ ] **E2.3** `create-admin-user`:
  - [ ] Review code
  - [ ] Error handling
  - [ ] Logging
  - [ ] Security
  - [ ] Test function

- [ ] **E2.4** `send-email`:
  - [ ] Review code (có thể là duplicate của send-templated-email)
  - [ ] Decide: keep or remove
  - [ ] Update nếu cần

- [ ] **E2.5** General Edge Functions improvements:
  - [ ] Consistent error handling
  - [ ] Consistent logging
  - [ ] Security best practices
  - [ ] CORS handling
  - [ ] Type safety

**Deliverables:**
- All Edge Functions reviewed và improved
- Test results
- Documentation

---

### E3. Notification System

**Mục tiêu:** Hoàn thiện notification system

**Danh mục:**

- [ ] **E3.1** In-app notifications:
  - [ ] Notification component
  - [ ] Notification storage (database hoặc in-memory)
  - [ ] Real-time notifications (Supabase Realtime)
  - [ ] Mark as read
  - [ ] Notification types

- [ ] **E3.2** Email notifications:
  - [ ] Integration với email system
  - [ ] User preferences
  - [ ] Notification settings

- [ ] **E3.3** Admin alerts:
  - [ ] Admin notification system
  - [ ] Critical alerts
  - [ ] Daily/weekly summaries

**Deliverables:**
- Notification system working
- Test results

---

## PHẦN F – SEARCH, PERFORMANCE, SEO

### F1. Search System

**Mục tiêu:** Hoàn thiện search functionality

**Danh mục:**

- [ ] **F1.1** Business search:
  - [ ] Search algorithm
  - [ ] Full-text search (PostgreSQL)
  - [ ] Search by name, category, location, tags
  - [ ] Search ranking
  - [ ] Search suggestions
  - [ ] Verify `components/SearchBar.tsx`

- [ ] **F1.2** Blog search:
  - [ ] Search blog posts
  - [ ] Search by title, content, category
  - [ ] Full-text search

- [ ] **F1.3** Index strategy:
  - [ ] Database indexes cho search columns
  - [ ] GIN indexes cho full-text search (nếu dùng)
  - [ ] Verify indexes trong schema

- [ ] **F1.4** Search performance:
  - [ ] Test search performance
  - [ ] Optimize queries
  - [ ] Pagination

**Deliverables:**
- Search system hoàn chỉnh
- Performance optimized
- Test results

---

### F2. Performance Optimization

**Mục tiêu:** Optimize performance của ứng dụng

**Danh mục:**

- [ ] **F2.1** Query optimization:
  - [ ] Review slow queries
  - [ ] Add indexes
  - [ ] Optimize joins
  - [ ] Use select specific columns
  - [ ] Pagination

- [ ] **F2.2** Indexes:
  - [ ] Review indexes trong schema
  - [ ] Add missing indexes
  - [ ] Remove unused indexes
  - [ ] Verify index usage

- [ ] **F2.3** Pagination:
  - [ ] Implement pagination everywhere cần thiết
  - [ ] Consistent pagination UI
  - [ ] Infinite scroll hoặc page-based

- [ ] **F2.4** Image lazy loading:
  - [ ] Lazy load images
  - [ ] Placeholder images
  - [ ] Image optimization
  - [ ] CDN (nếu có)

- [ ] **F2.5** Cache strategy:
  - [ ] Frontend caching (nếu cần)
  - [ ] API response caching (nếu cần)
  - [ ] Static asset caching

**Deliverables:**
- Performance optimized
- Test results (load times, query times)

---

### F3. SEO & DISCOVERABILITY

**Mục tiêu:** Optimize SEO và discoverability

**Danh mục:**

- [ ] **F3.1** Meta tags:
  - [ ] Title tags cho mỗi page
  - [ ] Meta description
  - [ ] Meta keywords (optional)
  - [ ] Dynamic meta tags

- [ ] **F3.2** Schema.org:
  - [ ] Business schema
  - [ ] Blog post schema
  - [ ] Review schema
  - [ ] Organization schema

- [ ] **F3.3** OpenGraph:
  - [ ] OG tags cho mỗi page
  - [ ] OG images
  - [ ] Social sharing

- [ ] **F3.4** Sitemap:
  - [ ] Generate sitemap.xml
  - [ ] Include all public pages
  - [ ] Update sitemap dynamically

- [ ] **F3.5** Robots.txt:
  - [ ] Create robots.txt
  - [ ] Allow/disallow rules

- [ ] **F3.6** Canonical URLs:
  - [ ] Canonical tags
  - [ ] Avoid duplicate content

- [ ] **F3.7** Slugs:
  - [ ] SEO-friendly slugs
  - [ ] Slug uniqueness
  - [ ] Slug generation

**Deliverables:**
- SEO optimized
- Sitemap generated
- Robots.txt created
- Test results

---

## PHẦN G – QUALITY, TESTING, SAFETY NET

### G1. Testing Strategy

**Mục tiêu:** Setup testing và viết tests

**Danh mục:**

- [ ] **G1.1** Setup testing framework:
  - [ ] Install testing libraries (Jest, React Testing Library, etc.)
  - [ ] Setup test configuration
  - [ ] Setup test scripts

- [ ] **G1.2** Unit tests:
  - [ ] Test utility functions
  - [ ] Test components (critical ones)
  - [ ] Test contexts (critical ones)

- [ ] **G1.3** Integration tests:
  - [ ] Test auth flows
  - [ ] Test CRUD operations
  - [ ] Test business workflows

- [ ] **G1.4** Auth & RLS tests:
  - [ ] Test RLS policies
  - [ ] Test role permissions
  - [ ] Test unauthorized access

- [ ] **G1.5** Regression tests:
  - [ ] Test critical paths
  - [ ] Test edge cases
  - [ ] Test error cases

**Deliverables:**
- Testing framework setup
- Test suite (ít nhất cho critical paths)
- Test results

---

### G2. Error Handling & Monitoring

**Mục tiêu:** Setup error handling và monitoring

**Danh mục:**

- [ ] **G2.1** Frontend error boundary:
  - [ ] Error boundary components
  - [ ] Error logging
  - [ ] User-friendly error messages
  - [ ] Error reporting (nếu có)

- [ ] **G2.2** Backend logging:
  - [ ] Edge Functions logging
  - [ ] Error logging
  - [ ] Request logging

- [ ] **G2.3** Supabase logs:
  - [ ] Review Supabase logs
  - [ ] Setup log monitoring
  - [ ] Error alerts

- [ ] **G2.4** Alerts:
  - [ ] Critical error alerts
  - [ ] Performance alerts
  - [ ] Security alerts

**Deliverables:**
- Error handling implemented
- Logging setup
- Monitoring setup

---

## PHẦN H – DEPLOYMENT & PRODUCTION READINESS

### H1. Environment Management

**Mục tiêu:** Chuẩn hóa environment management

**Danh mục:**

- [ ] **H1.1** .env.example:
  - [ ] Create .env.example file
  - [ ] List all environment variables
  - [ ] Document each variable
  - [ ] No secrets in .env.example

- [ ] **H1.2** Vercel env:
  - [ ] Setup environment variables trên Vercel
  - [ ] Production env
  - [ ] Preview env (nếu có)
  - [ ] Verify env variables

- [ ] **H1.3** Supabase secrets:
  - [ ] Setup Edge Functions secrets
  - [ ] RESEND_API_KEY
  - [ ] Other secrets
  - [ ] Verify secrets

- [ ] **H1.4** Documentation:
  - [ ] Document environment setup
  - [ ] Document deployment process

**Deliverables:**
- .env.example file
- Environment setup documentation
- All env variables configured

---

### H2. Deployment Checklist

**Mục tiêu:** Checklist để deploy production

**Danh mục:**

- [ ] **H2.1** Build:
  - [ ] Frontend build succeeds
  - [ ] No build errors
  - [ ] No build warnings (critical ones)
  - [ ] Build size optimized

- [ ] **H2.2** DB migrate:
  - [ ] Run migrations
  - [ ] Verify schema
  - [ ] Verify RLS policies
  - [ ] Verify data (nếu có)

- [ ] **H2.3** Functions deploy:
  - [ ] Deploy Edge Functions
  - [ ] Verify functions work
  - [ ] Test functions

- [ ] **H2.4** Storage setup:
  - [ ] Create storage buckets
  - [ ] Setup storage policies
  - [ ] Test upload/download

- [ ] **H2.5** Domain:
  - [ ] Setup domain
  - [ ] DNS configuration
  - [ ] Verify domain

- [ ] **H2.6** SSL:
  - [ ] SSL certificate (Vercel auto)
  - [ ] Verify HTTPS

- [ ] **H2.7** Final checks:
  - [ ] Test production site
  - [ ] Test all critical paths
  - [ ] Test on different devices
  - [ ] Performance check
  - [ ] SEO check

**Deliverables:**
- Production deployment successful
- All checks passed
- Production site working

---

### H3. Backup & Recovery

**Mục tiêu:** Setup backup và recovery plan

**Danh mục:**

- [ ] **H3.1** DB backup:
  - [ ] Setup automated backups
  - [ ] Backup frequency
  - [ ] Backup retention
  - [ ] Test restore

- [ ] **H3.2** Storage backup:
  - [ ] Storage backup strategy
  - [ ] Backup frequency
  - [ ] Test restore

- [ ] **H3.3** Rollback plan:
  - [ ] Code rollback procedure
  - [ ] Database rollback procedure
  - [ ] Document rollback process

**Deliverables:**
- Backup strategy implemented
- Recovery plan documented
- Test backup/restore

---

## 📊 TỔNG KẾT

**Tổng số mục:** ~200+ tasks  
**Estimated timeline:** 4-6 tuần (tùy team size)  
**Priority order:** A → B → C → D → E → F → G → H

**⚠️ LƯU Ý:**
- Không được làm lệch thứ tự
- Mỗi mục phải hoàn thiện 100% trước khi chuyển sang mục tiếp theo
- Cập nhật tiến độ vào `TIEN_DO_HOAN_THIEN.md` sau mỗi mục hoàn thành
- Báo lỗi ngay nếu phát hiện sai sót

---

**Master Plan Version:** 1.1 (Clarification & Rebase)

**Changelog v1.1:**
- ✅ Redefined "Completion Report" → "Completion Evidence (Lite)"
- ✅ Added trạng thái tiến độ: DONE, UI_COMPLETE, REVIEW_LATER
- ✅ Rebase Phase C: Focus UI + CRUD, business logic → Phase D
- ✅ C3.4-C3.9 marked as UI_COMPLETE/REVIEW_LATER, will audit at Phase D
- ✅ Giữ nguyên nguyên tắc cốt lõi, không thay đổi scope tổng thể  
**Last Updated:** $(date)  
**Status:** Ready for implementation

