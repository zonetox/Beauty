# Hướng Dẫn Kiểm Tra Tự Động - Quick Start

## 🎯 Mục Tiêu

Tự động phát hiện và sửa lỗi, không cần dò từng lỗi thủ công.

---

## 🚀 Cài Đặt (Chỉ cần làm 1 lần)

```bash
# 1. Install Playwright và ESLint
npm install --save-dev @playwright/test playwright eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks

# 2. Install Playwright browsers
npx playwright install
```

---

## ✅ Chạy Kiểm Tra

### 1. Kiểm Tra Tất Cả (Khuyến nghị)
```bash
npm run test:all
```
Chạy: TypeScript check → ESLint → Unit tests → E2E tests

### 2. Chỉ E2E Tests (Test user flows)
```bash
npm run test:e2e
```

### 3. Health Check (Kiểm tra config & database)
```bash
npm run health:check
```

### 4. TypeScript Check
```bash
npm run type-check
```

### 5. ESLint
```bash
npm run lint
npm run lint:fix  # Tự động sửa nếu có thể
```

---

## 📋 Các Test Cases

### E2E Tests tự động test:
- ✅ Homepage loads
- ✅ User registration
- ✅ Business registration  
- ✅ Login flow
- ✅ Directory search
- ✅ Navigation
- ✅ 404 page
- ✅ Chatbot toggle
- ✅ Error handling

### Health Check kiểm tra:
- ✅ Supabase connection
- ✅ Database tables
- ✅ RPC functions
- ✅ TypeScript config
- ✅ Package dependencies

---

## 🔧 Sửa Lỗi

### Nếu E2E test fail:
1. Xem report: `npx playwright show-report`
2. Check screenshots trong `test-results/`
3. Sửa code theo lỗi

### Nếu TypeScript errors:
```bash
npm run type-check
# Sửa từng lỗi, hoặc dùng // @ts-ignore tạm thời
```

### Nếu ESLint errors:
```bash
npm run lint:fix  # Tự động sửa
# Hoặc sửa thủ công
```

---

## 📊 Kết Quả

Sau khi chạy `npm run test:all`, bạn sẽ biết:
- ✅ Có bao nhiêu tests pass/fail
- ✅ Có bao nhiêu TypeScript errors
- ✅ Có bao nhiêu ESLint warnings
- ✅ Database có vấn đề gì không

---

## 💡 Tips

1. **Chạy thường xuyên:** Mỗi khi code xong, chạy `npm run test:all`
2. **Fix từng loại:** Fix TypeScript trước, rồi ESLint, rồi tests
3. **E2E tests chậm:** Chỉ chạy khi cần, hoặc chạy `npm run test:e2e:headed` để xem
4. **Health check nhanh:** Chạy `npm run health:check` để verify config

---

## 🆘 Vấn Đề?

- **Tests fail ngẫu nhiên:** Thêm `await page.waitForTimeout(1000)` nếu cần
- **Playwright không chạy:** Chạy `npx playwright install` lại
- **ESLint quá strict:** Điều chỉnh rules trong `.eslintrc.json`

---

**Lưu ý:** Bắt đầu với `npm run health:check` để đảm bảo môi trường OK, sau đó chạy `npm run test:all`.
