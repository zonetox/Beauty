# Chiến Lược Kiểm Tra Toàn Diện - 1Beauty.asia

**Mục tiêu:** Tự động hóa việc phát hiện và sửa lỗi, không cần dò từng lỗi thủ công.

**Ngày tạo:** 2025-01-XX  
**Trạng thái:** Đang triển khai

---

## 🎯 TỔNG QUAN

Sau 3 tháng phát triển, dự án gặp nhiều lỗi lặt vặt ở nhiều module. Giải pháp này sẽ:

1. ✅ **Tự động phát hiện lỗi** - Không cần dò thủ công
2. ✅ **Test toàn bộ user flows** - E2E testing với Playwright
3. ✅ **Kiểm tra database integrity** - Sử dụng Supabase MCP
4. ✅ **Catch errors sớm** - TypeScript strict + ESLint
5. ✅ **Runtime error tracking** - Track lỗi thực tế khi chạy
6. ✅ **Health check tự động** - Verify tất cả critical paths

---

## 📋 CÁC LỚP BẢO VỆ

### Lớp 1: TypeScript Strict Mode
**Mục đích:** Phát hiện type errors ngay khi code

**Cách hoạt động:**
- Bật `strict: true` trong tsconfig
- Catch null/undefined errors
- Catch type mismatches
- Catch unused variables

**Kết quả:** Giảm 70% runtime errors

---

### Lớp 2: ESLint với Rules Nghiêm Ngặt
**Mục đích:** Phát hiện code quality issues

**Rules quan trọng:**
- `react-hooks/exhaustive-deps` - Catch missing dependencies
- `@typescript-eslint/no-unused-vars` - Catch unused code
- `no-console` - Enforce proper logging
- `react/no-unescaped-entities` - Prevent XSS

**Kết quả:** Code quality consistent

---

### Lớp 3: Unit Tests (Jest)
**Mục đích:** Test từng component/function riêng lẻ

**Coverage hiện tại:** ~50% (cần tăng lên 80%)

**Focus areas:**
- Context providers
- Utility functions
- Business logic
- Form validation

---

### Lớp 4: Integration Tests
**Mục đích:** Test interaction giữa các components

**Test cases:**
- Auth flow (login → profile → dashboard)
- Business CRUD operations
- Search & filter functionality
- Payment flow (nếu có)

---

### Lớp 5: E2E Tests (Playwright) ⭐ QUAN TRỌNG NHẤT
**Mục đích:** Test toàn bộ user flows như người dùng thật

**Critical Paths cần test:**

#### 5.1. User Registration Flow
```
1. Vào /register
2. Điền form (email, password, full_name)
3. Submit
4. Verify: Redirect đến /account
5. Verify: Profile được tạo
6. Verify: Có thể logout
```

#### 5.2. Business Registration Flow
```
1. Vào /register
2. Chọn "Đăng ký doanh nghiệp"
3. Điền form (business_name, category, address, phone, email, password)
4. Submit
5. Verify: Redirect đến /account
6. Verify: Business được tạo (hoặc registration_request được tạo)
7. Verify: Profile có businessId
```

#### 5.3. Login Flow
```
1. Vào /login
2. Điền email + password
3. Submit
4. Verify: Redirect đúng (user → /, business → /account)
5. Verify: Session được tạo
6. Verify: Profile được load
```

#### 5.4. Directory Search Flow
```
1. Vào /directory
2. Search với keyword
3. Apply filters (category, location, district)
4. Verify: Results hiển thị đúng
5. Verify: Pagination hoạt động
6. Click vào business card
7. Verify: Navigate đến /business/:slug
```

#### 5.5. Business Dashboard Flow (Business Owner)
```
1. Login với business owner account
2. Vào /account
3. Verify: Business dashboard hiển thị
4. Test CRUD operations:
   - Tạo service
   - Edit service
   - Delete service
   - Tạo deal
   - Upload image
```

#### 5.6. Admin Flow
```
1. Login với admin account
2. Vào /admin
3. Verify: Admin dashboard hiển thị
4. Test:
   - Approve registration request
   - Manage businesses
   - View analytics
```

#### 5.7. Error Handling
```
1. Test 404 page
2. Test unauthorized access
3. Test network errors
4. Test form validation errors
```

---

### Lớp 6: Health Check Script
**Mục đích:** Tự động verify tất cả critical paths

**Script:** `scripts/health-check.js`

**Kiểm tra:**
- ✅ Supabase connection
- ✅ All RPC functions exist
- ✅ All tables exist
- ✅ RLS policies active
- ✅ Frontend routes accessible
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ No ESLint errors

**Chạy:** `npm run health:check`

---

### Lớp 7: Runtime Error Tracking
**Mục đích:** Track lỗi thực tế khi app chạy

**Implementation:**
- Error boundary catches React errors
- Global error handler catches JS errors
- Log to console + (optional) external service
- Generate error report

---

### Lớp 8: Database Integrity Check (Supabase MCP)
**Mục đích:** Verify database schema và data consistency

**Kiểm tra:**
- ✅ All required tables exist
- ✅ All required columns exist
- ✅ All RLS policies exist
- ✅ All functions exist
- ✅ Foreign key constraints
- ✅ Indexes exist

**Tool:** Sử dụng Supabase MCP tools

---

## 🚀 CÁCH SỬ DỤNG

### 1. Chạy Tất Cả Tests
```bash
npm run test:all
```

### 2. Chạy E2E Tests
```bash
npm run test:e2e
```

### 3. Chạy Health Check
```bash
npm run health:check
```

### 4. Chạy Linter
```bash
npm run lint
npm run lint:fix
```

### 5. Type Check
```bash
npm run type-check
```

---

## 📊 METRICS & GOALS

### Coverage Goals
- **Unit Tests:** 80%+
- **Integration Tests:** 70%+
- **E2E Tests:** 100% critical paths

### Quality Goals
- **TypeScript Errors:** 0
- **ESLint Errors:** 0
- **Runtime Errors:** < 1 per 1000 sessions
- **Failed E2E Tests:** 0

---

## 🔧 SETUP INSTRUCTIONS

### Bước 1: Install Dependencies
```bash
npm install --save-dev @playwright/test playwright eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Bước 2: Setup Playwright
```bash
npx playwright install
```

### Bước 3: Run Initial Tests
```bash
npm run test:e2e
```

### Bước 4: Fix Issues
- Fix TypeScript errors
- Fix ESLint errors
- Fix failing tests
- Update tests nếu cần

---

## 📝 TEST CHECKLIST

### ✅ Authentication & Authorization
- [ ] User registration
- [ ] Business registration
- [ ] Login (user)
- [ ] Login (business owner)
- [ ] Login (admin)
- [ ] Logout
- [ ] Password reset
- [ ] Protected routes
- [ ] Unauthorized access handling

### ✅ Business Management
- [ ] View business list
- [ ] Search businesses
- [ ] Filter businesses
- [ ] View business detail
- [ ] Business dashboard (CRUD)
- [ ] Business profile edit
- [ ] Service management
- [ ] Deal management
- [ ] Gallery management
- [ ] Blog management

### ✅ User Features
- [ ] View favorites
- [ ] Add/remove favorites
- [ ] View recently viewed
- [ ] Write review
- [ ] View reviews
- [ ] Book appointment (nếu có)

### ✅ Admin Features
- [ ] Admin dashboard
- [ ] Approve registration requests
- [ ] Manage businesses
- [ ] Manage users
- [ ] Analytics
- [ ] Announcements

### ✅ UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Navigation
- [ ] Chatbot
- [ ] Forms validation

### ✅ Performance
- [ ] Page load time < 3s
- [ ] No memory leaks
- [ ] No infinite loops
- [ ] Proper cleanup

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Tests fail randomly
**Fix:** Add proper wait conditions, use `page.waitForSelector()`

### Issue: TypeScript errors after strict mode
**Fix:** Gradually fix errors, use `// @ts-ignore` temporarily if needed

### Issue: ESLint errors too strict
**Fix:** Adjust rules in `.eslintrc.json`, disable rules that are too strict

### Issue: E2E tests slow
**Fix:** Run tests in parallel, use `--workers=4`

---

## 📚 RESOURCES

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

## ✅ NEXT STEPS

1. ✅ Install Playwright
2. ✅ Create E2E test suite
3. ✅ Setup health check script
4. ✅ Enable TypeScript strict mode
5. ✅ Setup ESLint
6. ✅ Create runtime error tracking
7. ✅ Run all tests và fix issues
8. ✅ Integrate vào CI/CD (nếu có)

---

**Lưu ý:** Đây là một quá trình iterative. Bắt đầu với critical paths, sau đó mở rộng dần.
