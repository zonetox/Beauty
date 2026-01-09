# 🚨 QUICK FIX - SECRETS BỊ LỘ

**Date:** 2025-01-09  
**Priority:** 🔴 CRITICAL - Fix ngay

---

## ✅ TÌNH TRẠNG HIỆN TẠI

Từ Vercel Storage integration, bạn đã có:
- ✅ **Publishable Key mới**: `sb_publishable_4pjxJvJw48bjVJ0WPScWHQ_j3dPX2Fb`
- ✅ **Secret Key mới**: `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll`
- ⚠️ **Service Role Key cũ**: Vẫn còn (legacy JWT)

---

## 🔄 BƯỚC 1: TẠO FILE .env.vercel

Tạo file `.env.vercel` ở project root và paste keys từ Vercel:

```bash
# Tạo file
touch .env.vercel

# Hoặc copy từ Vercel và paste vào file này
```

Paste nội dung này vào `.env.vercel`:

```
SUPABASE_URL="https://fdklazlcbxaiapsnnbqq.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_4pjxJvJw48bjVJ0WPScWHQ_j3dPX2Fb"
SUPABASE_SECRET_KEY="sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka2xhemxjYnhhaWFwc25uYnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NjYzMCwiZXhwIjoyMDc3MTUyNjMwfQ.OSzYvp44VbheYC1zuylRRrdDrrgmcYuC38TQsJcMhoU"
```

---

## 🔄 BƯỚC 2: CHẠY SCRIPT TỰ ĐỘNG

```bash
node scripts/sync-vercel-keys.js
```

Script sẽ:
- ✅ Đọc keys từ `.env.vercel`
- ✅ Update `.env.local` với keys mới
- ✅ Ưu tiên Publishable Key và Secret Key mới

---

## 🔄 BƯỚC 3: UPDATE VERCEL ENVIRONMENT VARIABLES

Vào Vercel Dashboard → Project → Settings → Environment Variables:

1. **Update `VITE_SUPABASE_ANON_KEY`**:
   ```
   VITE_SUPABASE_ANON_KEY=sb_publishable_4pjxJvJw48bjVJ0WPScWHQ_j3dPX2Fb
   ```

2. **Giữ nguyên `VITE_SUPABASE_URL`**:
   ```
   VITE_SUPABASE_URL=https://fdklazlcbxaiapsnnbqq.supabase.co
   ```

---

## 🔄 BƯỚC 4: UPDATE SUPABASE SECRETS (Edge Functions)

Vào Supabase Dashboard → Edge Functions → Secrets:

1. **Update `SUPABASE_SERVICE_ROLE_KEY`**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll
   ```

   Hoặc update trong Dashboard:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll`

---

## ✅ VERIFY

1. **Local Development**:
   ```bash
   npm run dev
   # Kiểm tra app hoạt động
   ```

2. **Edge Functions**:
   - Test function `send-templated-email`
   - Kiểm tra logs trong Supabase Dashboard

3. **Production**:
   - Redeploy trên Vercel
   - Kiểm tra app production hoạt động

---

## 🔍 KIỂM TRA KEYS CŨ CÒN BỊ LỘ KHÔNG

### Keys đã bị lộ (từ git history):
- ❌ `POSTGRES_PASSWORD`: `q1b8nn0MS1YLsOnN` - **ĐÃ BỊ LỘ**
- ❌ `RESEND_API_KEY`: `re_dHNJuyTq_ydiGFqf2RGmtpAR2kBuaURw6` - **ĐÃ BỊ LỘ**
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` (JWT cũ) - **ĐÃ BỊ LỘ**

### Keys mới (an toàn):
- ✅ `SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_4pjxJvJw48bjVJ0WPScWHQ_j3dPX2Fb` - **MỚI, CHƯA BỊ LỘ**
- ✅ `SUPABASE_SECRET_KEY`: `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll` - **MỚI, CHƯA BỊ LỘ**

---

## ⚠️ CẦN ROTATE

1. **PostgreSQL Password**: `q1b8nn0MS1YLsOnN`
   - Vào Supabase Dashboard → Database → Reset Password
   - Update connection strings trong Vercel

2. **Resend API Key**: `re_dHNJuyTq_ydiGFqf2RGmtpAR2kBuaURw6`
   - Vào https://resend.com/api-keys
   - Xóa key cũ, tạo key mới
   - Update trong Supabase Secrets

---

## 📋 CHECKLIST

- [ ] Tạo file `.env.vercel` với keys từ Vercel
- [ ] Chạy `node scripts/sync-vercel-keys.js`
- [ ] Update Vercel environment variables
- [ ] Update Supabase Secrets cho Edge Functions
- [ ] Test local development
- [ ] Test Edge Functions
- [ ] Rotate PostgreSQL password
- [ ] Rotate Resend API Key

---

**Last Updated:** 2025-01-09  
**Status:** ⚠️ **REQUIRES IMMEDIATE ACTION**
