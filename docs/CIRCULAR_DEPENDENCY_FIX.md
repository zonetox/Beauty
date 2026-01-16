# Circular Dependency & Initialization Order Fix

## Vấn đề

Lỗi `Cannot access 'G'/'q'/'$' before initialization` xảy ra khi build production do:
1. Circular dependency giữa contexts
2. Thứ tự khởi tạo không đúng khi Vite bundle và minify

## Giải pháp đã áp dụng

### 1. Loại bỏ Circular Dependencies
- ✅ Loại bỏ `useAdmin` import từ `BusinessDataContext`
- ✅ Loại bỏ `useAdmin` import từ `BusinessContext`
- ✅ Tất cả contexts giờ độc lập

### 2. Chuyển sang Function Declarations
- ✅ `PublicDataProvider` → `export function PublicDataProvider`
- ✅ `BusinessProvider` → `export function BusinessProvider`
- ✅ `useBusinessData` → `export function useBusinessData`
- ✅ `useMembershipPackageData` → `export function useMembershipPackageData`
- ✅ `usePublicData` → `function usePublicData` (internal)
- ✅ Tất cả hooks trong `BusinessContext` → function declarations

### 3. Tắt Manual Chunks cho Contexts
- ✅ Loại bỏ manual chunks cho contexts
- ✅ Để Vite tự động xử lý code splitting

### 4. Tạm thời tắt Minification
- ⚠️ `minify: false` để debug
- Nếu lỗi biến mất → vấn đề là minification
- Nếu lỗi vẫn còn → vấn đề là initialization order

## Cấu trúc hiện tại

```
BusinessDataContext (độc lập)
  ├─ PublicDataProvider (function declaration)
  ├─ useBusinessData (function declaration)
  ├─ useBlogData (function declaration)
  └─ useMembershipPackageData (function declaration)

BusinessContext (import từ BusinessDataContext)
  ├─ BusinessProvider (function declaration)
  ├─ useBusiness (function declaration)
  └─ Các sub-hooks (function declarations)

AdminContext (độc lập)
```

## Next Steps

1. Test với `minify: false` - nếu không còn lỗi → fix minification
2. Nếu vẫn lỗi → tách hooks ra file riêng
3. Hoặc sử dụng dynamic imports cho contexts

## Files Changed

- `contexts/BusinessDataContext.tsx` - Function declarations
- `contexts/BusinessContext.tsx` - Function declarations
- `vite.config.ts` - Tắt manual chunks, tạm thời tắt minify
