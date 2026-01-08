# VERCEL ENVIRONMENT VARIABLES AUDIT
**Date:** 2025-01-08  
**Purpose:** Kiểm tra và đồng bộ environment variables giữa code và Vercel

---

## 📋 ENVIRONMENT VARIABLES CẦN THIẾT

### Required Variables (Frontend)

#### 1. `VITE_SUPABASE_URL` ✅ REQUIRED
- **Usage:** Supabase project URL
- **Used in:** `lib/supabaseClient.ts`
- **Fallback:** `process.env.SUPABASE_URL` (legacy)
- **Example:** `https://xxxxx.supabase.co`

#### 2. `VITE_SUPABASE_ANON_KEY` ✅ REQUIRED
- **Usage:** Supabase anonymous/public key
- **Used in:** `lib/supabaseClient.ts`
- **Fallback:** `process.env.VITE_SUPABASE_ANON_KEY`, `process.env.SUPABASE_ANON_KEY` (legacy)
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 3. `GEMINI_API_KEY` ⚠️ OPTIONAL
- **Usage:** Google Gemini API key for AI features
- **Used in:** 
  - `components/AIQuickReplyModal.tsx` (via `process.env.API_KEY`)
  - `vite.config.ts` (defined as `process.env.GEMINI_API_KEY` and `process.env.API_KEY`)
- **Note:** Code uses `process.env.API_KEY` but should be `GEMINI_API_KEY` for consistency
- **Example:** `AIzaSy...`

---

## 🔍 CODE ANALYSIS

### Files Using Environment Variables

1. **`lib/supabaseClient.ts`:**
   - `VITE_SUPABASE_URL` (primary)
   - `VITE_SUPABASE_ANON_KEY` (primary)
   - Fallbacks: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (legacy support)

2. **`vite.config.ts`:**
   - `GEMINI_API_KEY` → defined as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`
   - This allows code to use either name

3. **`components/AIQuickReplyModal.tsx`:**
   - Uses `process.env.API_KEY` (which is mapped from `GEMINI_API_KEY` in vite.config.ts)

### Variable Naming Inconsistency ⚠️

**Issue:** Code uses `process.env.API_KEY` but Vercel should have `GEMINI_API_KEY`

**Solution:** 
- Option 1: Keep `GEMINI_API_KEY` in Vercel (recommended)
- Option 2: Add `API_KEY` as alias in Vercel
- Option 3: Update code to use `GEMINI_API_KEY` directly

---

## ✅ CHECKLIST CHO VERCEL

### Required Variables (Must Have)
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional Variables (Nice to Have)
- [ ] `GEMINI_API_KEY` - For AI chatbot features (optional)

### Legacy/Unused Variables (Can Remove)
- [ ] `SUPABASE_URL` - Legacy, not needed if `VITE_SUPABASE_URL` exists
- [ ] `SUPABASE_ANON_KEY` - Legacy, not needed if `VITE_SUPABASE_ANON_KEY` exists
- [ ] `API_KEY` - Legacy, use `GEMINI_API_KEY` instead

---

## 🔄 SYNCHRONIZATION GUIDE

### Step 1: Check Current Vercel Variables

1. Vào Vercel Dashboard
2. Project → Settings → Environment Variables
3. List all variables

### Step 2: Compare with Required

**Required:**
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅

**Optional:**
- `GEMINI_API_KEY` (if using AI features)

### Step 3: Clean Up

**Remove if exists (legacy):**
- `SUPABASE_URL` (use `VITE_SUPABASE_URL` instead)
- `SUPABASE_ANON_KEY` (use `VITE_SUPABASE_ANON_KEY` instead)
- `API_KEY` (use `GEMINI_API_KEY` instead)

### Step 4: Verify

1. Redeploy after changes
2. Test application
3. Check browser console for errors
4. Verify Supabase connection works
5. Test AI features (if enabled)

---

## 📊 VARIABLE MAPPING

| Code Usage | Vercel Variable | Required | Notes |
|------------|----------------|----------|-------|
| `import.meta.env.VITE_SUPABASE_URL` | `VITE_SUPABASE_URL` | ✅ Yes | Primary |
| `import.meta.env.VITE_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Primary |
| `process.env.GEMINI_API_KEY` | `GEMINI_API_KEY` | ⚠️ Optional | For AI features |
| `process.env.API_KEY` | `GEMINI_API_KEY` | ⚠️ Optional | Mapped in vite.config.ts |
| `process.env.SUPABASE_URL` | `VITE_SUPABASE_URL` | ❌ Legacy | Fallback only |
| `process.env.SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | ❌ Legacy | Fallback only |

---

## 🚨 COMMON ISSUES

### Issue 1: Missing VITE_ prefix
**Symptom:** Variables not accessible in frontend  
**Fix:** Ensure variables start with `VITE_` for Vite projects

### Issue 2: Wrong variable name
**Symptom:** `API_KEY` not found  
**Fix:** Use `GEMINI_API_KEY` in Vercel (mapped in vite.config.ts)

### Issue 3: Legacy variables
**Symptom:** Multiple similar variables  
**Fix:** Remove legacy variables, use `VITE_*` versions

---

## ✅ VERIFICATION STEPS

1. **Check Vercel Dashboard:**
   - [ ] `VITE_SUPABASE_URL` exists
   - [ ] `VITE_SUPABASE_ANON_KEY` exists
   - [ ] `GEMINI_API_KEY` exists (if using AI)

2. **Check Build Logs:**
   - [ ] No "undefined" errors
   - [ ] Variables accessible during build

3. **Test Application:**
   - [ ] Supabase connection works
   - [ ] No config errors
   - [ ] AI features work (if enabled)

---

**Last Updated:** 2025-01-08  
**Status:** ⚠️ Pending Vercel project access to verify actual variables
