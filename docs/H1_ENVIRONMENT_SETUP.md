# H1 - Environment Management Setup Guide

**Tuân thủ Master Plan v1.1**  
**Date:** 2025-01-08

---

## 📋 Tổng quan

File này hướng dẫn setup environment variables cho 1Beauty.asia project.

---

## 🔑 Environment Variables Required

### 1. Supabase Configuration (REQUIRED)

**Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Nơi lấy:**
1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Settings → API
4. Copy **Project URL** và **anon public** key

**Setup:**
- **Local:** Thêm vào `.env.local`
- **Vercel:** Settings → Environment Variables → Add

**⚠️ Lưu ý:**
- `VITE_*` variables được expose ra frontend
- Anon key là public, nhưng vẫn cần RLS policies để bảo vệ data

---

### 2. Gemini AI API (OPTIONAL)

**Variable:**
- `GEMINI_API_KEY` - Google Gemini API key

**Nơi lấy:**
1. Vào Google AI Studio: https://makersuite.google.com/app/apikey
2. Tạo API key mới
3. Copy key

**Setup:**
- **Local:** Thêm vào `.env.local`
- **Vercel:** Settings → Environment Variables → Add

**⚠️ Lưu ý:**
- Chỉ cần nếu sử dụng AI chatbot feature
- Không expose ra frontend (không có prefix `VITE_`)

---

### 3. Resend API Key (REQUIRED for Email)

**Variable:**
- `RESEND_API_KEY` - Resend API key for sending emails

**Nơi lấy:**
1. Vào Resend Dashboard: https://resend.com/api-keys
2. Tạo API key mới
3. Copy key

**Setup:**
- **⚠️ QUAN TRỌNG:** Không set trong `.env.local` hoặc Vercel env
- **Set trong Supabase Dashboard:**
  1. Vào Supabase Dashboard → Project Settings
  2. Edge Functions → Secrets
  3. Add secret: `RESEND_API_KEY` = `your-resend-api-key`

**⚠️ Lưu ý:**
- Đây là server-side secret, chỉ dùng trong Edge Functions
- Không được expose ra frontend

---

## 📁 File Structure

```
Beauty-main/
├── .env.local.example          # Template file (committed)
├── .env.local                  # Your local env (NOT committed, gitignored)
└── docs/
    └── H1_ENVIRONMENT_SETUP.md # This file
```

---

## 🚀 Setup Instructions

### Local Development

1. **Copy template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in values:**
   - Mở `.env.local`
   - Thay thế placeholder values với actual values
   - Lưu file

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Vercel Production

1. **Vào Vercel Dashboard:**
   - Project → Settings → Environment Variables

2. **Add variables:**
   - `VITE_SUPABASE_URL` = `your-supabase-url`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
   - `GEMINI_API_KEY` = `your-gemini-key` (optional)

3. **Redeploy:**
   - Vercel sẽ tự động redeploy khi env variables thay đổi

### Supabase Edge Functions

1. **Vào Supabase Dashboard:**
   - Project Settings → Edge Functions → Secrets

2. **Add secret:**
   - Key: `RESEND_API_KEY`
   - Value: `your-resend-api-key`

3. **Verify:**
   - Edge Functions sẽ tự động có access đến secret này
   - Không cần config thêm

---

## ✅ Verification Checklist

- [ ] `.env.local.example` created
- [ ] `.env.local` created (local only, not committed)
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] `GEMINI_API_KEY` set (if using chatbot)
- [ ] `RESEND_API_KEY` set in Supabase secrets
- [ ] Vercel env variables configured (for production)
- [ ] Local dev server runs without errors
- [ ] Supabase connection works
- [ ] Email sending works (test Edge Function)

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Never commit real API keys** - Use `.env.local.example` as template only
3. **Use Supabase secrets** for server-side keys (RESEND_API_KEY)
4. **VITE_* variables** are exposed to frontend - Only use for public keys
5. **Rotate keys regularly** - Especially if exposed

---

## 📝 Environment Variable Reference

| Variable | Type | Required | Where | Exposed to Frontend |
|----------|------|----------|-------|---------------------|
| `VITE_SUPABASE_URL` | String | ✅ Yes | `.env.local`, Vercel | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | String | ✅ Yes | `.env.local`, Vercel | ✅ Yes |
| `GEMINI_API_KEY` | String | ❌ Optional | `.env.local`, Vercel | ❌ No |
| `RESEND_API_KEY` | String | ✅ Yes | Supabase Secrets | ❌ No |

---

## 🆘 Troubleshooting

### "Supabase not configured" error

**Cause:** Missing or invalid Supabase credentials

**Fix:**
1. Check `.env.local` exists and has correct values
2. Verify `VITE_SUPABASE_URL` starts with `https://`
3. Verify `VITE_SUPABASE_ANON_KEY` is not placeholder
4. Restart dev server

### Email not sending

**Cause:** Missing or invalid RESEND_API_KEY

**Fix:**
1. Check Supabase Dashboard → Edge Functions → Secrets
2. Verify `RESEND_API_KEY` is set
3. Verify key is valid in Resend Dashboard
4. Check Edge Function logs for errors

### Build fails on Vercel

**Cause:** Missing environment variables

**Fix:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure all required variables are set
3. Redeploy after adding variables

---

**Last Updated:** 2025-01-08
