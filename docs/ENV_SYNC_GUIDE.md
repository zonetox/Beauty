# ENVIRONMENT VARIABLES SYNC GUIDE
**Date:** 2025-01-08  
**Purpose:** Hướng dẫn đồng bộ environment variables từ Vercel về local

---

## 🎯 MỤC ĐÍCH

Đồng bộ environment variables từ Vercel Dashboard về file local (`.env.local`) để:
- Phát triển local với cùng config như production
- Kiểm tra tính đầy đủ của environment variables
- Đảm bảo không thiếu biến nào

---

## 📋 CÁC BƯỚC

### Bước 1: Export từ Vercel Dashboard

1. **Vào Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Chọn project: **beauty**

2. **Export Environment Variables:**
   - Settings → **Environment Variables**
   - Copy tất cả variables (hoặc screenshot)
   - Format: `VARIABLE_NAME=value` (mỗi dòng một biến)

3. **Tạo file `.env.vercel`:**
   ```bash
   # Tạo file trong project root
   touch .env.vercel
   ```

4. **Paste vào file:**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   GEMINI_API_KEY=AIzaSy...
   ```

### Bước 2: Chạy Script Sync

```bash
npm run env:sync
```

Hoặc:
```bash
node scripts/sync-env.js
```

**Script sẽ:**
- ✅ Đọc `.env.vercel`
- ✅ Validate từng biến
- ✅ Kiểm tra required variables
- ✅ Phát hiện legacy variables
- ✅ Tạo `.env.local` nếu valid

### Bước 3: Verify Completeness

```bash
npm run env:verify
```

Hoặc:
```bash
node scripts/verify-env-complete.js
```

**Script sẽ:**
- ✅ Kiểm tra tất cả required variables
- ✅ Validate format
- ✅ Báo cáo missing/invalid variables
- ✅ Đưa ra recommendations

---

## ✅ REQUIRED VARIABLES

### 1. `VITE_SUPABASE_URL` ✅ REQUIRED
- **Format:** `https://xxxxx.supabase.co`
- **Validation:** Must start with `https://`
- **Example:** `https://abcdefghijklmnop.supabase.co`

### 2. `VITE_SUPABASE_ANON_KEY` ✅ REQUIRED
- **Format:** JWT token starting with `eyJ`
- **Validation:** Must start with `eyJ`, length > 100
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. `GEMINI_API_KEY` ⚠️ OPTIONAL
- **Format:** Google API key starting with `AIza`
- **Validation:** Must start with `AIza` (if set)
- **Example:** `AIzaSy...`
- **Note:** Chỉ cần nếu sử dụng AI features

---

## 🚨 COMMON ISSUES

### Issue 1: File `.env.vercel` không tồn tại
**Error:** `❌ Error: .env.vercel file not found!`

**Fix:**
1. Export từ Vercel Dashboard
2. Tạo file `.env.vercel` trong project root
3. Paste variables vào file

### Issue 2: Missing Required Variables
**Error:** `❌ Missing Required Variables: VITE_SUPABASE_URL`

**Fix:**
1. Kiểm tra Vercel Dashboard
2. Đảm bảo tất cả required variables đã được set
3. Re-export và update `.env.vercel`

### Issue 3: Invalid Format
**Error:** `❌ Invalid Variables: VITE_SUPABASE_URL: Must start with https://`

**Fix:**
1. Kiểm tra giá trị trong Vercel Dashboard
2. Đảm bảo format đúng
3. Update `.env.vercel`

### Issue 4: Legacy Variables
**Warning:** `⚠️ Legacy Variables (should be removed): SUPABASE_URL`

**Fix:**
1. Xóa legacy variables từ Vercel Dashboard
2. Chỉ giữ `VITE_*` versions

---

## 📊 SCRIPT OUTPUT

### Success Example:
```
🔄 Syncing Environment Variables from Vercel...

✅ Read 3 variables from .env.vercel

📊 Analysis Results:

✅ Valid Variables Found:
   - VITE_SUPABASE_URL = https://xxxxx.supabase.co
   - VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   - GEMINI_API_KEY = AIzaSy...

✅ Created .env.local with 3 variables

✅ Verification:
   - All required variables present
   - All values validated
   - .env.local created successfully
   - Ready for local development

🎉 Sync complete! You can now run: npm run dev
```

### Error Example:
```
📊 Analysis Results:

❌ Missing Required Variables:
   - VITE_SUPABASE_URL

⚠️  Invalid Variables:
   - VITE_SUPABASE_ANON_KEY: Contains placeholder

❌ Sync failed. Please fix the issues above and try again.
```

---

## 🔄 WORKFLOW

### Initial Setup:
1. Export từ Vercel → `.env.vercel`
2. Run `npm run env:sync`
3. Verify với `npm run env:verify`
4. Start dev: `npm run dev`

### After Vercel Changes:
1. Re-export từ Vercel → `.env.vercel`
2. Run `npm run env:sync` (sẽ update `.env.local`)
3. Verify với `npm run env:verify`

### Regular Check:
- Run `npm run env:verify` trước khi start dev
- Đảm bảo không có missing/invalid variables

---

## 📝 FILE STRUCTURE

```
Beauty-main/
├── .env.vercel          # Exported from Vercel (gitignored)
├── .env.local            # Synced local env (gitignored)
├── docs/
│   └── env.example       # Template (committed)
└── scripts/
    ├── sync-env.js       # Sync script
    └── verify-env-complete.js  # Verification script
```

---

## ✅ CHECKLIST

- [ ] Exported variables từ Vercel Dashboard
- [ ] Created `.env.vercel` file
- [ ] Ran `npm run env:sync`
- [ ] All required variables present
- [ ] All values validated
- [ ] `.env.local` created
- [ ] Ran `npm run env:verify`
- [ ] Verification passed
- [ ] Ready for local development

---

**Last Updated:** 2025-01-08  
**Status:** ✅ Ready to use
