# Cách Fix Các Cảnh Báo Còn Lại

**Date:** 2025-01-19

---

## ⚠️ CÁC CẢNH BÁO CÒN LẠI

### 1. Functions thiếu search_path
- `get_my_business_id` - Cần thêm `SET search_path = public, pg_temp`
- `increment_view_count` - Cần thêm `SET search_path = public, pg_temp`
- `update_business_ratings` - Cần thêm `SET search_path = public, pg_temp`

### 2. Permissive INSERT Policies
- Có nhiều policies cho phép INSERT từ public role
- Đây là **BÌNH THƯỜNG** nếu có validation trong WITH CHECK clause
- Không cần fix nếu đã có validation đúng

### 3. Users không xóa được
- Management API không có quyền xóa `auth.users`
- Cần dùng SQL Editor trực tiếp

---

## ✅ GIẢI PHÁP

### Bước 1: Fix Functions thiếu search_path

**Mở:** https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql

**Copy và chạy:**
```sql
-- Fix get_my_business_id
CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business_id BIGINT;
BEGIN
    SELECT id INTO v_business_id
    FROM public.businesses
    WHERE owner_id = auth.uid()
    LIMIT 1;
    RETURN v_business_id;
END;
$$;

-- Fix increment_view_count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_table_name TEXT, p_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_table_name = 'businesses' THEN
        UPDATE public.businesses
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_id;
    ELSIF p_table_name = 'blog_posts' THEN
        UPDATE public.blog_posts
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_id;
    END IF;
END;
$$;

-- Fix update_business_ratings
CREATE OR REPLACE FUNCTION public.update_business_ratings(p_business_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_avg_rating DOUBLE PRECISION;
    v_review_count INTEGER;
BEGIN
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM public.reviews
    WHERE business_id = p_business_id
    AND status = 'approved';
    
    UPDATE public.businesses
    SET 
        rating = v_avg_rating,
        review_count = v_review_count
    WHERE id = p_business_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_my_business_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count TO anon;
GRANT EXECUTE ON FUNCTION public.update_business_ratings TO authenticated;
```

### Bước 2: Xóa Users

**Trong cùng SQL Editor, chạy:**
```sql
-- Delete from public tables first
DELETE FROM public.profiles;
DELETE FROM public.admin_users;

-- Delete from auth.users
DELETE FROM auth.users;

-- Verify
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;
```

---

## 📋 FILE ĐÃ TẠO

**`database/FIX_ALL_REMAINING_ISSUES.sql`**
- Chứa tất cả SQL cần chạy
- Copy toàn bộ file và paste vào SQL Editor
- Click "Run" một lần là xong

---

## ✅ SAU KHI CHẠY

1. Kiểm tra lại Dashboard → Settings → Warnings
2. Nếu vẫn còn cảnh báo, gửi screenshot cho tôi
3. Tôi sẽ fix tiếp

---

## 🚀 QUICK FIX (1 Click)

1. Mở: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql
2. Mở file: `database/FIX_ALL_REMAINING_ISSUES.sql`
3. Copy toàn bộ nội dung
4. Paste vào SQL Editor
5. Click "Run"
6. Xong!
