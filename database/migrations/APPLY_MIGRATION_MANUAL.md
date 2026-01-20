# HƯỚNG DẪN APPLY MIGRATION THỦ CÔNG

## File Migration: `20250118000002_add_performance_indexes.sql`

**Mục đích:** Thêm indexes để tối ưu performance, giảm query time từ 1-1.4s xuống <500ms

---

## CÁCH APPLY:

### Bước 1: Mở Supabase Dashboard
1. Đăng nhập vào [https://app.supabase.com](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)

### Bước 2: Copy và Paste SQL
1. Mở file: `database/migrations/20250118000002_add_performance_indexes.sql`
2. Copy **TOÀN BỘ** nội dung SQL
3. Paste vào SQL Editor trong Supabase
4. Click **RUN** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Bước 3: Kiểm tra kết quả
- Nếu thành công: Sẽ thấy message "Success. No rows returned"
- Nếu có lỗi: Kiểm tra error message (thường là index đã tồn tại - không sao)

---

## SQL MIGRATION (Copy toàn bộ phần dưới đây):

```sql
-- ============================================
-- Performance Optimization - Additional Indexes
-- Date: 2025-01-18
-- Purpose: Add missing indexes for common query patterns to reduce query time from 1-1.4s to <500ms
-- ============================================

-- ============================================
-- 1. blog_posts table - status and published_at indexes
-- ============================================
-- Query pattern: SELECT * FROM blog_posts WHERE status = 'Published' ORDER BY date DESC
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_date 
ON public.blog_posts(status, date DESC NULLS LAST)
WHERE status = 'Published';

-- Index for status filter alone
CREATE INDEX IF NOT EXISTS idx_blog_posts_status 
ON public.blog_posts(status)
WHERE status = 'Published';

-- ============================================
-- 2. businesses table - additional filter indexes
-- ============================================
-- Query pattern: SELECT * FROM businesses WHERE is_active = true
CREATE INDEX IF NOT EXISTS idx_businesses_is_active 
ON public.businesses(is_active)
WHERE is_active = TRUE;

-- Query pattern: SELECT * FROM businesses WHERE is_featured = true
CREATE INDEX IF NOT EXISTS idx_businesses_is_featured 
ON public.businesses(is_featured)
WHERE is_featured = TRUE;

-- Query pattern: SELECT * FROM businesses WHERE city = ? AND district = ?
CREATE INDEX IF NOT EXISTS idx_businesses_city_district 
ON public.businesses(city, district)
WHERE city IS NOT NULL AND district IS NOT NULL;

-- Query pattern: SELECT * FROM businesses WHERE city = ?
CREATE INDEX IF NOT EXISTS idx_businesses_city 
ON public.businesses(city)
WHERE city IS NOT NULL;

-- ============================================
-- 3. reviews table - business_id, status, created_at indexes
-- ============================================
-- Query pattern: SELECT * FROM reviews WHERE business_id = ? AND status = 'Visible' ORDER BY submitted_date DESC
CREATE INDEX IF NOT EXISTS idx_reviews_business_status_date 
ON public.reviews(business_id, status, submitted_date DESC)
WHERE status = 'Visible';

-- Query pattern: SELECT * FROM reviews WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_reviews_business_id 
ON public.reviews(business_id);

-- Query pattern: SELECT * FROM reviews WHERE status = 'Visible'
CREATE INDEX IF NOT EXISTS idx_reviews_status 
ON public.reviews(status)
WHERE status = 'Visible';

-- Query pattern: SELECT * FROM reviews ORDER BY submitted_date DESC
CREATE INDEX IF NOT EXISTS idx_reviews_submitted_date 
ON public.reviews(submitted_date DESC);

-- ============================================
-- 4. services table - business_id and position indexes
-- ============================================
-- Query pattern: SELECT * FROM services WHERE business_id = ? ORDER BY position
CREATE INDEX IF NOT EXISTS idx_services_business_position 
ON public.services(business_id, position);

-- Query pattern: SELECT * FROM services WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_services_business_id 
ON public.services(business_id);

-- ============================================
-- 5. deals table - business_id, status, date indexes
-- ============================================
-- Query pattern: SELECT * FROM deals WHERE business_id = ? AND status = 'Active' AND start_date <= NOW() AND end_date >= NOW()
CREATE INDEX IF NOT EXISTS idx_deals_business_status_dates 
ON public.deals(business_id, status, start_date, end_date)
WHERE status = 'Active';

-- Query pattern: SELECT * FROM deals WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_deals_business_id 
ON public.deals(business_id);

-- Query pattern: SELECT * FROM deals WHERE status = 'Active'
CREATE INDEX IF NOT EXISTS idx_deals_status 
ON public.deals(status)
WHERE status = 'Active';

-- Query pattern: SELECT * FROM deals WHERE start_date <= ? AND end_date >= ?
CREATE INDEX IF NOT EXISTS idx_deals_dates 
ON public.deals(start_date, end_date);

-- ============================================
-- 6. media_items table - business_id and position indexes
-- ============================================
-- Query pattern: SELECT * FROM media_items WHERE business_id = ? ORDER BY position
CREATE INDEX IF NOT EXISTS idx_media_items_business_position 
ON public.media_items(business_id, position);

-- Query pattern: SELECT * FROM media_items WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_media_items_business_id 
ON public.media_items(business_id);

-- ============================================
-- 7. team_members table - business_id index
-- ============================================
-- Query pattern: SELECT * FROM team_members WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_team_members_business_id 
ON public.team_members(business_id);

-- ============================================
-- 8. appointments table - business_id and status indexes
-- ============================================
-- Query pattern: SELECT * FROM appointments WHERE business_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_appointments_business_status 
ON public.appointments(business_id, status);

-- Query pattern: SELECT * FROM appointments WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_appointments_business_id 
ON public.appointments(business_id);

-- Query pattern: SELECT * FROM appointments WHERE date = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_appointments_date_status 
ON public.appointments(date, status);

-- ============================================
-- 9. business_blog_posts table - business_id and status indexes
-- ============================================
-- Query pattern: SELECT * FROM business_blog_posts WHERE business_id = ? AND status = 'Published' ORDER BY published_date DESC
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_business_status_date 
ON public.business_blog_posts(business_id, status, published_date DESC NULLS LAST)
WHERE status = 'Published';

-- Query pattern: SELECT * FROM business_blog_posts WHERE business_id = ?
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_business_id 
ON public.business_blog_posts(business_id);

-- Query pattern: SELECT * FROM business_blog_posts WHERE status = 'Published'
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_status 
ON public.business_blog_posts(status)
WHERE status = 'Published';

-- ============================================
-- 10. Update table statistics for query planner
-- ============================================
ANALYZE public.blog_posts;
ANALYZE public.businesses;
ANALYZE public.reviews;
ANALYZE public.services;
ANALYZE public.deals;
ANALYZE public.media_items;
ANALYZE public.team_members;
ANALYZE public.appointments;
ANALYZE public.business_blog_posts;
```

---

## VERIFY INDEXES (Sau khi apply, chạy query này để kiểm tra):

```sql
-- Kiểm tra tất cả indexes đã được tạo
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('blog_posts', 'businesses', 'reviews', 'services', 'deals', 'media_items', 'team_members', 'appointments', 'business_blog_posts')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Kết quả mong đợi:** Sẽ thấy khoảng 20+ indexes mới được tạo

---

## LƯU Ý:

1. **An toàn:** Tất cả indexes đều dùng `IF NOT EXISTS`, nên có thể chạy nhiều lần không lỗi
2. **Thời gian:** Migration này có thể mất 1-2 phút tùy vào số lượng data
3. **Không mất data:** Chỉ tạo indexes, không thay đổi data
4. **Performance:** Sau khi apply, queries sẽ nhanh hơn đáng kể

---

## TROUBLESHOOTING:

### Lỗi: "relation does not exist"
- **Nguyên nhân:** Table chưa được tạo
- **Giải pháp:** Chạy migration cơ bản trước: `20250105000000_align_to_schema_v1.0.sql`

### Lỗi: "index already exists"
- **Nguyên nhân:** Index đã được tạo trước đó
- **Giải pháp:** Không sao, có thể bỏ qua hoặc dùng `DROP INDEX IF EXISTS` trước

### Migration chạy quá lâu
- **Nguyên nhân:** Database có nhiều data
- **Giải pháp:** Bình thường, đợi migration hoàn thành (có thể mất vài phút)

---

**Sau khi apply xong, test lại queries để xem performance improvement!**
