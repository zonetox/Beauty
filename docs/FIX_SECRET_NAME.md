# 🔧 FIX: SUPABASE KHÔNG CHO TẠO SECRET VỚI PREFIX SUPABASE_

**Date:** 2025-01-09  
**Vấn đề:** Supabase không cho tạo secret với tên bắt đầu bằng `SUPABASE_`

---

## ⚠️ VẤN ĐỀ

Khi tạo secret trong Supabase:
- ❌ `SUPABASE_SECRET_KEY` - **KHÔNG ĐƯỢC** (prefix `SUPABASE_` bị chặn)
- ✅ `SECRET_KEY` - **ĐƯỢC**
- ✅ `SUPABASE_SECRET` - **ĐƯỢC** (không có underscore sau SUPABASE_)

---

## ✅ GIẢI PHÁP

### Option 1: Dùng tên `SECRET_KEY` (Khuyến nghị)

1. Vào Supabase Dashboard → Edge Functions → Secrets
2. Click **"Add Secret"**
3. **Name:** `SECRET_KEY` (KHÔNG có prefix `SUPABASE_`)
4. **Value:** `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll`
5. Click **"Save"**

### Option 2: Dùng tên `SUPABASE_SECRET` (không có underscore)

1. **Name:** `SUPABASE_SECRET`
2. **Value:** `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll`

---

## 🔄 UPDATE EDGE FUNCTIONS CODE

Update các Edge Functions để dùng tên secret mới:

### Code mới (dùng `SECRET_KEY`):

```typescript
// supabase/functions/your-function/index.ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SECRET_KEY') ?? 
  Deno.env.get('SUPABASE_SECRET') ?? 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
```

---

## 📋 CHECKLIST

- [ ] Tạo secret `SECRET_KEY` trong Supabase Secrets
- [ ] Update Edge Functions code (nếu cần)
- [ ] Test Edge Functions hoạt động
- [ ] Verify logs trong Supabase Dashboard

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Solution ready
