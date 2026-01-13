# Clear Data for Local Testing

## Overview

Scripts để clear sạch data trong database để test build local, nhưng **giữ nguyên cấu trúc database** (tables, RLS policies, functions, indexes).

## Scripts Available

### 1. `clear_all_data_for_testing.sql` ⚡ (Recommended)

**Script tự động clear toàn bộ data trong một transaction.**

**Cách dùng:**
- Chạy trực tiếp trong Supabase SQL Editor hoặc qua MCP
- Đã được chạy và clear thành công

**Lưu ý:**
- ✅ Preserves database structure
- ✅ Clears all user data
- ✅ Clears all business data
- ✅ Clears all transactional data
- ⚠️ `auth.users` cần xóa thủ công qua Supabase Dashboard (Authentication > Users)

### 2. `clear_all_data_safe.sql` 🔒

**Script step-by-step với verification, an toàn hơn.**

**Cách dùng:**
- Mở file và uncomment từng section
- Chạy từng section một và verify kết quả
- Phù hợp khi muốn kiểm soát từng bước

## What Gets Cleared

✅ **Cleared:**
- All profiles
- All businesses
- All orders
- All appointments
- All reviews
- All admin users
- All services, deals, media
- All blog posts
- All analytics data (page_views, conversions)
- All registration requests
- All notifications

✅ **Preserved:**
- Database structure (tables, columns, indexes)
- RLS policies
- Functions and triggers
- Enums and types
- `app_settings` (optional - uncomment to clear)
- `page_content` (optional - uncomment to clear)

⚠️ **Manual Action Required:**
- `auth.users` - Delete via Supabase Dashboard > Authentication > Users

## Verification

Sau khi clear, chạy query này để verify:

```sql
SELECT 
    'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'businesses', COUNT(*) FROM public.businesses
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'admin_users', COUNT(*) FROM public.admin_users
ORDER BY table_name;
```

Tất cả count phải = 0.

## Next Steps After Clearing

1. **Delete auth.users manually:**
   - Go to Supabase Dashboard > Authentication > Users
   - Delete all users

2. **Test local build:**
   ```bash
   npm run build
   ```

3. **Create test data (optional):**
   - Register new business via UI
   - Create admin user via Supabase Dashboard

## Important Notes

⚠️ **WARNING:**
- Script này **XÓA TẤT CẢ DATA**
- Không thể undo sau khi commit
- Chỉ dùng cho local testing
- **KHÔNG BAO GIỜ** chạy trên production database

✅ **SAFE:**
- Không drop tables
- Không drop RLS policies
- Không drop functions
- Database structure hoàn toàn nguyên vẹn

## Migration Applied

Migration `clear_all_data_for_testing` đã được apply thành công.

**Status:** ✅ All data cleared
**Date:** 2025-01-12
**Tables cleared:** 18+ tables
**Data preserved:** Database structure only
