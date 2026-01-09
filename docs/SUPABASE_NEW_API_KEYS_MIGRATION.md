# 🔐 SUPABASE API KEYS MỚI - HƯỚNG DẪN MIGRATION

**Date:** 2025-01-09  
**Status:** ✅ Code đã hỗ trợ cả 2 loại keys

---

## 📋 TỔNG QUAN

Supabase đã giới thiệu hệ thống API keys mới:

### Keys Cũ (Legacy - vẫn hoạt động):
- **Anon Key** (`eyJ...`) - JWT token, dùng cho frontend
- **Service Role Key** (`eyJ...`) - JWT token, dùng cho backend/Edge Functions

### Keys Mới (Recommended):
- **Publishable Key** (`sb_publishable_...`) - Thay thế Anon Key
- **Secret Key** (`sb_secret_...`) - Thay thế Service Role Key

---

## ✅ CODE ĐÃ HỖ TRỢ CẢ 2 LOẠI

Code hiện tại **đã tương thích** với cả keys cũ và mới:

### Frontend (`lib/supabaseClient.ts`):
- ✅ Hỗ trợ cả `VITE_SUPABASE_ANON_KEY` (JWT) và Publishable Key
- ✅ `@supabase/supabase-js` tự động nhận diện loại key
- ✅ Không cần thay đổi code

### Edge Functions:
- ✅ Hỗ trợ cả `SUPABASE_SERVICE_ROLE_KEY` (JWT) và Secret Key
- ✅ `createClient()` tự động nhận diện loại key
- ✅ Không cần thay đổi code

---

## 🔄 CÁCH SỬ DỤNG KEYS MỚI

### Bước 1: Tạo Keys Mới trong Supabase Dashboard

1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/api
2. Tab: **"Publishable and secret API keys"**
3. Tạo keys mới:
   - **Publishable Key** (cho frontend)
   - **Secret Key** (cho Edge Functions)

### Bước 2: Update Environment Variables

#### Frontend (Vercel):
```bash
# Thay thế VITE_SUPABASE_ANON_KEY bằng Publishable Key
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_NEW_KEY_HERE
```

#### Edge Functions (Supabase Secrets):
```bash
# Thay thế SUPABASE_SERVICE_ROLE_KEY bằng Secret Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_NEW_KEY_HERE
```

### Bước 3: Verify

- ✅ Frontend hoạt động bình thường
- ✅ Edge Functions hoạt động bình thường
- ✅ Authentication hoạt động
- ✅ Database queries hoạt động

---

## 📝 SO SÁNH

| Feature | Legacy Keys (JWT) | New Keys |
|---------|-------------------|----------|
| **Format** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | `sb_publishable_...` / `sb_secret_...` |
| **Type** | JWT Token | API Key |
| **Anon Key** | `eyJ...` | `sb_publishable_...` |
| **Service Role** | `eyJ...` | `sb_secret_...` |
| **Compatibility** | ✅ Hoạt động | ✅ Hoạt động |
| **Recommended** | ⚠️ Deprecated | ✅ Recommended |

---

## ⚠️ LƯU Ý

1. **Backward Compatible**: Code hiện tại hoạt động với cả 2 loại keys
2. **No Code Changes**: Không cần thay đổi code, chỉ cần update env variables
3. **Timeline**:
   - Oct 2025: Auto migration
   - Nov 2025: Bắt đầu cảnh báo
   - End 2026: Bắt buộc chuyển đổi
4. **Keys Cũ Vẫn Hoạt Động**: Bạn có thể tiếp tục dùng keys cũ cho đến khi bắt buộc chuyển đổi

---

## 🔧 CODE IMPLEMENTATION

### Frontend (`lib/supabaseClient.ts`):
```typescript
// Hỗ trợ cả JWT và Publishable Key
const supabaseAnonKey = isSupabaseConfigured ? supabaseAnonKeyFromEnv : 'dummy-key';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    // @supabase/supabase-js tự động nhận diện loại key
});
```

### Edge Functions:
```typescript
// Hỗ trợ cả JWT và Secret Key
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Có thể là JWT hoặc Secret Key
);
```

---

## ✅ CHECKLIST

### Nếu dùng Keys Mới:
- [ ] Tạo Publishable Key trong Supabase Dashboard
- [ ] Tạo Secret Key trong Supabase Dashboard
- [ ] Update `VITE_SUPABASE_ANON_KEY` trong Vercel
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY` trong Supabase Secrets
- [ ] Test frontend hoạt động
- [ ] Test Edge Functions hoạt động

### Nếu tiếp tục dùng Keys Cũ:
- [x] Code đã hỗ trợ sẵn
- [x] Không cần thay đổi gì
- [ ] Lên kế hoạch migration trước End 2026

---

## 🎯 KẾT LUẬN

**Bạn có thể dùng keys mới ngay bây giờ!**

- ✅ Code đã hỗ trợ sẵn
- ✅ Chỉ cần update environment variables
- ✅ Không cần thay đổi code
- ✅ Backward compatible với keys cũ

**Khuyến nghị:** Chuyển sang keys mới để:
- ✅ Bảo mật tốt hơn
- ✅ Quản lý dễ hơn
- ✅ Tuân thủ best practices
- ✅ Tránh deprecated warnings

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Ready to use new keys
