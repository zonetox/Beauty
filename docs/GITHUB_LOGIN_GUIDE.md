# HƯỚNG DẪN ĐĂNG NHẬP GITHUB VÀ PUSH CODE

**Date:** 2025-01-11  
**Mục đích:** Hướng dẫn đăng nhập GitHub với tài khoản `zonetox` và push code

---

## 🔐 PHƯƠNG PHÁP 1: SỬ DỤNG PERSONAL ACCESS TOKEN (KHUYẾN NGHỊ)

### Bước 1: Tạo Personal Access Token trên GitHub

1. **Đăng nhập GitHub:**
   - Vào: https://github.com/login
   - Đăng nhập với tài khoản `zonetox`

2. **Tạo Personal Access Token:**
   - Vào: https://github.com/settings/tokens
   - Click: **Generate new token** → **Generate new token (classic)**
   - **Note:** `Beauty Project Token`
   - **Expiration:** Chọn thời hạn (ví dụ: 90 days hoặc No expiration)
   - **Select scopes:** Chọn ít nhất:
     - ✅ `repo` (Full control of private repositories)
   - Click: **Generate token**
   - **⚠️ QUAN TRỌNG:** Copy token ngay (chỉ hiển thị 1 lần)

### Bước 2: Cấu hình Git với Token

**Cách 1: Sử dụng Token trong URL (Tạm thời)**

```bash
# Update remote URL với token
git remote set-url origin https://zonetox:YOUR_TOKEN@github.com/zonetox/Beauty.git

# Push code
git push origin main
```

**⚠️ LƯU Ý:** 
- Thay `YOUR_TOKEN` bằng Personal Access Token vừa tạo
- Token sẽ lưu trong URL (có thể thấy trong git config)
- Không commit token vào code!

**Cách 2: Sử dụng Git Credential Helper (An toàn hơn)**

```bash
# Windows - Sử dụng Windows Credential Manager
git config --global credential.helper manager-core

# Khi push, Git sẽ hỏi username và password
# Username: zonetox
# Password: YOUR_TOKEN (dùng token thay vì password)
git push origin main
```

---

## 🔐 PHƯƠNG PHÁP 2: SỬ DỤNG GITHUB CLI (GH)

### Bước 1: Cài đặt GitHub CLI

**Windows (Scoop):**
```powershell
scoop install gh
```

**Windows (Chocolatey):**
```powershell
choco install gh
```

**Windows (Winget):**
```powershell
winget install GitHub.cli
```

### Bước 2: Đăng nhập

```bash
# Đăng nhập interactive
gh auth login

# Chọn:
# - GitHub.com
# - HTTPS
# - Authenticate Git with your GitHub credentials? Yes
# - Login with a web browser? Yes (sẽ mở browser để đăng nhập)
```

### Bước 3: Verify đăng nhập

```bash
# Kiểm tra trạng thái
gh auth status

# Kiểm tra username
gh api user --jq .login
```

### Bước 4: Push code

```bash
git push origin main
```

---

## 🔐 PHƯƠNG PHÁP 3: SỬ DỤNG SSH KEY

### Bước 1: Tạo SSH Key (nếu chưa có)

```bash
# Tạo SSH key
ssh-keygen -t ed25519 -C "zonetox@github.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

### Bước 2: Thêm SSH Key vào GitHub

1. Vào: https://github.com/settings/keys
2. Click: **New SSH key**
3. **Title:** `Beauty Project`
4. **Key:** Paste public key
5. Click: **Add SSH key**

### Bước 3: Update Remote URL

```bash
# Change remote URL to SSH
git remote set-url origin git@github.com:zonetox/Beauty.git

# Push code
git push origin main
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Bảo mật Token/Key
- ✅ **KHÔNG** commit token vào code
- ✅ **KHÔNG** share token với người khác
- ✅ **KHÔNG** push token vào GitHub
- ✅ Sử dụng `.gitignore` để ignore files chứa token

### 2. Git Config

**Kiểm tra config hiện tại:**
```bash
git config --global user.name
git config --global user.email
git config --global credential.helper
```

**Update config (nếu cần):**
```bash
git config --global user.name "zonetox"
git config --global user.email "your-email@example.com"
```

### 3. Remote URL

**Kiểm tra remote URL:**
```bash
git remote -v
```

**Update remote URL:**
```bash
# HTTPS
git remote set-url origin https://github.com/zonetox/Beauty.git

# SSH
git remote set-url origin git@github.com:zonetox/Beauty.git
```

---

## 🚀 QUICK START (KHUYẾN NGHỊ)

**Nếu bạn đã có Personal Access Token:**

```bash
# 1. Update remote URL với token
git remote set-url origin https://zonetox:YOUR_TOKEN@github.com/zonetox/Beauty.git

# 2. Push code
git push origin main

# 3. (Optional) Reset remote URL về không có token (sau khi push)
git remote set-url origin https://github.com/zonetox/Beauty.git
```

**Nếu chưa có token:**
1. Tạo token tại: https://github.com/settings/tokens
2. Copy token
3. Chạy lệnh trên với token

---

## 📋 TROUBLESHOOTING

### Lỗi: `Permission denied`

**Nguyên nhân:**
- Token không đúng
- Token không có quyền `repo`
- Tài khoản không có quyền push vào repository

**Giải pháp:**
1. Kiểm tra token có quyền `repo`
2. Tạo token mới
3. Kiểm tra bạn có quyền push vào repository

### Lỗi: `Repository not found`

**Nguyên nhân:**
- Repository không tồn tại
- Tài khoản không có quyền truy cập

**Giải pháp:**
1. Kiểm tra repository: https://github.com/zonetox/Beauty
2. Kiểm tra bạn có quyền truy cập
3. Kiểm tra remote URL: `git remote -v`

### Lỗi: `Authentication failed`

**Nguyên nhân:**
- Username/password không đúng
- Token đã hết hạn

**Giải pháp:**
1. Tạo token mới
2. Update remote URL với token mới
3. Clear credential cache: `git credential-manager-core erase`

---

## ✅ VERIFICATION

**Sau khi push thành công:**

```bash
# Kiểm tra remote branches
git branch -r

# Kiểm tra commit history
git log --oneline -5

# Kiểm tra status
git status
```

---

**END OF GUIDE**
