# 🚀 HƯỚNG DẪN NHANH - FIX TẤT CẢ

**Date:** 2025-01-09  
**Mục đích:** Fix nhanh tất cả vấn đề

---

## ✅ BƯỚC 1: SẮP XẾP LẠI .env.vercel

```bash
node scripts/fix-env-vercel.js
```

Script sẽ:
- ✅ Sắp xếp lại keys theo thứ tự logic
- ✅ Loại bỏ duplicates
- ✅ Tạo/cập nhật .env.local tự động

---

## ✅ BƯỚC 2: TẠO SECRET MỚI TRONG SUPABASE

Vì `SUPABASE_SERVICE_ROLE_KEY` là RESERVED (không thể sửa) và Supabase không cho prefix `SUPABASE_`:

1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/functions/secrets
2. Click **"Add Secret"**
3. **Name:** `SECRET_KEY` (KHÔNG có prefix `SUPABASE_`)
4. **Value:** `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll` (từ .env.vercel)
5. Click **"Save"**

⚠️ **LƯU Ý:** Supabase không cho tên secret bắt đầu bằng `SUPABASE_`, nên dùng `SECRET_KEY` thay vì `SUPABASE_SECRET_KEY`

---

## ✅ BƯỚC 3: ĐỔI POSTGRES_PASSWORD

1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/database
2. Tìm section **"Database Password"**
3. Click **"Reset Database Password"**
4. Copy password mới
5. Update trong Vercel Environment Variables:
   - `POSTGRES_PASSWORD` = password mới
   - `POSTGRES_URL` = update với password mới
   - `POSTGRES_PRISMA_URL` = update với password mới

---

## ✅ BƯỚC 4: UPDATE VERCEL ENVIRONMENT VARIABLES

Vào Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://fdklazlcbxaiapsnnbqq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4pjxJvJw48bjVJ0WPScWHQ_j3dPX2Fb
```

---

## ✅ BƯỚC 5: TEST

1. **Local:**
   ```bash
   npm run dev
   ```

2. **Edge Functions:**
   - Test function `send-templated-email`
   - Kiểm tra logs

3. **Production:**
   - Redeploy trên Vercel
   - Test app production

---

## 📋 TÓM TẮT

- ✅ `.env.vercel` đã được sắp xếp
- ✅ Edge Functions đã hỗ trợ `SUPABASE_SECRET_KEY`
- ✅ Tạo secret mới trong Supabase
- ✅ Đổi POSTGRES_PASSWORD
- ✅ Update Vercel env vars

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Ready to execute
