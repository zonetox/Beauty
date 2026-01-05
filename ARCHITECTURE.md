# ARCHITECTURE PHILOSOPHY - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** LOCKED

---

## TỔNG QUAN

Tài liệu này định nghĩa các triết lý kiến trúc BẤT BIẾN của dự án 1Beauty.asia. Tất cả các bước phát triển sau (A2, A3, A4, ...) PHẢI tuân thủ tuyệt đối các triết lý này.

---

## 1. SUPABASE LÀ BACKEND DUY NHẤT

### Nguyên tắc:
- **Supabase là backend duy nhất** của ứng dụng
- **Không có backend server riêng** (Node.js, Python, etc.)
- **Không có ORM ngoài Supabase** (Prisma, TypeORM, etc.)
- **Không có database phụ** (Redis, MongoDB, etc.)

### Thực thi:
- Tất cả database operations qua `@supabase/supabase-js`
- Authentication qua Supabase Auth
- Storage qua Supabase Storage
- Real-time qua Supabase Realtime
- Edge Functions cho serverless operations

### Cấm:
- ❌ Tạo backend server riêng
- ❌ Sử dụng ORM khác
- ❌ Kết nối database trực tiếp từ frontend (bypass Supabase)

---

## 2. RLS-FIRST SECURITY

### Nguyên tắc:
- **Security được đảm bảo bởi RLS (Row Level Security)** ở database level
- **Không bypass RLS** bằng service role key ở client
- **Mọi quyền truy cập = RLS policies + Database roles**

### Thực thi:
- Tất cả tables PHẢI có RLS enabled
- RLS policies định nghĩa rõ ràng: ai được đọc/ghi data nào
- Client chỉ dùng anon key, không dùng service role key
- Edge Functions dùng service role key CHỈ khi cần elevated privileges

### Cấm:
- ❌ Bypass RLS bằng service role key ở frontend
- ❌ Dùng `auth.uid() IS NOT NULL` cho data nhạy cảm (phải có policies cụ thể)
- ❌ Để tables không có RLS policies

---

## 3. NO HARDCODE ROLE Ở FRONTEND

### Nguyên tắc:
- **Frontend chỉ đọc role/permission từ database**
- **Không hardcode role/permission logic ở frontend**
- **Không suy đoán quyền dựa trên email, user ID, hoặc logic khác**

### Thực thi:
- Roles và permissions được lưu trong database (`admin_users.permissions`)
- Frontend fetch role/permission từ database
- Frontend guards (ProtectedRoute, AdminProtectedRoute) dựa trên data từ DB
- Permission-based UI rendering dựa trên data từ DB

### Cấm:
- ❌ Hardcode role checks: `if (user.email === 'admin@example.com')`
- ❌ Hardcode permission checks: `if (user.id === '123') { showAdminPanel() }`
- ❌ Giả lập quyền ở client side
- ❌ Dùng logic if/else theo email hoặc user ID để xác định quyền

---

## 4. SINGLE SOURCE OF TRUTH

### Nguyên tắc:
- **Mỗi loại data có một nguồn sự thật duy nhất (Single Source of Truth)**
- **Không duplicate data hoặc logic giữa các layers**
- **Frontend không suy đoán, chỉ đọc từ source of truth**

### Thực thi:

**Authentication:**
- Source of Truth: `auth.users` (Supabase Auth)
- Frontend đọc session từ Supabase Auth

**Roles & Permissions:**
- Source of Truth: `admin_users` table trong database
- Frontend fetch từ database, không hardcode

**User Profile:**
- Source of Truth: `profiles` table trong database
- Frontend fetch từ database

**Business Data:**
- Source of Truth: `businesses` table và related tables
- Frontend fetch từ database qua Supabase client

**Permissions:**
- Source of Truth: `admin_users.permissions` JSONB column
- RLS policies enforce permissions
- Frontend chỉ đọc và render theo permissions từ DB

### Cấm:
- ❌ Duplicate role/permission logic ở frontend
- ❌ Frontend tự suy đoán permissions
- ❌ Cache permissions ở frontend mà không sync với DB

---

## 5. FRONTEND / BACKEND CONTRACT

### Nguyên tắc:
- **Frontend là client thuần** - không có server-side logic
- **Backend = Supabase (Database + Edge Functions)**
- **Edge Functions chỉ dùng khi cần elevated privileges**

### Frontend (Client):
- Pure client application (React)
- Tất cả data operations qua Supabase client (`@supabase/supabase-js`)
- State management: React Context API
- Authentication: Supabase Auth
- File upload: Supabase Storage

### Backend (Supabase):
- **Database:** PostgreSQL với RLS
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Edge Functions:** Deno functions cho operations cần elevated privileges
  - `approve-registration`: Cần service role để create user + business
  - `send-templated-email`: Cần service role để send email
  - `create-admin-user`: Cần service role để create admin user

### Edge Functions Scope:
Edge Functions CHỈ được dùng cho:
- Operations cần service role key (elevated privileges)
- Operations không thể thực hiện qua RLS policies
- Server-side operations (email sending, external API calls)

Edge Functions KHÔNG dùng cho:
- Business logic có thể làm ở client
- Data fetching có thể làm qua RLS
- Operations không cần elevated privileges

### Cấm:
- ❌ Thêm backend server riêng
- ❌ Thêm Edge Functions cho logic có thể làm ở client
- ❌ Bypass Supabase bằng direct database connection

---

## TÓM TẮT QUY TẮC BẤT BIẾN

1. ✅ **Supabase là backend duy nhất** - Không backend server, ORM, hoặc DB phụ
2. ✅ **RLS-first security** - Mọi security qua RLS, không bypass
3. ✅ **No hardcode role** - Roles/permissions từ DB, không hardcode ở frontend
4. ✅ **Single Source of Truth** - Mỗi data có 1 source duy nhất, không duplicate
5. ✅ **Frontend = Client, Backend = Supabase** - Edge Functions chỉ khi cần elevated privileges

---

## VERIFICATION CHECKLIST

Khi review code hoặc implement features, verify:

- [ ] Có dùng backend server riêng không? → ❌ KHÔNG ĐƯỢC
- [ ] Có bypass RLS không? → ❌ KHÔNG ĐƯỢC
- [ ] Có hardcode role/permission ở frontend không? → ❌ KHÔNG ĐƯỢC
- [ ] Có duplicate logic giữa frontend và backend không? → ❌ KHÔNG ĐƯỢC
- [ ] Edge Functions có cần elevated privileges không? → ✅ PHẢI CẦN

---

## LƯU Ý QUAN TRỌNG

- Tài liệu này là **BẤT BIẾN** - không được thay đổi mà không có approval từ Project Owner
- Tất cả các bước sau (A2, A3, A4, ...) PHẢI tuân thủ 100% các triết lý này
- Nếu có conflict giữa code và triết lý này → Code PHẢI được sửa để phù hợp

---

**Document Version:** 1.0  
**Locked Date:** 2025-01-05  
**Next Review:** After Phase A completion


