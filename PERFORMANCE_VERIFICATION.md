# PERFORMANCE OPTIMIZATION - VERIFICATION GUIDE

**Date:** 2025-01-18  
**Status:** ✅ Migration Applied

---

## ✅ ĐÃ HOÀN THÀNH

1. ✅ **Parallel Fetching** - Tất cả queries đã dùng Promise.all()
2. ✅ **Selective Fields** - Đã optimize tất cả queries
3. ✅ **Database Indexes** - Migration đã được apply
4. ✅ **React Query** - Đã install và integrate vào App.tsx

---

## 🔍 VERIFY INDEXES (Kiểm tra indexes đã được tạo)

Chạy query này trong Supabase SQL Editor để verify:

```sql
-- Kiểm tra tất cả indexes mới được tạo
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

**Kết quả mong đợi:** Sẽ thấy khoảng 20+ indexes mới

---

## 📊 TEST PERFORMANCE

### 1. Test Query Times (Trong Supabase SQL Editor)

```sql
-- Test 1: Featured Businesses (Homepage)
EXPLAIN ANALYZE
SELECT id, slug, name, logo_url, image_url, slogan, categories, address, city, district, ward, tags, phone, email, website, rating, review_count, view_count, membership_tier, is_verified, is_active, is_featured, joined_date, description, working_hours, socials, seo, hero_slides, hero_image_url, owner_id
FROM public.businesses
WHERE is_active = TRUE AND is_featured = TRUE
ORDER BY id ASC
LIMIT 20;

-- Test 2: Business by City
EXPLAIN ANALYZE
SELECT id, slug, name, logo_url, image_url, slogan, categories, address, city, district, ward, tags, phone, email, website, rating, review_count, view_count, membership_tier, is_verified, is_active, is_featured, joined_date, description, working_hours, socials, seo, hero_slides, hero_image_url, owner_id
FROM public.businesses
WHERE is_active = TRUE AND city = 'Ho Chi Minh'
ORDER BY is_featured DESC, id ASC
LIMIT 20;

-- Test 3: Reviews by Business
EXPLAIN ANALYZE
SELECT id, user_id, business_id, user_name, user_avatar_url, rating, comment, submitted_date, status, reply
FROM public.reviews
WHERE business_id = 1 AND status = 'Visible'
ORDER BY submitted_date DESC;

-- Test 4: Blog Posts
EXPLAIN ANALYZE
SELECT id, slug, title, image_url, excerpt, author, date, category, view_count
FROM public.blog_posts
ORDER BY date DESC
LIMIT 50;
```

**Kết quả mong đợi:**
- Execution Time: < 50ms cho mỗi query
- Index Scan: Sẽ thấy "Index Scan using idx_..." thay vì "Seq Scan"

### 2. Test Frontend Performance

1. **Mở DevTools** (F12)
2. **Network Tab** - Check request times
3. **Console** - Xem `[PERF]` logs

**Expected:**
- Homepage load: < 500ms
- Directory page: < 500ms
- Business detail: < 500ms

### 3. Monitor Performance Logs

Trong browser console, bạn sẽ thấy logs như:
```
[PERF] All Businesses: 234.56ms
[PERF] Markers: 189.23ms
[PERF] Blog Posts: 156.78ms
[PERF] Categories: 45.12ms
[PERF] Packages: 67.89ms
```

**Target:** Tất cả < 500ms

---

## 🎯 NEXT STEPS (Optional - Future Improvements)

### 1. Convert Contexts to React Query (Optional)

Hiện tại React Query đã được setup nhưng chưa được sử dụng. Có thể convert dần:

**Example:**
```typescript
// Thay vì dùng context
const { businesses, loading } = useBusinessData();

// Có thể dùng React Query
const { data: businesses, isLoading } = useQuery({
  queryKey: ['businesses', filters],
  queryFn: () => fetchBusinesses(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Request deduplication
- Better error handling

### 2. Add Query Prefetching

Prefetch data khi user hovers over links:

```typescript
const queryClient = useQueryClient();

const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['business', slug],
    queryFn: () => fetchBusinessBySlug(slug),
  });
};
```

### 3. Monitor Production Performance

- Setup monitoring (Sentry, PostHog)
- Track query times
- Alert nếu query > 1s

---

## 📈 EXPECTED IMPROVEMENTS

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Homepage Load | 1-1.4s | <500ms | ~60-70% faster |
| Directory Listing | 1.2s | <400ms | ~67% faster |
| Business Detail | 1.4s | <500ms | ~64% faster |
| Blog Posts List | 600ms | <200ms | ~67% faster |
| Data Transfer | 100% | 30-70% less | ~40-70% reduction |

---

## ✅ CHECKLIST

- [x] Migration applied successfully
- [ ] Indexes verified (run verification query)
- [ ] Performance tested (check query times)
- [ ] Frontend tested (check browser console logs)
- [ ] Production monitoring setup (optional)

---

## 🐛 TROUBLESHOOTING

### Queries vẫn chậm sau khi apply indexes

1. **Check indexes được sử dụng:**
   ```sql
   EXPLAIN ANALYZE <your_query>;
   ```
   - Nếu thấy "Seq Scan" → Index chưa được dùng
   - Nếu thấy "Index Scan" → Index đang được dùng

2. **Update statistics:**
   ```sql
   ANALYZE public.businesses;
   ANALYZE public.reviews;
   -- etc.
   ```

3. **Check data volume:**
   - Indexes hiệu quả hơn với nhiều data
   - Nếu data ít (< 1000 rows), improvement có thể không rõ ràng

### Frontend vẫn chậm

1. **Check Network tab:**
   - Xem request nào chậm nhất
   - Check payload size

2. **Check Console logs:**
   - Xem `[PERF]` logs
   - Identify slow queries

3. **Check React Query:**
   - Verify QueryClientProvider đã wrap App
   - Check query keys và staleTime

---

**Sau khi verify, bạn sẽ thấy performance improvement đáng kể!** 🚀
