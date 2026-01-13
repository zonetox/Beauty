# 🔧 HƯỚNG DẪN SETUP CI/CD

**Ngày tạo:** 2025-01-13  
**Mục đích:** Hướng dẫn chi tiết cách setup CI/CD cho dự án này

---

## 📋 TỔNG QUAN

Dự án này có thể setup CI/CD theo 2 cách:

1. **Vercel Auto-Deploy** (Đơn giản, đã có sẵn)
2. **GitHub Actions** (Nâng cao, nhiều tính năng hơn)

---

## 🚀 OPTION 1: VERCEL AUTO-DEPLOY (KHUYẾN NGHỊ)

### **Ưu điểm:**
- ✅ Đơn giản, không cần config
- ✅ Tự động deploy khi push code
- ✅ Preview deployments cho mỗi PR
- ✅ Tự động rollback nếu lỗi

### **Cách setup:**

#### **Bước 1: Connect GitHub với Vercel**

1. Vào https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Chọn **"Import Git Repository"**
4. Chọn repository của bạn
5. Click **"Import"**

#### **Bước 2: Configure Project**

Vercel sẽ tự động detect:
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`

**Environment Variables:**
- Thêm các biến môi trường:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_POSTHOG_API_KEY` (nếu dùng)
  - `VITE_SENTRY_DSN` (nếu dùng)

#### **Bước 3: Deploy**

Click **"Deploy"** → Vercel sẽ:
1. ✅ Clone code từ GitHub
2. ✅ Install dependencies
3. ✅ Build project
4. ✅ Deploy lên production

#### **Bước 4: Auto-Deploy Setup**

Sau khi deploy lần đầu, Vercel sẽ tự động:
- ✅ Deploy mỗi khi push code lên `main` branch
- ✅ Tạo preview deployment cho mỗi PR
- ✅ Gửi email thông báo khi deploy

**✅ Xong!** Vercel đã tự động setup CI/CD cho bạn.

---

## 🔧 OPTION 2: GITHUB ACTIONS (NÂNG CAO)

### **Ưu điểm:**
- ✅ Chạy tests trước khi deploy
- ✅ Kiểm soát tốt hơn quy trình
- ✅ Có thể chạy E2E tests
- ✅ Có thể deploy lên nhiều môi trường

### **Cách setup:**

#### **Bước 1: Tạo GitHub Secrets**

1. Vào GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Thêm các secrets sau:

```
VERCEL_TOKEN          # Lấy từ Vercel Dashboard → Settings → Tokens
VERCEL_ORG_ID         # Lấy từ Vercel Dashboard → Settings → General
VERCEL_PROJECT_ID     # Lấy từ Vercel Dashboard → Settings → General
VITE_SUPABASE_URL     # Supabase project URL
VITE_SUPABASE_ANON_KEY # Supabase anonymous key
```

**Cách lấy Vercel Token:**
1. Vào Vercel Dashboard
2. Settings → Tokens
3. Create Token
4. Copy token

**Cách lấy Vercel IDs:**
1. Vào Vercel Dashboard
2. Settings → General
3. Copy **Team ID** (Org ID)
4. Vào Project Settings → General
5. Copy **Project ID**

#### **Bước 2: Tạo Workflow File**

File đã được tạo sẵn tại: `.github/workflows/ci.yml`

**Nội dung workflow:**
- ✅ Chạy tests khi push code
- ✅ Build project
- ✅ Deploy lên Vercel nếu tests pass

#### **Bước 3: Push Code**

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI/CD pipeline"
git push
```

#### **Bước 4: Kiểm tra**

1. Vào GitHub repository
2. Click tab **"Actions"**
3. Xem workflow đang chạy
4. Xem kết quả (pass/fail)

**✅ Xong!** GitHub Actions sẽ tự động chạy mỗi khi push code.

---

## 📊 SO SÁNH 2 OPTIONS

| Tính năng | Vercel Auto-Deploy | GitHub Actions |
|-----------|-------------------|---------------|
| **Độ khó setup** | ⭐ Dễ | ⭐⭐ Trung bình |
| **Tự động deploy** | ✅ Có | ✅ Có |
| **Chạy tests trước deploy** | ❌ Không | ✅ Có |
| **Preview deployments** | ✅ Có | ✅ Có (với config) |
| **Rollback tự động** | ✅ Có | ⚠️ Cần config |
| **Chi phí** | 💰 Miễn phí | 💰 Miễn phí |

---

## 🎯 KHUYẾN NGHỊ

### **Cho người mới:**
→ **Dùng Vercel Auto-Deploy** (Option 1)
- Đơn giản, không cần config
- Tự động hoạt động ngay

### **Cho người có kinh nghiệm:**
→ **Dùng GitHub Actions** (Option 2)
- Kiểm soát tốt hơn
- Chạy tests trước khi deploy
- Có thể tùy chỉnh nhiều hơn

### **Tốt nhất:**
→ **Dùng cả 2**
- Vercel Auto-Deploy: Deploy nhanh
- GitHub Actions: Chạy tests và quality checks

---

## 🔍 KIỂM TRA CI/CD ĐANG HOẠT ĐỘNG

### **Vercel:**
1. Vào Vercel Dashboard
2. Xem tab **"Deployments"**
3. Mỗi commit sẽ có một deployment

### **GitHub Actions:**
1. Vào GitHub repository
2. Click tab **"Actions"**
3. Xem workflow runs

---

## 🐛 TROUBLESHOOTING

### **Vấn đề 1: Deploy fail**

**Nguyên nhân:**
- Build errors
- Missing environment variables
- Dependencies issues

**Giải pháp:**
1. Xem logs trong Vercel/GitHub Actions
2. Kiểm tra environment variables
3. Chạy `npm run build` local để test

### **Vấn đề 2: Tests fail**

**Nguyên nhân:**
- Code có lỗi
- Tests không stable
- Missing dependencies

**Giải pháp:**
1. Chạy `npm test` local
2. Fix lỗi
3. Push lại

### **Vấn đề 3: Environment variables không work**

**Nguyên nhân:**
- Chưa set trong Vercel/GitHub Secrets
- Sai tên biến
- Chưa restart deployment

**Giải pháp:**
1. Kiểm tra tên biến trong code
2. Set lại trong Vercel/GitHub
3. Redeploy

---

## 📚 TÀI LIỆU THAM KHẢO

- **Vercel Docs:** https://vercel.com/docs
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **CI/CD Best Practices:** https://www.atlassian.com/continuous-delivery/principles

---

## ✅ CHECKLIST SETUP

### **Vercel Auto-Deploy:**
- [ ] Connect GitHub repository với Vercel
- [ ] Set environment variables
- [ ] Deploy lần đầu
- [ ] Test auto-deploy (push code mới)

### **GitHub Actions:**
- [ ] Tạo GitHub Secrets
- [ ] Tạo workflow file (`.github/workflows/ci.yml`)
- [ ] Push code
- [ ] Kiểm tra Actions tab

---

**Tài liệu được tạo bởi:** AI Assistant  
**Ngày:** 2025-01-13  
**Version:** 1.0.0
