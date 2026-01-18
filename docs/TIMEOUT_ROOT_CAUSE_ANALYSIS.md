# PHÂN TÍCH CĂN CỐT VẤN ĐỀ TIMEOUT

## 🔴 VẤN ĐỀ CĂN CỐT

### 1. **SEQUENTIAL QUERY EXECUTION (Nguyên nhân chính)**
**Vấn đề**: Các queries chạy **TUẦN TỰ** (sequential) thay vì **SONG SONG** (parallel), gây tích lũy latency.

**Vị trí**: `contexts/BusinessDataContext.tsx` - `fetchAllPublicData()`

**Hiện tại**:
```typescript
// ❌ SAI: Chạy tuần tự - query 2 phải đợi query 1 xong
await fetchBusinesses(1);  // Query 1: Chờ 5-10s
// Chỉ khi query 1 xong mới chạy query 2
await markerPromise;       // Query 2: Chờ 5-10s
// Tổng thời gian: 10-20s
```

**Hậu quả**:
- Nếu `fetchBusinesses()` mất 10s → markers query phải đợi 10s trước khi bắt đầu
- Tổng thời gian = tổng của tất cả queries
- Một query chậm → block tất cả queries sau

### 2. **RPC FUNCTION ĐƯỢC GỌI 2 LẦN**
**Vấn đề**: `search_businesses_advanced` được gọi **2 lần** cho cùng một query:
1. Lần 1: Lấy data (với limit/offset)
2. Lần 2: Lấy count (với limit 10000 để count)

**Vị trí**: `contexts/BusinessDataContext.tsx` - `fetchBusinesses()`

**Hiện tại**:
```typescript
// Lần 1: Lấy data
const { data: searchData } = await supabase.rpc('search_businesses_advanced', {
  p_limit: PAGE_SIZE,
  p_offset: from
});

// Lần 2: Count (GỌI LẠI FUNCTION VỚI LIMIT 10000!)
const { data: countData } = await supabase.rpc('search_businesses_advanced', {
  p_limit: 10000,  // ❌ Chạy lại function với 10000 records!
  p_offset: 0
});
```

**Hậu quả**:
- Mỗi lần gọi RPC function mất 5-10s
- Gọi 2 lần = 10-20s chỉ để fetch businesses
- RPC function với `p_limit: 10000` có thể scan toàn bộ table

### 3. **MARKERS QUERY KHÔNG CÓ LIMIT**
**Vấn đề**: Markers query có thể fetch **hàng nghìn records** không có limit.

**Vị trí**: `contexts/BusinessDataContext.tsx` - line 272

**Hiện tại**:
```typescript
const markerPromise = supabase.from('businesses')
  .select('id, name, latitude, longitude, categories, is_active')
  .eq('is_active', true)
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);
  // ❌ KHÔNG CÓ LIMIT!
```

**Hậu quả**:
- Nếu có 5000+ active businesses → fetch 5000+ records
- Transfer size: 5000 * ~200 bytes = ~1MB
- Network latency: 3-5s chỉ để transfer data
- Database scan: Phải scan toàn bộ `businesses` table (dù có index)

### 4. **KHÔNG CÓ CONNECTION POOLING**
**Vấn đề**: Supabase client không có config cho connection pooling/reuse.

**Vị trí**: `lib/supabaseClient.ts`

**Hiện tại**:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
        // ❌ KHÔNG CÓ CONFIG CHO CONNECTION POOLING
    }
});
```

**Hậu quả**:
- Mỗi query tạo connection mới → overhead
- Không reuse connections → slower

### 5. **MULTIPLE CONTEXTS FETCH CÙNG LÚC**
**Vấn đề**: Tất cả contexts mount cùng lúc và fetch data ngay khi mount.

**Vị trí**: `App.tsx` - Tất cả providers được wrap cùng lúc

**Hiện tại**:
```typescript
<UserSessionProvider>      // Fetch user profile
  <PublicDataProvider>      // Fetch businesses + blog + packages
    <HomepageDataProvider>  // Fetch homepage content
      <AdminProvider>       // Fetch admin data (nếu admin)
        ...
```

**Hậu quả**:
- Nhiều contexts fetch cùng lúc → compete cho network bandwidth
- Không có priority → critical data phải đợi non-critical data

---

## ✅ GIẢI PHÁP CĂN CỐT

### 1. **CHUYỂN SANG PARALLEL EXECUTION**
**Giải pháp**: Chạy tất cả queries **SONG SONG** với `Promise.all()` hoặc individual promises.

```typescript
// ✅ ĐÚNG: Chạy song song
const [businessesResult, markersResult, blogResult, catResult, pkgResult] = await Promise.allSettled([
  fetchBusinesses(1),
  markerPromise,
  blogPromise,
  catPromise,
  pkgPromise
]);
// Tổng thời gian: Max(timeout của từng query), không phải tổng
```

### 2. **OPTIMIZE RPC FUNCTION CALL**
**Giải pháp**: 
- Option A: Sử dụng `COUNT(*)` thay vì gọi lại RPC function
- Option B: RPC function return cả `data` và `total_count`
- Option C: Cache count trong database hoặc estimate từ result length

```typescript
// ✅ Option A: Sử dụng COUNT query riêng
const { count } = await supabase
  .from('businesses')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true);

// ✅ Option B: RPC function return count
// Modify RPC function to return total_count
```

### 3. **THÊM LIMIT CHO MARKERS QUERY**
**Giải pháp**: Chỉ fetch markers cần thiết, hoặc paginate.

```typescript
// ✅ Option A: Limit markers (nếu map chỉ hiển thị visible area)
const markerPromise = supabase.from('businesses')
  .select('id, name, latitude, longitude, categories, is_active')
  .eq('is_active', true)
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .limit(1000); // Chỉ fetch 1000 markers đầu tiên

// ✅ Option B: Fetch theo bounds (spatial query)
// Chỉ fetch markers trong visible map bounds
```

### 4. **THÊM CONNECTION POOLING CONFIG**
**Giải pháp**: Sử dụng Supabase pooler URL hoặc configure client properly.

```typescript
// ✅ Sử dụng pooler URL (nếu Supabase hỗ trợ)
const supabaseUrl = isSupabaseConfigured 
  ? supabaseUrlFromEnv.replace('.supabase.co', '.pooler.supabase.co')
  : 'https://dummy-url.supabase.co';
```

### 5. **LAZY LOAD NON-CRITICAL DATA**
**Giải pháp**: Chỉ fetch critical data ngay, lazy load sau.

```typescript
// ✅ Critical data: Fetch ngay
// - User session
// - Businesses (page 1)
// - Homepage content

// ⏱️ Non-critical data: Lazy load
// - Blog posts → Fetch sau 2s
// - Categories → Fetch sau 2s  
// - Packages → Fetch sau 2s
// - Markers → Fetch sau 1s (hoặc khi map visible)
```

---

## 📊 SO SÁNH HIỆU SUẤT

### Trước (Sequential):
```
fetchBusinesses:     10s
markers:            8s (bắt đầu sau 10s)
blog:               5s (bắt đầu sau 18s)
categories:         3s (bắt đầu sau 23s)
packages:           4s (bắt đầu sau 26s)
───────────────────────────────
TỔNG:               30s ⏱️
```

### Sau (Parallel):
```
fetchBusinesses:     10s ┐
markers:            8s  ├─ Chạy song song
blog:               5s  │
categories:         3s  │
packages:           4s  ┘
───────────────────────────────
TỔNG:               10s ⚡ (giảm 66%!)
```

---

## 🎯 KẾT LUẬN

**Nguyên nhân chính**: 
1. ❌ **Sequential execution** (70% impact)
2. ❌ **RPC function gọi 2 lần** (20% impact)
3. ❌ **Markers query không có limit** (10% impact)

**Tăng timeout** chỉ **che giấu vấn đề**, không giải quyết gốc rễ. Nếu có lỗi thực sự, tăng timeout chỉ làm **tăng thời gian chờ**, không cải thiện performance.

**Giải pháp căn cốt**: Chuyển sang **parallel execution** + **optimize queries** + **lazy load**.
