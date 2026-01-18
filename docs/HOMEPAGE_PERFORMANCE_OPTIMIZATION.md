# 🚀 HOMEPAGE PERFORMANCE OPTIMIZATION PLAN

**Ngày:** 2025-01-20  
**Phân tích:** Hệ thống timeout hàng loạt ở tầng fetch dữ liệu

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### Queries chạy khi load Homepage:

1. **PublicDataProvider** (`contexts/BusinessDataContext.tsx`):
   - ✅ `fetchBusinesses(1)` - RPC `search_businesses_advanced`
   - ✅ `markers` - Map markers query
   - ✅ `blog_posts` - Blog posts (limit 50)
   - ✅ `blog_categories` - Blog categories
   - ✅ `membership_packages` - Membership packages

2. **HomepageDataProvider** (`contexts/HomepageDataContext.tsx`):
   - ✅ `page_content` - Homepage content (hero, sections)

**Tổng: 6 queries chạy song song khi load homepage**

---

## 🎯 PHÂN LOẠI QUERIES

### 🔴 CRITICAL (Cần load ngay):
1. **Homepage content** (`page_content`) - Hero slides, sections
2. **Featured businesses** - 8-12 businesses nổi bật để hiển thị

### 🟡 NON-CRITICAL (Có thể lazy load):
1. **Blog posts** - Load sau 1-2s
2. **Blog categories** - Load sau 1-2s  
3. **Membership packages** - Load sau 2-3s
4. **Markers** - Chỉ load khi map visible hoặc sau 3s

---

## ✅ GIẢI PHÁP ĐỀ XUẤT

### 1. **Thêm Performance Logging** (BẮT BUỘC)

```typescript
// Thêm vào mỗi query để đo thời gian
const startTime = performance.now();
const { data, error } = await supabase.from('blog_posts')...;
const duration = performance.now() - startTime;
console.log(`[PERF] blog_posts query: ${duration.toFixed(2)}ms`);
```

**Mục đích:**
- Xác định query nào chậm nhất
- Monitor cold start impact
- Track performance over time

---

### 2. **Tách Critical vs Non-Critical Fetch**

**Critical (load ngay):**
```typescript
// Homepage content + Featured businesses only
const criticalData = await Promise.all([
  fetchHomepageContent(),
  fetchFeaturedBusinesses(8) // Only 8 featured businesses
]);
```

**Non-Critical (lazy load sau 2s):**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    fetchBlogPosts();
    fetchBlogCategories();
    fetchPackages();
  }, 2000);
  return () => clearTimeout(timer);
}, []);
```

---

### 3. **Tăng Timeout cho Cold Start**

```typescript
// Cold start: 12-15s
// Warm: 8-10s
const TIMEOUT_COLD_START = 12000;
const TIMEOUT_WARM = 8000;
```

**Lý do:**
- Supabase/Firebase có cold start ~3-5s
- Network latency ~1-2s
- Query processing ~2-5s
- Tổng: 8-12s cho cold start

---

### 4. **Optimize Database Queries**

#### A. Indexes đã có (kiểm tra):
- ✅ `idx_businesses_is_featured` - Featured businesses
- ✅ `idx_businesses_is_active` - Active filter
- ✅ `idx_blog_posts_date` - Blog posts sorting
- ✅ `idx_blog_posts_category` - Category filter

#### B. Thêm query-specific optimizations:
```sql
-- Featured businesses query (nhanh hơn)
SELECT * FROM businesses 
WHERE is_featured = true 
  AND is_active = true
ORDER BY rating DESC, review_count DESC
LIMIT 12; -- Chỉ 12 businesses cho homepage
```

---

### 5. **Add Request Batching** (Nếu cần)

**Option 1: Single RPC Function**
```sql
CREATE FUNCTION get_homepage_data()
RETURNS JSONB AS $$
SELECT jsonb_build_object(
  'featured_businesses', (SELECT jsonb_agg(...) FROM businesses WHERE is_featured LIMIT 12),
  'blog_posts', (SELECT jsonb_agg(...) FROM blog_posts ORDER BY date DESC LIMIT 6),
  'categories', (SELECT jsonb_agg(...) FROM blog_categories)
);
$$;
```

**Option 2: Keep Separate (Đơn giản hơn)**
- Giữ separate queries như hiện tại
- Chỉ optimize critical queries
- Lazy load non-critical

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Logging (Ưu tiên cao)
- [ ] Thêm `performance.now()` logging vào mỗi query
- [ ] Log query name, duration, success/failure
- [ ] Console log trong development, silent trong production

### Phase 2: Critical/Non-Critical Split (Ưu tiên cao)
- [ ] Tách `fetchCriticalHomepageData()` - chỉ homepage content + featured businesses
- [ ] Load critical data ngay
- [ ] Lazy load non-critical sau 2s

### Phase 3: Timeout Optimization (Ưu tiên trung)
- [ ] Tăng timeout critical queries: 12s
- [ ] Tăng timeout non-critical queries: 15s
- [ ] Thêm retry logic cho critical queries

### Phase 4: Database Optimization (Ưu tiên thấp)
- [ ] Verify indexes exist
- [ ] Optimize featured businesses query (limit 12)
- [ ] Consider RPC function nếu cần

---

## 🎯 KẾT QUẢ MONG ĐỢI

### Trước:
```
All 6 queries: 10-15s (cold start) → timeout
User sees: Empty homepage → error messages
```

### Sau:
```
Critical queries (2): 3-5s → Homepage visible
Non-critical (4): Load sau 2s → Background
User sees: Homepage loads fast → content fills in gradually
```

**Metric:**
- **Time to Interactive (TTI):** 3-5s (từ 10-15s)
- **First Contentful Paint (FCP):** 2-3s (từ 8-12s)
- **User Perception:** Homepage loads fast ✅

---

## 📝 NOTES

1. **Keep parallel execution** - Đã fix, giữ nguyên
2. **Add logging** - Critical để debug production issues
3. **Lazy load non-critical** - Best practice cho homepage performance
4. **Timeout values** - 12s cho cold start là hợp lý

**Status:** 🔄 Đang implement...
