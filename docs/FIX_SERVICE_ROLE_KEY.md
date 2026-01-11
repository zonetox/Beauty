# 🔧 FIX: SUPABASE_SERVICE_ROLE_KEY KHÔNG THỂ SỬA

**Date:** 2025-01-09  
**Vấn đề:** Supabase không cho sửa `SUPABASE_SERVICE_ROLE_KEY` (RESERVED secret)

---

## ⚠️ VẤN ĐỀ

Từ Supabase Dashboard, bạn thấy:
- `SUPABASE_SERVICE_ROLE_KEY` là **RESERVED SECRET** - không thể sửa
- Bạn muốn dùng Secret Key mới: `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll`

---

## ✅ GIẢI PHÁP

### Option 1: Tạo Secret Mới Tên `SECRET_KEY` (Khuyến nghị)

⚠️ **LƯU Ý:** Supabase không cho tên secret bắt đầu bằng `SUPABASE_`

1. Vào Supabase Dashboard → Edge Functions → Secrets
2. Click **"Add Secret"**
3. **Name:** `SECRET_KEY` (KHÔNG có prefix `SUPABASE_`)
4. **Value:** `sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll`
5. Click **"Save"**

### Option 2: Update Code để Dùng Secret Key Mới

Edge Functions sẽ tự động dùng `SECRET_KEY` nếu có, fallback về `SUPABASE_SERVICE_ROLE_KEY`:

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

## 🔄 UPDATE EDGE FUNCTIONS

Các functions cần update:

1. `approve-registration/index.ts`
2. `create-admin-user/index.ts`
3. `generate-sitemap/index.ts`

**Code mới:**
```typescript
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
```

---

## 📋 CHECKLIST

- [ ] Tạo secret `SECRET_KEY` trong Supabase Secrets (KHÔNG dùng prefix `SUPABASE_`)
- [x] Edge Functions code đã được update (tự động dùng `SECRET_KEY`)
- [ ] Test Edge Functions hoạt động
- [ ] Verify logs trong Supabase Dashboard

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Solution ready
