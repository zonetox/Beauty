-- ============================================
-- NUCLEAR TOTAL RESET: CLEAR ALL AUTH DATA
-- ============================================
-- CHÚ Ý: Script này xóa SẠCH TOÀN BỘ dữ liệu người dùng.
-- Chạy script này trong Supabase SQL Editor.
-- BƯỚC 1: Xóa các bảng phụ thuộc (Foreign Key)
DELETE FROM public.business_staff;
DELETE FROM public.appointments;
DELETE FROM public.reviews;
DELETE FROM public.media_items;
DELETE FROM public.team_members;
DELETE FROM public.deals;
DELETE FROM public.services;
DELETE FROM public.support_tickets;
DELETE FROM public.orders;
DELETE FROM public.registration_requests;
DELETE FROM public.business_blog_posts;
DELETE FROM public.notifications;
-- Nếu có
DELETE FROM public.conversions;
-- Nếu có
DELETE FROM public.page_views;
-- Nếu có
DELETE FROM public.abuse_reports;
-- Nếu có
-- BƯỚC 2: Xóa Businesses (vốn phụ thuộc owner_id là User)
DELETE FROM public.businesses;
-- BƯỚC 3: Xóa Profiles và Admin Users
DELETE FROM public.profiles;
DELETE FROM public.admin_users;
DELETE FROM public.registration_errors;
-- BƯỚC 4: XÓA TÀI KHOẢN TRÊN AUTH (Bảng ngầm của Supabase)
-- Đây là bước quan trọng nhất để sửa lỗi "Email already registered"
DELETE FROM auth.users;
-- BƯỚC 5: KIỂM TRA (Sẽ hiện 0 cho tất cả nếu thành công)
SELECT (
        SELECT COUNT(*)
        FROM auth.users
    ) as remaining_auth_users,
    (
        SELECT COUNT(*)
        FROM public.profiles
    ) as remaining_profiles,
    (
        SELECT COUNT(*)
        FROM public.admin_users
    ) as remaining_admin_users,
    (
        SELECT COUNT(*)
        FROM public.businesses
    ) as remaining_businesses;
-- ============================================
-- SAU KHI CHẠY SCRIPT NÀY:
-- 1. Bạn có thể ĐĂNG KÝ LẠI email tanloifmc@yahoo.com mà không lo bị lỗi.
-- 2. Đăng ký xong, hãy chạy script cấp quyền Admin.
-- ============================================