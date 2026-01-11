# Hướng dẫn Reset Users trong Database

## ⚠️ CẢNH BÁO

**Việc reset users sẽ XÓA TẤT CẢ users khỏi database, bao gồm:**
- Tất cả auth users (auth.users)
- Tất cả profiles (public.profiles)
- Tất cả admin users (public.admin_users)

**Đây là hành động KHÔNG THỂ HOÀN TÁC!**

---

## 🔍 VẤN ĐỀ HIỆN TẠI

### Triệu chứng:
- Không đăng xuất được
- Trang tải mãi (loading)
- Có thể do users cũ trong database gây conflict

### Nguyên nhân có thể:
1. **Session conflicts:** Users cũ có sessions đang active
2. **RLS policies:** Policies có thể block logout operations
3. **Data inconsistency:** Profiles hoặc admin_users không khớp với auth.users
4. **Infinite loops:** Auth state change listeners bị stuck

---

## ✅ GIẢI PHÁP: RESET USERS

### Cách 1: Reset toàn bộ (Khuyến nghị cho fresh start)

**Bước 1: Xem danh sách users hiện tại**
```sql
-- Chạy trong Supabase SQL Editor
SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'public.profiles' as table_name,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
    'public.admin_users' as table_name,
    COUNT(*) as count
FROM public.admin_users;
```

**Bước 2: Xóa profiles trước (do foreign key constraints)**
```sql
DELETE FROM public.profiles;
```

**Bước 3: Xóa admin users**
```sql
DELETE FROM public.admin_users;
```

**Bước 4: Xóa auth users**
```sql
DELETE FROM auth.users;
```

**Bước 5: Verify**
```sql
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;
```

Tất cả counts phải = 0.

---

### Cách 2: Reset an toàn (Step-by-step)

Sử dụng file `database/reset_users_safe.sql`:
1. Mở file trong Supabase SQL Editor
2. Chạy từng section một
3. Verify sau mỗi bước
4. Chỉ uncomment và chạy khi chắc chắn

---

## 🔄 SAU KHI RESET: TẠO ADMIN USER MỚI

### Bước 1: Đăng ký user mới qua Supabase Auth

1. Vào trang đăng ký của app: `/register` hoặc `/admin/register`
2. Đăng ký với email mới (vd: `admin@beautydir.com`)
3. Xác nhận email (nếu cần)

### Bước 2: Thêm user vào admin_users table

Sau khi đăng ký, chạy SQL:

```sql
INSERT INTO public.admin_users (username, email, role, permissions, is_locked)
VALUES (
    'admin',
    'admin@beautydir.com',  -- Thay bằng email bạn vừa đăng ký
    'Admin',
    '{
        "canViewAnalytics": true,
        "canManageBusinesses": true,
        "canManageRegistrations": true,
        "canManageOrders": true,
        "canManagePlatformBlog": true,
        "canManageUsers": true,
        "canManagePackages": true,
        "canManageAnnouncements": true,
        "canManageSupportTickets": true,
        "canManageSystemSettings": true,
        "canViewActivityLog": true,
        "canViewEmailLog": true,
        "canUseAdminTools": true,
        "canManageSiteContent": true
    }'::jsonb,
    false
);
```

### Bước 3: Verify admin user

```sql
SELECT id, username, email, role, is_locked 
FROM public.admin_users 
WHERE email = 'admin@beautydir.com';
```

### Bước 4: Đăng nhập

1. Vào trang admin login: `/admin/login`
2. Đăng nhập với email và password vừa tạo
3. Kiểm tra xem có đăng nhập được không

---

## 🛠️ FIX LOGOUT ISSUE (Nếu vẫn còn sau reset)

### 1. Clear browser storage

```javascript
// Chạy trong browser console
localStorage.clear();
sessionStorage.clear();
```

### 2. Clear Supabase session manually

```javascript
// Chạy trong browser console
import { supabase } from './lib/supabaseClient';
await supabase.auth.signOut({ scope: 'global' });
```

### 3. Check RLS policies

Đảm bảo RLS policies không block logout:
- `auth.users` table không có RLS (managed by Supabase)
- Logout chỉ cần `supabase.auth.signOut()` - không cần database permissions

### 4. Fix infinite loading

Nếu trang vẫn loading mãi, có thể do:
- Auth state change listener bị stuck
- Profile fetch bị timeout
- RLS policy block profile read

**Fix:** Check `contexts/UserSessionContext.tsx` - có safety timeout 10s, nhưng có thể cần tăng hoặc fix logic.

---

## 📝 CHECKLIST SAU KHI RESET

- [ ] Tất cả users đã bị xóa (counts = 0)
- [ ] Đã đăng ký user mới qua Supabase Auth
- [ ] Đã thêm user vào admin_users table
- [ ] Có thể đăng nhập với user mới
- [ ] Có thể đăng xuất được
- [ ] Trang không còn loading mãi
- [ ] Profile được tạo tự động khi login

---

## 🔐 BẢO MẬT

**Sau khi reset:**
1. Đổi password ngay sau khi đăng nhập
2. Enable 2FA nếu có
3. Kiểm tra RLS policies đảm bảo security
4. Không commit credentials vào Git

---

## ❓ TROUBLESHOOTING

### Vấn đề: Không thể xóa auth.users
**Giải pháp:** Cần quyền admin hoặc service role key

### Vấn đề: Foreign key constraint error
**Giải pháp:** Xóa theo thứ tự: profiles → admin_users → auth.users

### Vấn đề: Vẫn không logout được sau reset
**Giải pháp:** 
1. Clear browser cache và storage
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify Supabase connection

---

**Lưu ý:** Nếu vẫn gặp vấn đề sau khi reset, có thể do code issue, không phải database issue. Cần check code logic trong contexts.
