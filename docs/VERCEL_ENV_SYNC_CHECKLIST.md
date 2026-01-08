# VERCEL ENVIRONMENT VARIABLES - SYNC CHECKLIST
**Project:** beauty  
**Project ID:** prj_tGwmhzNL7ASTN71iRELzfOsyB8oU  
**Date:** 2025-01-08

---

## 📋 KIỂM TRA ENVIRONMENT VARIABLES

### Bước 1: Vào Vercel Dashboard

1. Truy cập: https://vercel.com/dashboard
2. Chọn project: **beauty**
3. Settings → **Environment Variables**

### Bước 2: Kiểm tra từng biến

#### ✅ REQUIRED - Phải có

**1. `VITE_SUPABASE_URL`**
- [ ] **Có tồn tại?** Yes/No
- [ ] **Giá trị:** `https://xxxxx.supabase.co`
- [ ] **Environments:** Production, Preview, Development
- [ ] **Action:** Nếu thiếu → Add

**2. `VITE_SUPABASE_ANON_KEY`**
- [ ] **Có tồn tại?** Yes/No
- [ ] **Giá trị:** Bắt đầu với `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] **Environments:** Production, Preview, Development
- [ ] **Action:** Nếu thiếu → Add

#### ⚠️ OPTIONAL - Tùy chọn

**3. `GEMINI_API_KEY`**
- [ ] **Có tồn tại?** Yes/No
- [ ] **Giá trị:** Bắt đầu với `AIzaSy...`
- [ ] **Environments:** Production, Preview (nếu cần)
- [ ] **Action:** Nếu thiếu và cần AI features → Add

#### ❌ LEGACY - Có thể xóa

**4. `SUPABASE_URL` (Legacy)**
- [ ] **Có tồn tại?** Yes/No
- [ ] **Action:** Nếu có → Xóa (đã có `VITE_SUPABASE_URL`)

**5. `SUPABASE_ANON_KEY` (Legacy)**
- [ ] **Có tồn tại?** Yes/No
- [ ] **Action:** Nếu có → Xóa (đã có `VITE_SUPABASE_ANON_KEY`)

**6. `API_KEY` (Legacy)**
- [ ] **Có tồn tại?** Yes/No
- [ ] **Action:** Nếu có → Xóa hoặc đổi tên thành `GEMINI_API_KEY`

**7. Các biến khác không liên quan**
- [ ] **List các biến khác:**
  - `_________________`
  - `_________________`
  - `_________________`
- [ ] **Action:** Xác định xem có cần thiết không

---

## 🔄 ĐỒNG BỘ HÓA

### Nếu thiếu biến REQUIRED:

1. **Add `VITE_SUPABASE_URL`:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   - Environments: Production, Preview, Development

2. **Add `VITE_SUPABASE_ANON_KEY`:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `your-anon-key-from-supabase`
   - Environments: Production, Preview, Development

3. **Add `GEMINI_API_KEY` (nếu cần):**
   - Key: `GEMINI_API_KEY`
   - Value: `your-gemini-api-key`
   - Environments: Production, Preview (optional)

### Nếu có biến LEGACY:

1. **Xóa `SUPABASE_URL`** (nếu có `VITE_SUPABASE_URL`)
2. **Xóa `SUPABASE_ANON_KEY`** (nếu có `VITE_SUPABASE_ANON_KEY`)
3. **Xóa hoặc đổi tên `API_KEY`** → `GEMINI_API_KEY`

---

## ✅ VERIFICATION

Sau khi đồng bộ, kiểm tra:

1. **Redeploy:**
   - [ ] Trigger new deployment
   - [ ] Check build logs for errors

2. **Test Application:**
   - [ ] Homepage loads
   - [ ] Supabase connection works
   - [ ] No config errors in console
   - [ ] AI features work (nếu có `GEMINI_API_KEY`)

3. **Check Browser Console:**
   - [ ] No "undefined" errors
   - [ ] No "missing environment variable" errors

---

## 📊 SUMMARY

### Required Variables Status:
- [ ] `VITE_SUPABASE_URL` - ✅/❌
- [ ] `VITE_SUPABASE_ANON_KEY` - ✅/❌

### Optional Variables Status:
- [ ] `GEMINI_API_KEY` - ✅/❌/N/A

### Legacy Variables Status:
- [ ] `SUPABASE_URL` - ✅/❌ (should be ❌)
- [ ] `SUPABASE_ANON_KEY` - ✅/❌ (should be ❌)
- [ ] `API_KEY` - ✅/❌ (should be ❌ or renamed)

### Other Variables:
- [ ] List: `_________________`

---

## 🎯 TARGET STATE

**Ideal Vercel Environment Variables:**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy... (optional)
```

**No legacy variables:**
- ❌ `SUPABASE_URL`
- ❌ `SUPABASE_ANON_KEY`
- ❌ `API_KEY`

---

**Last Updated:** 2025-01-08  
**Next Step:** Fill in checklist và sync variables
