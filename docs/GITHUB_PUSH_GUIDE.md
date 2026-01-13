# 📤 HƯỚNG DẪN ĐẨY CODE LÊN GITHUB

**Ngày tạo:** 2025-01-13  
**Mục đích:** Hướng dẫn chi tiết cách push code lên GitHub

---

## 🚀 CÁCH 1: SỬ DỤNG SCRIPT TỰ ĐỘNG (KHUYẾN NGHỊ)

### **Bước 1: Chạy Script**

**Windows PowerShell:**
```powershell
.\scripts\push-to-github.ps1
```

**Script sẽ tự động:**
- ✅ Kiểm tra Git đã cài đặt
- ✅ Kiểm tra git repository
- ✅ Kiểm tra remote (GitHub URL)
- ✅ Hỏi commit message
- ✅ Hỏi branch
- ✅ Add, commit, và push code

### **Bước 2: Làm theo hướng dẫn**

Script sẽ hỏi bạn:
1. **Commit message:** Nhập mô tả thay đổi
2. **Branch:** Chọn branch để push (mặc định: branch hiện tại)
3. **Xác nhận:** Xác nhận trước khi push

**✅ Xong!** Code đã được push lên GitHub.

---

## 🔧 CÁCH 2: THỦ CÔNG (CHO NGƯỜI MUỐN KIỂM SOÁT)

### **Bước 1: Kiểm tra trạng thái**

```bash
git status
```

Xem các file đã thay đổi.

### **Bước 2: Add files**

```bash
# Add tất cả files
git add .

# Hoặc add từng file
git add file1.ts file2.tsx
```

### **Bước 3: Commit**

```bash
git commit -m "Update: Optimize app performance and mobile experience"
```

**Commit message nên:**
- ✅ Ngắn gọn, rõ ràng
- ✅ Mô tả thay đổi
- ✅ Sử dụng tiếng Anh hoặc tiếng Việt

**Ví dụ commit messages:**
- `"Fix: Resolve mobile viewport issue"`
- `"Update: Optimize bundle size"`
- `"Add: Mobile meta tags"`
- `"Refactor: Code splitting optimization"`

### **Bước 4: Push lên GitHub**

```bash
# Push lên branch hiện tại
git push origin main

# Hoặc push lên branch khác
git push origin develop
```

### **Bước 5: Kiểm tra**

Vào GitHub repository để xem code đã được push.

---

## 📋 SETUP LẦN ĐẦU (NẾU CHƯA CÓ GIT REPOSITORY)

### **Bước 1: Khởi tạo Git Repository**

```bash
git init
```

### **Bước 2: Tạo GitHub Repository**

1. Vào https://github.com
2. Click **"New repository"**
3. Đặt tên repository (ví dụ: `1beauty-asia`)
4. Chọn **Public** hoặc **Private**
5. **KHÔNG** check "Initialize with README" (vì đã có code)
6. Click **"Create repository"**

### **Bước 3: Add Remote**

```bash
git remote add origin https://github.com/username/repo-name.git
```

**Thay thế:**
- `username`: Tên GitHub của bạn
- `repo-name`: Tên repository

### **Bước 4: Add và Commit lần đầu**

```bash
git add .
git commit -m "Initial commit: 1Beauty.asia application"
```

### **Bước 5: Push lần đầu**

```bash
git push -u origin main
```

**Lưu ý:** Nếu branch của bạn là `master`, dùng:
```bash
git push -u origin master
```

---

## 🔐 XÁC THỰC VỚI GITHUB

### **Option 1: Personal Access Token (Khuyến nghị)**

1. Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token"**
3. Chọn quyền: `repo` (full control)
4. Copy token
5. Khi push, dùng token làm password:
   - Username: GitHub username
   - Password: Personal access token

### **Option 2: SSH Key**

1. Tạo SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Add SSH key vào GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Vào GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste key và save

3. Dùng SSH URL:
```bash
git remote set-url origin git@github.com:username/repo-name.git
```

---

## 🌿 QUẢN LÝ BRANCHES

### **Tạo branch mới:**

```bash
git checkout -b feature/optimization
```

### **Chuyển branch:**

```bash
git checkout main
```

### **Push branch mới:**

```bash
git push -u origin feature/optimization
```

### **Xem tất cả branches:**

```bash
git branch -a
```

---

## ⚠️ TROUBLESHOOTING

### **Lỗi 1: "fatal: not a git repository"**

**Nguyên nhân:** Chưa khởi tạo git repository.

**Giải pháp:**
```bash
git init
```

### **Lỗi 2: "fatal: remote origin already exists"**

**Nguyên nhân:** Remote đã tồn tại.

**Giải pháp:**
```bash
# Xem remote hiện tại
git remote -v

# Xóa remote cũ
git remote remove origin

# Thêm remote mới
git remote add origin https://github.com/username/repo.git
```

### **Lỗi 3: "error: failed to push some refs"**

**Nguyên nhân:** Remote có code mới hơn local.

**Giải pháp:**
```bash
# Pull code mới trước
git pull origin main

# Sau đó push lại
git push origin main
```

### **Lỗi 4: "Permission denied"**

**Nguyên nhân:** Không có quyền truy cập repository.

**Giải pháp:**
- Kiểm tra Personal Access Token
- Kiểm tra quyền truy cập repository
- Kiểm tra SSH key (nếu dùng SSH)

---

## 📚 BEST PRACTICES

### **1. Commit thường xuyên:**
- ✅ Commit sau mỗi feature hoàn thành
- ✅ Commit message rõ ràng
- ✅ Không commit code lỗi

### **2. Branch strategy:**
- ✅ `main`: Production code
- ✅ `develop`: Development code
- ✅ `feature/*`: New features
- ✅ `fix/*`: Bug fixes

### **3. Commit message format:**
```
Type: Description

- Fix: Bug fix
- Add: New feature
- Update: Update existing feature
- Refactor: Code refactoring
- Remove: Remove code
- Docs: Documentation
```

**Ví dụ:**
```
Update: Optimize mobile experience

- Add mobile meta tags
- Optimize font loading
- Improve touch interactions
```

---

## ✅ CHECKLIST TRƯỚC KHI PUSH

- [ ] Code đã được test
- [ ] Không có lỗi build (`npm run build`)
- [ ] Không có lỗi lint (`npm run lint`)
- [ ] Commit message rõ ràng
- [ ] Đã chọn đúng branch
- [ ] Đã kiểm tra remote URL

---

## 🎯 KẾT LUẬN

### **Cách nhanh nhất:**
→ Dùng script: `.\scripts\push-to-github.ps1`

### **Cách kiểm soát tốt nhất:**
→ Làm thủ công với các lệnh git

### **Lưu ý:**
- ✅ Luôn kiểm tra code trước khi push
- ✅ Dùng commit message rõ ràng
- ✅ Push lên đúng branch
- ✅ Backup code quan trọng

---

**Tài liệu được tạo bởi:** AI Assistant  
**Ngày:** 2025-01-13  
**Version:** 1.0.0
