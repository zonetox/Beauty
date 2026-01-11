# 🔄 Hướng dẫn Reset Users - Quick Guide

## 📊 TÌNH TRẠNG HIỆN TẠI

Database hiện có:
- **2 auth users:**
  - `zonecons2015@gmail.com` (Lee)
  - `tanloifmc@yahoo.com`
- **1 admin user:**
  - `tanloifmc@yahoo.com` (SuperAdmin)
- **2 profiles** tương ứng

**Vấn đề:** Có thể gây conflict khi logout và loading.

---

## ✅ GIẢI PHÁP: RESET TẤT CẢ USERS

### Bước 1: Mở Supabase SQL Editor

1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Click **New query**

### Bước 2: Chạy Script Reset

Copy và paste script sau vào SQL Editor:

```sql
-- Reset All Users
DELETE FROM public.profiles;
DELETE FROM public.admin_users;
DELETE FROM auth.users;

-- Verify (should return all zeros)
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;
```

**Click "Run"** để thực thi.

**Kết quả mong đợi:**
```
auth_users_count: 0
profiles_count: 0
admin_users_count: 0
```

### Bước 3: Clear Browser Storage

Sau khi reset database, clear browser:

1. Mở **Developer Tools** (F12)
2. Vào tab **Application** (Chrome) hoặc **Storage** (Firefox)
3. Clear:
   - **Local Storage** → Clear all
   - **Session Storage** → Clear all
   - **Cookies** → Clear all
4. **Hard refresh:** `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)

### Bước 4: Đăng ký User Mới

#### 4.1. Đăng ký qua App

1. Vào trang đăng ký: `/register`
2. Đăng ký với email mới (vd: `admin@beautydir.com`)
3. Nhập password
4. Submit

#### 4.2. Thêm vào Admin Users

Sau khi đăng ký, vào **Supabase SQL Editor** và chạy:

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

### Bước 5: Verify và Test

1. **Verify admin user:**
```sql
SELECT id, username, email, role, is_locked 
FROM public.admin_users;
```

2. **Test login:**
   - Vào `/admin/login`
   - Đăng nhập với email và password vừa tạo
   - Kiểm tra xem có đăng nhập được không

3. **Test logout:**
   - Click "Đăng xuất"
   - Kiểm tra xem có logout được không
   - Trang không còn loading mãi

---

## 🐛 FIX LOGOUT ISSUE (Nếu vẫn còn)

### Option 1: Clear Browser Console

Mở browser console (F12) và chạy:

```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Force logout
const { supabase } = await import('./lib/supabaseClient');
await supabase.auth.signOut({ scope: 'global' });

// Reload page
window.location.reload();
```

### Option 2: Check Code Issue

Nếu vẫn không logout được, có thể do code issue. Check:

1. **UserSessionContext timeout:**
   - File: `contexts/UserSessionContext.tsx`
   - Có safety timeout 10s
   - Nếu vẫn loading > 10s → có bug

2. **Auth state listener:**
   - Có thể bị infinite loop
   - Check console for errors

3. **RLS policies:**
   - Logout không cần RLS (chỉ cần `supabase.auth.signOut()`)
   - Nếu có error → check Supabase connection

---

## 📝 CHECKLIST

- [ ] Đã chạy script reset users
- [ ] Verify: tất cả counts = 0
- [ ] Đã clear browser storage
- [ ] Đã đăng ký user mới
- [ ] Đã thêm user vào admin_users
- [ ] Có thể đăng nhập
- [ ] Có thể đăng xuất
- [ ] Trang không loading mãi

---

## ⚠️ LƯU Ý

1. **Backup trước khi reset** (nếu cần giữ data)
2. **Không reset nếu đang production** với users thật
3. **Test kỹ sau khi reset** trước khi deploy
4. **Đổi password ngay** sau khi đăng nhập

---

## 🔗 FILES LIÊN QUAN

- `database/reset_users_execute.sql` - Script reset nhanh
- `database/reset_users_safe.sql` - Script reset an toàn (step-by-step)
- `docs/RESET_USERS_GUIDE.md` - Hướng dẫn chi tiết

---

**Sau khi reset, vấn đề logout và loading sẽ được giải quyết!** ✅
