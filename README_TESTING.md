# 🧪 Hệ Thống Kiểm Tra Tự Động - 1Beauty.asia

## 🎯 Vấn Đề

Sau 3 tháng phát triển, dự án gặp nhiều lỗi lặt vặt ở nhiều module. Việc dò từng lỗi thủ công mất rất nhiều thời gian và không hiệu quả.

## ✅ Giải Pháp

Hệ thống kiểm tra tự động với **8 lớp bảo vệ**:

1. **TypeScript Strict Mode** - Catch type errors sớm
2. **ESLint** - Catch code quality issues  
3. **Unit Tests (Jest)** - Test từng component
4. **Integration Tests** - Test interaction giữa components
5. **E2E Tests (Playwright)** ⭐ - Test toàn bộ user flows
6. **Health Check Script** - Verify config & database
7. **Runtime Error Tracking** - Track lỗi thực tế
8. **Database Integrity Check** - Verify database schema

---

## 🚀 Quick Start

### Bước 1: Cài Đặt (Chỉ 1 lần)

```bash
npm install --save-dev @playwright/test playwright eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
npx playwright install
```

### Bước 2: Chạy Kiểm Tra

```bash
# Kiểm tra tất cả (khuyến nghị)
npm run check:all

# Hoặc từng loại:
npm run type-check      # TypeScript
npm run lint            # ESLint
npm run test            # Unit tests
npm run test:e2e        # E2E tests
npm run health:check    # Health check
```

---

## 📋 Các Lệnh Có Sẵn

| Lệnh | Mô tả |
|------|-------|
| `npm run check:all` | Chạy tất cả checks (TypeScript + ESLint + Tests + Health) |
| `npm run test:all` | Chạy TypeScript + ESLint + Unit tests |
| `npm run test:e2e` | Chạy E2E tests (Playwright) |
| `npm run test:e2e:ui` | Chạy E2E tests với UI mode |
| `npm run test:e2e:headed` | Chạy E2E tests với browser visible |
| `npm run type-check` | Kiểm tra TypeScript errors |
| `npm run lint` | Kiểm tra ESLint errors |
| `npm run lint:fix` | Tự động sửa ESLint errors |
| `npm run health:check` | Kiểm tra config & database |

---

## 🧪 E2E Tests Coverage

E2E tests tự động test các critical paths:

- ✅ Homepage loads
- ✅ User registration flow
- ✅ Business registration flow
- ✅ Login flow
- ✅ Directory search & filter
- ✅ Navigation
- ✅ 404 page
- ✅ Chatbot toggle
- ✅ Error handling

**File:** `tests/e2e/critical-paths.spec.ts`

---

## 🔍 Health Check

Health check script kiểm tra:

- ✅ Supabase connection
- ✅ Database tables tồn tại
- ✅ RPC functions tồn tại
- ✅ TypeScript config
- ✅ Package dependencies

**File:** `scripts/health-check.js`

---

## 📊 Kết Quả

Sau khi chạy `npm run check:all`, bạn sẽ thấy:

```
📊 Summary:
✅ Passed: 5
❌ Failed: 0
🚨 Critical Failed: 0

✅ All critical checks passed!
```

---

## 🔧 Sửa Lỗi

### TypeScript Errors
```bash
npm run type-check
# Sửa từng lỗi, hoặc dùng // @ts-ignore tạm thời
```

### ESLint Errors
```bash
npm run lint:fix  # Tự động sửa
# Hoặc sửa thủ công
```

### E2E Test Failures
1. Xem report: `npx playwright show-report`
2. Check screenshots trong `test-results/`
3. Sửa code theo lỗi

---

## 📁 Cấu Trúc Files

```
├── playwright.config.ts          # Playwright config
├── .eslintrc.json                # ESLint config
├── tsconfig.strict.json          # TypeScript strict mode
├── tests/
│   ├── e2e/
│   │   └── critical-paths.spec.ts # E2E tests
│   └── integration/              # Integration tests
├── scripts/
│   ├── health-check.js           # Health check script
│   └── run-all-checks.js         # Run all checks
└── docs/
    └── TESTING_QUICK_START.md    # Quick start guide
```

---

## 💡 Best Practices

1. **Chạy thường xuyên:** Mỗi khi code xong, chạy `npm run check:all`
2. **Fix từng loại:** Fix TypeScript trước, rồi ESLint, rồi tests
3. **E2E tests chậm:** Chỉ chạy khi cần, hoặc chạy `npm run test:e2e:headed` để xem
4. **Health check nhanh:** Chạy `npm run health:check` để verify config

---

## 🆘 Troubleshooting

### Tests fail ngẫu nhiên
Thêm `await page.waitForTimeout(1000)` nếu cần

### Playwright không chạy
```bash
npx playwright install
```

### ESLint quá strict
Điều chỉnh rules trong `.eslintrc.json`

### Health check fail
Kiểm tra environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📚 Tài Liệu

- [Quick Start Guide](docs/TESTING_QUICK_START.md)
- [Playwright Docs](https://playwright.dev)
- [Jest Docs](https://jestjs.io)
- [ESLint Docs](https://eslint.org)

---

## ✅ Checklist

Sau khi setup, verify:

- [ ] `npm run check:all` chạy thành công
- [ ] E2E tests pass (hoặc ít nhất không crash)
- [ ] Health check pass
- [ ] TypeScript check pass (hoặc chỉ warnings)
- [ ] ESLint check pass (hoặc chỉ warnings)

---

**Lưu ý:** Bắt đầu với `npm run health:check` để đảm bảo môi trường OK, sau đó chạy `npm run check:all`.
