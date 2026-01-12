# 🔧 Sửa Lỗi Tải 2 Lần Khi Vào Trang Web

**Ngày:** 2025-01-12  
**Vấn đề:** Lần đầu vào trang web tải dữ liệu 2 lần

---

## 🔍 NGUYÊN NHÂN

### React.StrictMode trong Development
- `index.tsx` có `<React.StrictMode>` bao quanh `<App />`
- Trong development mode, StrictMode sẽ **mount → unmount → mount lại** components để test cleanup functions
- Điều này gây ra các `useEffect` chạy 2 lần khi mount
- Các contexts (`BusinessDataContext`, `HomepageDataContext`) có `useEffect` fetch data khi mount → fetch 2 lần

### Các Contexts Bị Ảnh Hưởng:
1. **BusinessDataContext**: `useEffect(() => { fetchAllPublicData(); }, [fetchAllPublicData])`
2. **HomepageDataContext**: `useEffect(() => { fetchHomepageData(); }, [])`

---

## ✅ GIẢI PHÁP

### Thêm `useRef` để Prevent Double Fetch

**Cơ chế:**
- Dùng `useRef` để track xem đã fetch chưa
- Nếu đã fetch rồi thì skip, không fetch lại
- `useRef` không trigger re-render và persist qua các lần mount/unmount trong StrictMode

---

## 📋 FILES ĐÃ SỬA

### 1. `contexts/BusinessDataContext.tsx`

**Thêm:**
```typescript
// Prevent double fetch in React.StrictMode (development)
const hasFetchedRef = useRef(false);
```

**Sửa useEffect:**
```typescript
// Old:
useEffect(() => { fetchAllPublicData(); }, [fetchAllPublicData]);

// New:
useEffect(() => {
  // Prevent double fetch in React.StrictMode
  if (hasFetchedRef.current) return;
  hasFetchedRef.current = true;
  fetchAllPublicData();
}, [fetchAllPublicData]);
```

### 2. `contexts/HomepageDataContext.tsx`

**Thêm import:**
```typescript
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
```

**Thêm ref:**
```typescript
// Prevent double fetch in React.StrictMode (development)
const hasFetchedRef = useRef(false);
```

**Sửa useEffect:**
```typescript
// Old:
useEffect(() => {
  fetchHomepageData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Only run once on mount

// New:
useEffect(() => {
  // Prevent double fetch in React.StrictMode
  if (hasFetchedRef.current) return;
  hasFetchedRef.current = true;
  fetchHomepageData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Only run once on mount
```

---

## 🎯 KẾT QUẢ

### Trước Khi Sửa:
- ❌ Lần đầu vào trang web fetch data 2 lần
- ❌ Tăng tải cho database/server
- ❌ Tăng thời gian load trang

### Sau Khi Sửa:
- ✅ Chỉ fetch 1 lần dù StrictMode mount 2 lần
- ✅ Giảm tải cho database/server
- ✅ Load trang nhanh hơn

---

## 💡 LƯU Ý

### React.StrictMode
- **Development mode:** StrictMode mount 2 lần để test cleanup functions
- **Production mode:** StrictMode không có effect này
- **Giải pháp:** Dùng `useRef` để prevent double fetch trong development

### useRef vs useState
- `useRef` không trigger re-render
- `useRef.current` persist qua các lần mount/unmount trong StrictMode
- Phù hợp để track "đã fetch chưa" mà không cần re-render

---

## 🧪 TESTING

### Test Case 1: Development Mode
1. Mở DevTools → Network tab
2. Refresh trang
3. **Expected:** 
   - Chỉ thấy 1 request đến `/rest/v1/businesses`
   - Chỉ thấy 1 request đến `/rest/v1/page_content`

### Test Case 2: Production Mode
1. Build production: `npm run build`
2. Serve production build
3. **Expected:**
   - Chỉ fetch 1 lần (StrictMode không có effect trong production)

---

## 📚 TÀI LIỆU THAM KHẢO

- [React.StrictMode Documentation](https://react.dev/reference/react/StrictMode)
- [useRef Hook](https://react.dev/reference/react/useRef)
- [React 18 StrictMode Double Mount](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)

---

**Status:** ✅ **Đã sửa xong**
