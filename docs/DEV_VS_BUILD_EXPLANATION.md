# Tại sao Dev Mode không lỗi nhưng Build lại lỗi?

## 🔍 Vấn đề

Khi chạy `npm run dev` (development mode) thì ứng dụng chạy bình thường, nhưng khi chạy `npm run build` (production build) thì lại xuất hiện lỗi:
- `Cannot access 'O' before initialization`
- `Cannot access 'we' before initialization`

## 📊 Sự khác biệt giữa Dev Mode và Production Build

### 1. **Development Mode (`npm run dev`)**

```bash
npm run dev  # Chạy Vite dev server
```

**Đặc điểm:**
- ✅ **Không minify code** - Code giữ nguyên format, dễ đọc
- ✅ **Không bundle** - Load modules riêng lẻ theo nhu cầu (ES modules)
- ✅ **Hot Module Replacement (HMR)** - Tự động reload khi code thay đổi
- ✅ **Source maps đầy đủ** - Dễ debug
- ✅ **Không code splitting** - Tất cả code load cùng lúc
- ✅ **Không tree shaking** - Giữ tất cả code, kể cả không dùng

**Vì sao không lỗi?**
- Modules được load **tuần tự** và **độc lập**
- Circular dependency không gây vấn đề vì ES modules xử lý tốt trong dev mode
- Code không bị minify nên biến tên giữ nguyên (dễ debug)

### 2. **Production Build (`npm run build`)**

```bash
npm run build  # Build production bundle
```

**Đặc điểm:**
- ⚠️ **Minify code** - Rút gọn biến tên (VD: `BusinessProvider` → `O`, `we`)
- ⚠️ **Bundle tất cả** - Gộp nhiều files thành 1 file
- ⚠️ **Code splitting** - Chia code thành nhiều chunks
- ⚠️ **Tree shaking** - Loại bỏ code không dùng
- ⚠️ **Optimization** - Tối ưu hóa code để giảm kích thước

**Vì sao lại lỗi?**
- Khi **bundle** và **minify**, Vite/Rollup phải:
  1. Phân tích tất cả dependencies
  2. Gộp code lại thành chunks
  3. Rút gọn tên biến
  4. Tối ưu hóa imports/exports

- **Circular dependency** gây vấn đề khi:
  - File A import từ File B
  - File B import từ File A
  - Khi bundle, cả 2 files được gộp lại
  - Thứ tự khởi tạo bị lộn xộn → Lỗi "Cannot access before initialization"

## 🔄 Circular Dependency trong trường hợp này

### Vấn đề:

```
BusinessContext.tsx
  ↓ import
BusinessDataContext.tsx
  ↓ import  
AdminContext.tsx
  ↓ import (có thể gián tiếp)
BusinessContext.tsx  ← Vòng lặp!
```

### Trong Dev Mode:
- Modules load độc lập
- ES modules xử lý tốt circular dependency
- Không có vấn đề

### Trong Production Build:
- Tất cả được bundle lại
- Minify rút gọn tên biến
- Thứ tự khởi tạo quan trọng
- Circular dependency → Lỗi!

## ✅ Giải pháp đã áp dụng

### 1. Tách Contexts thành Chunks riêng

```typescript
// vite.config.ts
manualChunks(id) {
  if (id.includes('contexts/')) {
    if (id.includes('BusinessContext')) {
      return 'context-business';  // Chunk riêng
    }
    if (id.includes('BusinessDataContext')) {
      return 'context-business-data';  // Chunk riêng
    }
    if (id.includes('AdminContext')) {
      return 'context-admin';  // Chunk riêng
    }
  }
}
```

**Kết quả:**
- Mỗi context được bundle vào chunk riêng
- Tránh circular dependency khi bundle
- Code vẫn hoạt động bình thường

### 2. Build Output

Sau khi fix, build tạo ra các chunks riêng:
```
dist/assets/context-admin-BZfXPfW8.js       13.83 kB
dist/assets/context-business-Dw9c4SCc.js     15.73 kB
dist/assets/context-business-data-okhr8vig.js 21.69 kB
dist/assets/contexts-Cu3fqpuv.js            36.67 kB
```

## 🧪 Cách kiểm tra trước khi deploy

### 1. Test Local Build

```bash
# Build production
npm run build

# Preview production build
npm run preview
```

### 2. Kiểm tra Circular Dependencies

```bash
# Cài đặt tool kiểm tra
npm install -D madge

# Kiểm tra circular dependencies
npx madge --circular --extensions ts,tsx .
```

### 3. Kiểm tra Build Output

```bash
# Xem kích thước các chunks
npm run build
# Kiểm tra dist/assets/ để xem các chunks được tạo ra
```

## 📝 Best Practices

### 1. Tránh Circular Dependencies

- ✅ Sử dụng dependency injection
- ✅ Tách shared logic ra file riêng
- ✅ Sử dụng events/callbacks thay vì direct imports

### 2. Code Splitting

- ✅ Tách contexts thành chunks riêng
- ✅ Lazy load các components lớn
- ✅ Tách vendor dependencies

### 3. Testing

- ✅ Luôn test production build trước khi deploy
- ✅ Sử dụng `npm run preview` để test build
- ✅ Kiểm tra console errors trong production build

## 🎯 Tóm tắt

| Aspect | Dev Mode | Production Build |
|--------|----------|------------------|
| **Minify** | ❌ Không | ✅ Có |
| **Bundle** | ❌ Không | ✅ Có |
| **Code Splitting** | ❌ Không | ✅ Có |
| **Circular Dependency** | ✅ Không ảnh hưởng | ⚠️ Gây lỗi |
| **Performance** | ⚠️ Chậm hơn | ✅ Nhanh hơn |
| **File Size** | ⚠️ Lớn | ✅ Nhỏ |

**Kết luận:** Luôn test production build (`npm run build` + `npm run preview`) trước khi deploy để phát hiện các vấn đề như circular dependency!
